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

var Render = require("./render");
var Logic = require("./logic");
var Input = require("./input");
var Loader = require("./loader");
var PlayScreen = require("./playscreen");
var Browser = require("./browser");

/*************/
/* GameState */
/*************/

function GameState(div)
{
    // The screen currently displayed
    this.screen = null;
    this.gameLogic = new Logic.GameLogic();
    this.dataList = {};
    this.lastRenderTime = null;

    // Callback function for passing to renderAnimationFrame
    this.staticRenderFrame = (() => {
	this.renderFrame();
    });
    window.addEventListener("resize", () => {
	this.handleResize();
    });

    // Note we force (HTML5) canvas rendering for mobile devices, because
    // it tends to be faster.
    // TODO - detect when webgl rendering is slow
    Render.configure(div, {
	aspect: 1,
	forceCanvas: true, //Browser.isMobileDevice()
    });

    // Setup mouse event handlers
    var m = new Input.MouseAdapter(Render.getRenderer().view);
    this.setupInputHandlers(m);

    // Setup touch screen event handlers
    m = new Input.TouchAdapter(Render.getRenderer().view);
    this.setupInputHandlers(m);

    this.screen = new Loader.LoadingScreen(
	Render.getRenderer().width, 
        Render.getRenderer().height);

    this.screen.onDone(() => {
	this.dataList = this.screen.dataList;
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
    if (!this.manualRedraw) {
	this.manualRedraw = true;
	requestAnimationFrame(this.staticRenderFrame);
    }
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
	// Get in one last redraw just in case
	if (!redraw) this.manualRedraw = true;
    }

    if (!this.screen.stage) {
	throw Error("screen has no stage defined: " + this.screen.name);
    }
    if (redraw || this.manualRedraw) {
	Render.getRenderer().render(this.screen.stage);
    }
    if (redraw) {
	requestAnimationFrame(this.staticRenderFrame);
    } else {
	this.lastRenderTime = null;
    }
    this.manualRedraw = false;
}

/* Called when the game should be resized to fill the available space */
GameState.prototype.handleResize = function()
{
    Render.resize();
    if (this.screen && this.screen.handleResize) {
	this.screen.handleResize(
            Render.getRenderer().width, 
            Render.getRenderer().height);
    }
    this.redraw();
}

GameState.prototype._startGame = function()
{
    this.screen = new PlayScreen(
	this.gameLogic, 
	this.dataList,
	Render.getRenderer().width, 
	Render.getRenderer().height);

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
    // Start the game
    this.gameLogic.startGame(this.screen);
}

module.exports = GameState;
