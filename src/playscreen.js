/* demoquest - An adventure game demo with parallax scrolling
 * Copyright (C) 2017  Peter Rogers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Logic = require("./logic");
var Events = require("./events");
var Dialog = require("./dialog");
var Scene = require("./scene");
var Utils = require("./utils");

class DragState {
    constructor () {
	// An average estimate of the drag speed in the X-direction
	this.velocityX = null;
	// The mouse cursor position when the player started dragging around
	this.startX = null;
	this.startY = null;
	this.lastX = null;
	this.lastY = null;
	this.lastTime = 0;
	// The thing being dragged around, or null if no dragging is happening
	// or the player is panning around instead.
	this.thing = null;
    }

    // Call when the player starts dragging
    start(tm, x, y) {
	this.lastTime = tm;
	this.startX = x;
	this.startY = y;
	this.lastX = x;
	this.lastY = y;
	this.velocityX = 0;
    }

    // Call periodically to update the dragging state. This maintains
    // an estimate of the drag speed. (used to keep the screen moving
    // a little after the player stops dragging it around)
    update(tm, x, y) {
	var weight = 0.75;
	var velx = (x - this.lastX) / (tm-this.lastTime);
	this.velocityX = (1-weight)*this.velocityX + weight*velx;
	this.lastX = x;
	this.lastY = y;
	this.lastTime = tm;
    }

    // Call when the player stops dragging
    stop() {
	this.thing = null;
	this.startX = null;
	this.startY = null;
	this.lastX = null;
	this.lastY = null;
    }

    isActive() {
	return (this.startX != null);
    }
};

/**************/
/* PlayScreen */
/**************/

function PlayScreen(gameLogic, dataList, width, height)
{
    this.name = "PlayScreen";
    // The scene currently displayed (Scene instance)
    this.scene = null;
    // The gameplay logic
    this.gameLogic = gameLogic;
    // The collection of all scenes (SceneData) in the game
    this.sceneDataList = dataList;
    // The top-level PIXI container that holds the scene sprites. This 
    // container gets scaled to fit the canvas.
    this.stage = new PIXI.Container();
    this.sceneStage = new PIXI.Container();
    this.stage.addChild(this.sceneStage);
    // The size of the viewing area
    this.viewWidth = width;
    this.viewHeight = height;
    this.isScenePaused = false;
    this.isCutscene = 0;
    this.dragState = new DragState();
    // List of animation callback functions
    this.updateCallbacks = [];
    // Setup some events for communicating with the main game state
    var mgr = new Events.EventManager();
    this.onCamera = mgr.hook("camera");
    this.onComplete = mgr.hook("complete");
    this.onGameOver = mgr.hook("gameover");
    this.onRedraw = mgr.hook("redraw");
    this.onResize = mgr.hook("resize");
    this.onClick = mgr.hook("click");
    this.onDragStart = mgr.hook("dragStart");
    this.onDragStop = mgr.hook("dragStop");
    this.onDrag = mgr.hook("drag");
    //this.onVisible = mgr.hook("thing-visible");
    this.dispatch = mgr.dispatcher();
    this.redraw = mgr.dispatcher("redraw");
    this.eventManager = mgr;
    this.dialog = null;
    // Create a new dialog box
    this.dialog = new Dialog(
	this.viewWidth, 
	this.viewHeight, 
	this.stage, 
	{
	    fill: "black",
	    background: "white"
	}
    );

    this.dialog.onUpdate(this.addUpdate.bind(this));
    this.dialog.onRedraw(this.redraw.bind(this));
    this.dialog.onClosing(cb => {
	this.resume();
	this.leaveCutscene();
    });
    this.dialog.onOpening(cb => {
	this.pause();
	this.enterCutscene();
    });
}

/* Called for every frame that is rendered by the game state. (called before
 * rendering to screen) Returns true to request another frame be rendered 
 * after this one, or false otherwise. */
