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
    // The dialog box shown to the player (Dialog instance)
    this.dialog = null;
    // The size of the viewing area
    this.viewWidth = width;
    this.viewHeight = height;
    this.sceneStage.x = width/2;
    this.sceneStage.y = height/2;
    // How much to scale the scene graphics to fit the view area
    this.displayScale = 1;
    // The thing being dragged around, or null if no dragging is happening
    // or the player is panning around instead.
    this.dragging = null;
    // The mouse cursor position when the player started dragging around
    this.dragStartX = 0;
    this.dragStartY = 0;
    // Setup some events for communicating with the main game state
    this.eventManager = new EventManager();
    this.onComplete = this.eventManager.hook("complete");
    this.onGameOver = this.eventManager.hook("gameover");
    this.onRedraw = this.eventManager.hook("redraw");
    this.dispatch = this.eventManager.dispatcher();

    this.dialogDefaults = {
	fill: "black",
	background: "white",
	lightbox: "black"
    };
    // List of currently active timers in the game (Timer instances)
    this.timers = [];
}

PlayScreen.prototype.setScene = function(name)
{
    var scene = Scene.fromData(this.dataList[name]);
    this.scene = scene;
    this.sceneStage.children = [];
    this.sceneStage.addChild(scene.container);
    this._updateDisplayScale();
    this.logic.initScene(new LogicContext(this, this.scene));
    this.dispatch("redraw");
}

PlayScreen.prototype._updateDisplayScale = function()
{
    this.displayScale = this.viewHeight/this.scene.getBaseSize().height;
    this.sceneStage.scale.set(this.displayScale);
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
	this._updateDisplayScale();
    }
}

PlayScreen.prototype.handleClick = function(x, y)
{
    if (this.dialog) {
	// Forward the click to the dialog box
	this.dialog.handleClick(x, y);
	return;
    }

    if (this.scene) {
	var xp = x/this.displayScale;
	var yp = y/this.displayScale;
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

PlayScreen.prototype.handleDragStart = function(x, y)
{
    if (this.dialog) {
	// Forward the event to the dialog box
	this.dialog.handleDragStart(x, y);
	return;
    }
    if (!this.scene) return;

    var xp = x/this.displayScale;
    var yp = y/this.displayScale;
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

PlayScreen.prototype.handleDragStop = function(x, y)
{
    if (this.dialog) {
	// Forward the event to the dialog box
	this.dialog.handleDragStop(x, y);
	return;
    }
    this.dragging = null;
}

PlayScreen.prototype.handleDrag = function(dx, dy)
{
    if (this.dialog) {
	// Forward the event to the dialog box
	this.dialog.handleDrag(dx, dy);
	return;
    }
    if (!this.scene) return;

    if (this.dragging) {
	// Dragging a thing
	this.dragging.x = this.dragStartX + dx/this.displayScale;
	this.dragging.y = this.dragStartY + dy/this.displayScale;
	this.dispatch("redraw");

    } else {
	// Panning the scene around
	var pos = this.dragStartX - dx / (window.innerWidth/4);
	pos = Math.max(Math.min(pos, 1), -1);
	this.scene.setCameraPos(pos);
	this.dispatch("redraw");
    }
}

PlayScreen.prototype.showMessage = function(msg, options)
{
    var merged = {};
    for (var key in this.dialogDefaults) 
	merged[key] = this.dialogDefaults[key];
    for (var key in options) 
	merged[key] = options[key];

    this.dialog = new Dialog(
	msg, 
	gameState.renderer.width, 
	gameState.renderer.height, 
	merged);
    this.dialog.show(this.stage);
    this.dispatch("redraw");

    this.dialog.onClosed((function() {
	this.dialog = null;
	this.dispatch("redraw");
    }).bind(this));
}

/* Starts an in-game timer for the given callback. This timer can be paused
 * and resumed. (eg when transitionin between scenes and when showing dialog
 * boxes) */
PlayScreen.prototype.startTimer = function(callback, delay)
{
    var tm = new Timer((
	function() {
	    var ctx = new LogicContext(this, this.scene);
	    var ret = callback(ctx);
	    if (!ret) {
		// No more callbacks - remove the timer from the list
		var n = this.timers.indexOf(tm)
		this.timers = this.timers.slice(0, n).concat(
		    this.timers.slice(n+1));
	    }
	    this.dispatch("redraw");
	    return ret;
	}
    ).bind(this), delay);
    this.timers.push(tm);
    return tm;
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

/**********/
/* Dialog */
/**********/

function Dialog(msg, width, height, options)
{
    this.container = new PIXI.Container();

    var mgr = new EventManager();
    this.onClosed = mgr.hook("closed");
    this.dispatch = mgr.dispatcher();

    this._setMessage(msg, width, height, options);
}

Dialog.prototype._setMessage = function(msg, width, height, options)
{
    var pad = height*0.02;
    var fontSize = height*0.05;
    var text = new PIXI.Text(msg, {
	fontSize: fontSize, 
	wordWrap: true,
	fontStyle: "italic",
	fill: options.fill,
	wordWrapWidth: width-2*pad
    });

    // Render a solid colour
    var texture = makeSolidColourTexture(
	options.background, width, text.height+2*pad);
    var bg = new PIXI.Sprite(texture);

    var texture = makeSolidColourTexture(
	options.lightbox, width, height);
    var lightbox = new PIXI.Sprite(texture);
    lightbox.alpha = 0.65;

    this.container.addChild(lightbox);
    this.container.addChild(bg);
    this.container.addChild(text);

    // Now position everything, a little offset from the bottom
    bg.y = height-bg.height-(height*0.03);
    text.x = pad;
    text.y = bg.y+pad;
}

Dialog.prototype.show = function(stage)
{
    stage.addChild(this.container);
}

Dialog.prototype.hide = function(delay)
{
    this.container.parent.removeChild(this.container);
    this.dispatch("closed");

/*    if (delay) {
	// ....
	setTimeout((function() {
	}).bind(this), duration*delay);
    } else {
    }*/
}

Dialog.prototype.handleClick = function(x, y)
{
    this.hide();
}

Dialog.prototype.handleDragStart = function(x, y)
{
}

Dialog.prototype.handleDragStop = function(x, y)
{
}

Dialog.prototype.handleDrag = function(x, y)
{
}
