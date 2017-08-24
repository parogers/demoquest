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
    this.logic = new Logic();
    this.dataList = {};

    // Callback function for passing to renderAnimationFrame
    var gameState = this;
    this.staticRenderFrame = function() {
	gameState.renderFrame();
    };
    window.addEventListener("resize", function() {
	gameState.handleResize();
    });
    // Call our resize handler to setup the render area at the correct size
    this.handleResize();

    // Setup mouse and/or touch handlers
    var m = new MouseAdapter(this.div);
    this.setupInputHandlers(m);

    var self = this;
    this.screen = new LoadingScreen();
    this.screen.onDone(function() {
	self._startGame();
    });
    this.screen.start();
}

/* Attach the player events to the various input handlers. An event adapter
 * should be passed in here. (eg MouseAdapter) */
GameState.prototype.setupInputHandlers = function(m)
{
    var gs = this;
    m.onClick(function(x, y) {
	if (gs.screen && gs.screen.handleClick) {
	    gs.screen.handleClick(x, y);
	}
    });
    m.onDragStart(function(x, y) {
	if (gs.screen && gs.screen.handleDragStart) {
	    gs.screen.handleDragStart(x, y);
	}
    });
    m.onDrag(function(x, y) {
	if (gs.screen && gs.screen.handleDrag) {
	    gs.screen.handleDrag(x, y);
	}
    });
    m.onDragStop(function(x, y) {
	if (gs.screen && gs.screen.handleDragStop) {
	    gs.screen.handleDragStop(x, y);
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
    if (this.screen) {
	if (!this.screen.stage) {
	    throw Error("screen has no stage defined: " + this.screen.name);
	}
	this.renderer.render(this.screen.stage);
    }
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
	this.screen.handleResize();
    }
    this.redraw();
}

GameState.prototype._startGame = function()
{
    this.dataList = this.screen.dataList;
    this.screen = new PlayScreen(this.logic, this.dataList);

    // Attach to various events exposed by the PlayScreen
    var self = this;
    this.screen.onGameOver(function() {
	// 
    });
    this.screen.onComplete(function() {
	// 
    });
    this.screen.onRedraw(function() {
	self.redraw();
    });

    // Now change to the opening scene
    this.screen.setScene("intro");
}