PlayScreen.prototype.update = function(dt)
{
    let lst = [];
    let redraw = false;
    for (var callback of this.updateCallbacks) {
	let ret = callback(dt);
	if (ret === true) redraw = true;
	if (ret !== false) {
	    lst.push(callback);
	}
    }
    this.updateCallbacks = lst;
    // Request more redraws while there is stuff to animate (via callbacks)
    return this.updateCallbacks.length > 0;
}

/* Register an function to be called for every frame of animation. The handler
 * can return a code to indicate what it needs:
 * 
 * true => request a redraw of the screen
 * false => unregister the update handler
 * undefined => keep calling the handler, but a redraw is not requested
 * 
 */
PlayScreen.prototype.addUpdate = function()
{
    console.log("ADD UPDATE: " + arguments);
    let callbacks = Array.prototype.slice.call(arguments);
    let callback = function(dt) 
    {
        if (callbacks.length === 0) return false;
        let ret = callbacks[0](dt);
	if (ret === false) {
	    console.log("REMOVE UPDATE");
            callbacks.shift();
	}
	return callbacks.length > 0;
    }
    this.updateCallbacks.push(callback);
    this.redraw();
}

PlayScreen.prototype.updater = function(cb)
{
    return new Promise((resolve, reject) => {
	this.addUpdate(dt => {
	    if (!cb(dt)) {
		resolve();
		return false;
	    }
	    return true;
	});
    });
}

PlayScreen.prototype.getScene = function() { return this.scene; }

PlayScreen.prototype.setScene = function(name, args)
{
    // Default camera position for a new scene
    let cameraX = -1;
    let cameraY = 0;

    if (args) {
        if (args.cameraX !== undefined) cameraX = args.cameraX;
        if (args.cameraY !== undefined) cameraY = args.cameraY;
    }

    if (!this.sceneDataList[name]) {
	throw Error("No such scene: " + name);
    }
    if (this.scene) 
    {
	this.scene.logic.leaveScene();
	this.scene.logic.uninitScene();
	this.scene.destroy(); // TODO - cache the scene
	this.scene = null;
    }
    
    this.scene = Scene.Scene.fromData(this.sceneDataList[name]);

    let logic = this.gameLogic.getSceneLogic(name);
    if (!logic) throw Error("Logic not found for scene: " + name);
    this.scene.initScene(this, logic);
    this.sceneStage.children = [];
    this.sceneStage.addChild(this.scene.container);
    this.sceneStage.scale.set(this.getDisplayScale());
    this.sceneStage.x = this.viewWidth/2;
    this.sceneStage.y = this.viewHeight/2;
    this.scene.setCameraPos(cameraX, cameraY)
    this.scene.logic.enterScene();
}

PlayScreen.prototype.setCameraPos = function(xpos, ypos)
{
    xpos = Math.max(Math.min(xpos, 1), -1);
    ypos = Math.max(Math.min(ypos, 1), -1);
    this.scene.setCameraPos(xpos, ypos);
    if (this.eventManager.hasListeners("camera")) {
        this.dispatch("camera");
    }
}

PlayScreen.prototype.getDisplayScale = function()
{
    return this.viewWidth/this.scene.getBaseSize().width;
}

/* Called when the game window is resized. This scales the scene to fit the 
 * available space. */
PlayScreen.prototype.handleResize = function(width, height)
{
    if (this.scene) {
	this.viewWidth = width;
	this.viewHeight = height;
	this.sceneStage.x = width/2;
	this.sceneStage.y = height/2;
	this.sceneStage.scale.set(this.getDisplayScale());
	if (this.dialog) this.dialog.handleResize(width, height);
	this.dispatch("resize", width, height);
    }
}

PlayScreen.prototype.handleClick = function(evt)
{
    if (!this.scene) return;

    var xp = evt.x/this.getDisplayScale();
    var yp = evt.y/this.getDisplayScale();

    if (!this.isCutscene)
    {
	if (this.scene.handleClicked(xp, yp)) {
	    this.redraw();
	}
    }

    // A direct click will dismiss the dialog box
    if (this.dialog && this.dialog.isShown()) {
	this.dialog.hide();
	return;
    }
    this.dispatch("click", xp, yp);
}

