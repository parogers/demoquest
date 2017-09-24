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
var Input = require("./input");
var Loader = require("./loader");
var PlayScreen = require("./playscreen");

/*************/
/* GameState */
/*************/

function GameState(div)
{
    // Set pixel scaling to be "nearest neighbour" which makes textures 
    // render nice and blocky.
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    // Disable the ticker sinc we don't use it (rendering happens as needed)
    PIXI.ticker.shared.autoStart = false;
    PIXI.ticker.shared.stop();

    this.div = div;
    // The screen currently displayed
    this.screen = null;
    this.renderer = null;
    this.logic = new Logic.Logic();
    this.dataList = {};
    this.lastRenderTime = null;

    //this.screen = new Screen();

    // Callback function for passing to renderAnimationFrame
    this.staticRenderFrame = (() => {
	this.renderFrame();
    });
    window.addEventListener("resize", () => {
	this.handleResize();
    });
    // Call our resize handler to setup the render area at the correct size
    this.handleResize();

    // Setup mouse and/or touch handlers
    var m = new Input.MouseAdapter(this.div);
    this.setupInputHandlers(m);

    this.screen = new Loader.LoadingScreen(
	this.renderer.width, this.renderer.height);

    this.screen.onDone(() => {
	this._startGame();
    });

    this.screen.onRedraw(() => {
	this.redraw();
    });

    this.screen.start();
}

/* Attach the player events to the various input handlers. An event adapter
 * should be passed in here. (eg MouseAdapter) */
GameState.prototype.setupInputHandlers = function(m)
{
    m.onClick(evt => {
	if (this.screen && this.screen.handleClick) {
	    this.screen.handleClick(evt);
	}
    });
    m.onDragStart(evt => {
	if (this.screen && this.screen.handleDragStart) {
	    this.screen.handleDragStart(evt);
	}
    });
    m.onDrag(evt => {
	if (this.screen && this.screen.handleDrag) {
	    this.screen.handleDrag(evt);
	}
    });
    m.onDragStop(evt => {
	if (this.screen && this.screen.handleDragStop) {
	    this.screen.handleDragStop(evt);
	}
    });
}

/* Schedule a redraw of the game screen */
GameState.prototype.redraw = function()
{
    requestAnimationFrame(this.staticRenderFrame);
}

/* Returns the bounding (client) rectangle of the game rendering area */
GameState.prototype.getBoundingClientRect = function()
{
    return this.renderer.view.getBoundingClientRect();
}

/* Renders the current screen. Should be called from requestAnimationFrame */
GameState.prototype.renderFrame = function()
{
    if (!this.screen) return;

    var redraw = false;
    if (this.screen.update) 
    {
	var now = (new Date()).getTime();
	var dt = 0;
	if (this.lastRenderTime !== null) {
	    dt = (now - this.lastRenderTime)/1000.0;
	}
	this.lastRenderTime = now;
	redraw = this.screen.update(dt);
    }

    if (!this.screen.stage) {
	throw Error("screen has no stage defined: " + this.screen.name);
    }
    this.renderer.render(this.screen.stage);

    if (redraw) 
	this.redraw();
    else
	this.lastRenderTime = null;
}

GameState.prototype.handleResize = function()
{
    // Setup the canvas area
    this.div.focus();
    this.div.innerHTML = "";

    var pad = 10;
    var renderSize = Math.min(window.innerWidth-pad, window.innerHeight-pad);
    this.renderer = PIXI.autoDetectRenderer({
	width: renderSize, 
	height: renderSize,
	// Required to prevent flickering in Chrome on Android (others too?)
	preserveDrawingBuffer: true
    });
    this.div.appendChild(this.renderer.view);
    this.div.style.width = this.renderer.width;
    this.div.style.height = this.renderer.height;

    if (this.screen && this.screen.handleResize) {
	this.screen.handleResize(this.renderer.width, this.renderer.height);
    }
    this.redraw();
}

GameState.prototype._startGame = function()
{
    this.dataList = this.screen.dataList;
    this.screen = new PlayScreen(
	this.logic, 
	this.dataList,
	this.renderer.width, 
	this.renderer.height);

    // Attach to various events exposed by the PlayScreen
    this.screen.onGameOver(() => {
	// ...
    });

    this.screen.onComplete(() => {
	// ...
    });

    this.screen.onRedraw(() => {
	this.redraw();
    });
    // Now change to the opening scene
    this.screen.changeScene("intro");
}

module.exports = GameState;
