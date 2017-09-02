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
    var mgr = new EventManager();
    this.onComplete = mgr.hook("complete");
    this.onGameOver = mgr.hook("gameover");
    this.onRedraw = mgr.hook("redraw");
    this.dispatch = mgr.dispatcher();

    this.dialogDefaults = {
	fill: "black",
	background: "white",
	lightbox: "black"
    };

    // Setup the dialog/message area and attach some event handlers
    this.dialog = new Dialog(
	this.viewWidth, this.viewHeight, 
	this.stage, this.dialogDefaults);

    this.dialog.onUpdate((function(cb) {
	this.addUpdate(cb);
    }).bind(this));

    this.dialog.onRedraw((function() {
	this.dispatch("redraw");
    }).bind(this));

    this.dialog.onClosed((function() {
	this.dispatch("redraw");
	this.resume();
    }).bind(this));
}

/* Called for every frame that is rendered by the game state. (called before
 * rendering to screen) Returns true to request another frame be rendered 
 * after this one, or false otherwise. */
PlayScreen.prototype.update = function(dt)
{
    var lst = [];
    for (var callback of this.updateCallbacks) {
	if (callback(dt)) lst.push(callback);
    }
    this.updateCallbacks = lst;
    // Request more redraws while there is stuff to animate (via callbacks)
    return (this.updateCallbacks.length > 0);
}

PlayScreen.prototype.addUpdate = function(callback)
{
    this.updateCallbacks.push(callback);
    if (this.updateCallbacks.length === 1) this.dispatch("redraw");
}

PlayScreen.prototype.changeScene = function(name)
{
    if (this.scene === null) {
	// Slow fade into the starting scene
	this.setScene(name);
	this.pause();
	var fader = new Fader(this.viewWidth, this.viewHeight, -1, 2);
	fader.start(this.stage);
	this.addUpdate((function(dt) {
	    if (!fader.update(dt)) {
		this.resume();
		return false;
	    }
	    return true;
	}).bind(this));
	
    } else {
	// Fade out, switch scenes, then fade back in
	var fadeout = new Fader(this.viewWidth, this.viewHeight, 1, 1);
	var fadein = new Fader(this.viewWidth, this.viewHeight, -1, 1);
	this.stage.removeChild(fadeout.sprite);
	this.pause();
	fadeout.start(this.stage);
	this.addUpdate((function(dt) {
	    if (!fadeout.update(dt)) 
	    {
		this.setScene(name);
		fadein.start(this.stage);
		this.addUpdate((function(dt) {
		    if (!fadein.update(dt)) {
			this.resume();
			return false;
		    }
		    return true;
		}).bind(this));
		return false;
	    }
	    return true;
	}).bind(this));
    }
}

PlayScreen.prototype.setScene = function(name)
{
    if (this.scene) {
	this.logic.leaveScene(new LogicContext(this, this.scene));
    }

    var scene = Scene.fromData(this.dataList[name]);
    this.scene = scene;
    this.sceneStage.children = [];
    this.sceneStage.addChild(scene.container);
    this.sceneStage.scale.set(this.getDisplayScale());
    this.sceneStage.x = this.viewWidth/2;
    this.sceneStage.y = this.viewHeight/2;
    this.logic.initScene(new LogicContext(this, this.scene));
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
    }
}

PlayScreen.prototype.handleClick = function(evt)
{
    // A direct click will dismiss the dialog box
    if (this.dialog.isShown()) {
	this.dialog.hide();
	return;
    }

    if (this.scene) {
	var xp = evt.x/this.getDisplayScale();
	var yp = evt.y/this.getDisplayScale();
	var args = this.scene.checkHit(xp, yp);
	if (args.thing) {
	    var ctx = new LogicContext(
		this, this.scene, 
		args.thing, args.sprite);
	    this.logic.handleClicked(ctx);
	    this.dispatch("redraw");
	}
    }
}

PlayScreen.prototype.handleDragStart = function(evt)
{
    if (this.dialog.isShown()) {
	setTimeout((function() {
	    this.dialog.hide();
	}).bind(this), 1000);
    }
    if (!this.scene) return;

    var xp = evt.x/this.getDisplayScale();
    var yp = evt.y/this.getDisplayScale();
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
}

PlayScreen.prototype.handleDrag = function(evt)
{
    if (!this.scene) return;

    if (this.dragging) {
	// Dragging a thing
	this.dragging.x = this.dragStartX + evt.dx/this.getDisplayScale();
	this.dragging.y = this.dragStartY + evt.dy/this.getDisplayScale();
	this.dispatch("redraw");

    } else {
	// Panning the scene around
	var pos = this.dragStartX - evt.dx / (window.innerWidth/2);
	pos = Math.max(Math.min(pos, 1), -1);
	this.scene.setCameraPos(pos);
	this.dispatch("redraw");
    }
}

PlayScreen.prototype.showMessage = function(msg)
{
    // Pause game play and show the message (will be resumed when the 
    // dialog box is closed)
    this.pause();
    this.dialog.showMessage(msg);
}

/* Starts an in-game timer for the given callback. This timer can be paused
 * and resumed. (eg when transitionin between scenes and when showing dialog
 * boxes) */
PlayScreen.prototype.startTimer = function(callback, delay)
{
    var tm = new Timer((
	function() {
	    var ret = callback(new LogicContext(this, this.scene));
	    if (!ret) {
		// No more callbacks - remove the timer from the list
		this.cancelTimer(tm);
	    }
	    this.dispatch("redraw");
	    return ret;
	}
    ).bind(this), delay);
    this.timers.push(tm);
    return tm;
}

PlayScreen.prototype.cancelTimer = function(tm)
{
    var n = this.timers.indexOf(tm)
    tm.pause();
    if (n !== -1) {
	this.timers = this.timers.slice(0, n).concat(this.timers.slice(n+1));
    }
}

/* Pause the gameplay. This happens when showing the player a message */
PlayScreen.prototype.pause = function()
{
    // Pause all timers
    for (var tm of this.timers) {
	tm.pause();
    }
}

/* Resume the gameplay after pausing */
PlayScreen.prototype.resume = function()
{
    for (var tm of this.timers) {
	tm.resume();
    }
}