PlayScreen.prototype.handleDragStart = function(evt)
{
    if (!this.scene) return;

    if (this.dialog && this.dialog.isShown()) {
	this.dialog.hide(0.75);
	/*setTimeout(() => {
	    this.dialog.hide();
	}, 1000);*/
    }

    this.dispatch("dragStart", xp, yp);

    var xp = evt.x/this.getDisplayScale();
    var yp = evt.y/this.getDisplayScale();

    if (!this.isCutscene)
    {
	var args = this.scene.checkHit(xp, yp);
	if (false) { //args.thing) {
	    // Dragging an object
	    // TODO - implement this
	    this.dragState.thing = this.scene.getThing(args.layer, args.thing);
	    this.dragState.startX = this.dragState.thing.x;
	    this.dragState.startY = this.dragState.thing.y;
	} else {
	    // Panning the scene
	    this.dragState.thing = null;
	    this.dragState.start(
		(new Date()).getTime()/1000.0,
		this.scene.cameraX, 0);
	}
    }
}

PlayScreen.prototype.handleDragStop = function(evt)
{
    // If the player clicked and panned the scene around only a short distance,
    // count this as a click event.
    var dist = 5;
    if (!this.dragState.thing && 
	Math.abs(evt.x - evt.dragStartX) < dist && 
	Math.abs(evt.y - evt.dragStartY) < dist) 
    {
	this.handleClick(evt);
    }
    this.dragState.stop();
    this.dispatch("dragStop");

    // Have the camera continue sliding, gradually slowing down. This is
    // the expected behavior on touch devices.
    let velx = this.dragState.velocityX;
    let duration = 0.5;
    let timer = duration;

    this.addUpdate(dt => {
	// Have the updater expire if the player starts dragging again
	// or we finish our slide.
	timer -= dt;
	if (this.dragState.isActive() || timer <= 0) return false;

	// Slide the camera (slowing down as timer -> 0)
	this.setCameraPos(
	    this.scene.cameraX + velx * dt * (timer/duration), 0);
	return true;
    });
}

PlayScreen.prototype.handleDrag = function(evt)
{
    if (!this.scene) return;

    if (!this.isCutscene && this.dragState.startX !== null)
    {
	if (this.dragState.thing) {
	    // Dragging a thing
	    var x = this.dragState.startX + evt.dx/this.getDisplayScale();
	    var y = this.dragState.startY + evt.dy/this.getDisplayScale();
	    this.dragState.thing.x = x;
	    this.dragState.thing.y = y;
	    this.redraw();

	} else {
	    // Panning the scene around
	    var pos = this.dragState.startX - 1.25*evt.dx/(window.innerWidth/2);
	    this.setCameraPos(pos);
	    this.redraw();

	    this.dragState.update(
		(new Date()).getTime()/1000.0,
		pos, 0);

	    // Now figure out what's in view and send visibility events
	    // ...
	}
    }
}

PlayScreen.prototype.showMessage = function(msg)
{
    this.dialog.showMessage(msg);
    return this.dialog;
}

/* Pause the gameplay. This happens when showing the player a message */
PlayScreen.prototype.pause = function()
{
    if (!this.isScenePaused) {
	this.isScenePaused = true;
	if (this.scene) this.scene.pause();
    }
}

/* Resume the gameplay after pausing */
PlayScreen.prototype.resume = function()
{
    if (this.isScenePaused) {
	this.isScenePaused = false;
	if (this.scene) this.scene.resume();
    }
}

PlayScreen.prototype.enterCutscene = function()
{
    this.isCutscene++;
}

PlayScreen.prototype.leaveCutscene = function()
{
    this.isCutscene--;
}

module.exports = PlayScreen;

