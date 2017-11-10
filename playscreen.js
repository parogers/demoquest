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

/**************/
/* PlayScreen */
/**************/

function PlayScreen(logic, dataList, width, height)
{
    this.name = "PlayScreen";
    // The scene currently displayed (Scene instance)
    this.scene = null;
    // The gameplay logic
    this.logic = logic;
    // The collection of all scenes (SceneData) in the game
    this.dataList = dataList;
    // The top-level PIXI container that holds the scene sprites. This 
    // container gets scaled to fit the canvas.
    this.stage = new PIXI.Container();
    this.sceneStage = new PIXI.Container();
    this.stage.addChild(this.sceneStage);
    // The size of the viewing area
    this.viewWidth = width;
    this.viewHeight = height;
    this.isScenePaused = false;
    this.isCutscene = false;
    // The thing being dragged around, or null if no dragging is happening
    // or the player is panning around instead.
    this.dragging = null;
    // The mouse cursor position when the player started dragging around
    this.dragStartX = 0;
    this.dragStartY = 0;
    // List of currently active timers in the game (Timer instances)
    this.timers = [];
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

    // Setup the dialog/message area and attach some event handlers
    this.dialog = new Dialog(
	this.viewWidth, 
	this.viewHeight, 
	this.stage, 
	{
	    fill: "black",
	    background: "white",
	    lightbox: "black"
	}
    );

    this.dialog.onUpdate(cb => {
	this.addUpdate(cb);
    });

    this.dialog.onRedraw(this.redraw.bind());

    this.dialog.onOpened(cb => {
	// Pause game play and show the message (will be resumed when the 
	// dialog box is closed)
	this.pause();
	this.enterCutscene();
    });

    this.dialog.onClosing(cb => {
	this.resume();
	this.leaveCutscene();
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
    //this.redraw()
    //return redraw;
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
    let callbacks = Array.prototype.slice.call(arguments);
    let callback = function(dt) 
    {
        if (callbacks.length === 0) return false;
        let ret = callbacks[0](dt);
	if (ret === false) {
            callbacks.shift();
	}
	return callbacks.length > 0;
    }
    this.updateCallbacks.push(callback);
    this.redraw();
}

PlayScreen.prototype.setScene = function(name, args)
{
    // Default camera position for a new scene
    let cameraX = -1;
    let cameraY = 0;

    if (args) {
        if (args.cameraX !== undefined) cameraX = args.cameraX;
        if (args.cameraY !== undefined) cameraY = args.cameraY;
    }

    if (!this.dataList[name]) {
	throw Error("No such scene: " + name);
    }
    if (this.scene) {
        let ctx = this.logic.makeContext({
            screen: this,
            scene: this.scene
        });
	this.logic.leaveScene(ctx);
	this.scene.destroy(); // TODO - cache the scene
	this.scene = null;
    }
    var scene = Scene.Scene.fromData(this.dataList[name]);
    scene.screen = this;
    scene.setLogic(this.logic);
    this.scene = scene;
    this.sceneStage.children = [];
    this.sceneStage.addChild(scene.container);
    this.sceneStage.scale.set(this.getDisplayScale());
    this.sceneStage.x = this.viewWidth/2;
    this.sceneStage.y = this.viewHeight/2;
    let ctx = this.logic.makeContext({
        screen: this, 
        scene: this.scene
    })
    this.logic.enterScene(ctx);
    this.scene.setCameraPos(cameraX, cameraY)
}

PlayScreen.prototype.setCameraPos = function(xpos, ypos)
{
    this.scene.setCameraPos(xpos, ypos);
    if (this.eventManager.hasListeners("camera")) {
	let ctx = this.logic.makeContext({
            screen: this,
            scene: this.scene
        });
        this.dispatch("camera", ctx);
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
	this.dialog.handleResize(width, height);
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
	var args = this.scene.checkHit(xp, yp);
	if (args.thing) {
	    var ctx = this.logic.makeContext({
		screen: this,
		scene: this.scene, 
		thing: args.thing, 
		sprite: args.sprite
            });
	    this.logic.handleClicked(ctx);
	    this.redraw();
	}
    }

    // A direct click will dismiss the dialog box
    if (this.dialog.isShown()) {
	this.dialog.hide();
	return;
    }
    this.dispatch("click", xp, yp);
}

PlayScreen.prototype.handleDragStart = function(evt)
{
    if (!this.scene) return;

    if (this.dialog.isShown()) {
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
	    this.dragging = this.scene.getThing(args.layer, args.thing);
	    this.dragStartX = this.dragging.x;
	    this.dragStartY = this.dragging.y;
	    /*var rect = thing.getBoundingClientRect();
	      this.dragging = args;
	      this.dragStartX = parseInt(thing.style.left);
	      this.dragStartY = parseInt(thing.style.top);*/
	} else {
	    // Panning the scene
	    this.dragging = null;
	    this.dragStartX = this.scene.cameraX;
	}
    }
}

PlayScreen.prototype.handleDragStop = function(evt)
{
    // If the player clicked and panned the scene around only a short distance,
    // count this as a click event.
    var dist = 5;
    if (!this.dragging && 
	Math.abs(evt.x - evt.dragStartX) < dist && 
	Math.abs(evt.y - evt.dragStartY) < dist) 
    {
	this.handleClick(evt);
    }
    this.dragging = null;

    this.dispatch("dragStop");
}

PlayScreen.prototype.handleDrag = function(evt)
{
    if (!this.scene) return;

    if (!this.isCutscene)
    {
	if (this.dragging) {
	    // Dragging a thing
	    this.dragging.x = this.dragStartX + evt.dx/this.getDisplayScale();
	    this.dragging.y = this.dragStartY + evt.dy/this.getDisplayScale();
	    this.redraw();

	} else {
	    // Panning the scene around
	    var pos = this.dragStartX - evt.dx / (window.innerWidth/2);
	    pos = Math.max(Math.min(pos, 1), -1);
	    this.setCameraPos(pos);
	    this.redraw();
	    // Now figure out what's in view and send visibility events
	    // ...
	}
    }
}

PlayScreen.prototype.showMessage = function(msg)
{
    this.dialog.showMessage(msg);
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
    this.isCutscene = true;
}

PlayScreen.prototype.leaveCutscene = function()
{
    this.isCutscene = false;
}

module.exports = PlayScreen;

