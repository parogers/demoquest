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
    this.div = div;
    // The screen currently displayed
    this.screen = null;
    this.renderer = null;
    // ...
    this.screen = new PlayScreen();
    // Callback function for passing to renderAnimationFrame
    var gameState = this;
    this.staticRenderFrame = function() {
	gameState.renderFrame();
    };

    // Setup mouse and/or touch handlers
    var m = new MouseAdapter(window, this.div);
    this.setupInputHandlers(m);

    this.handleResize();
}

GameState.prototype.setupInputHandlers = function(m)
{
    var gameState = this;
    m.onClick(function(x, y) {
	if (gameState.screen && gameState.screen.handleClick) {
	    gameState.screen.handleClick(x, y);
	}
    });

    m.onDragStart(function(x, y) {
	if (gameState.screen && gameState.screen.handleDragStart) {
	    gameState.screen.handleDragStart(x, y);
	}
    });

    m.onDrag(function(x, y) {
	if (gameState.screen && gameState.screen.handleDrag) {
	    gameState.screen.handleDrag(x, y);
	}
    });

    m.onDragStop(function(x, y) {
	if (gameState.screen && gameState.screen.handleDragStop) {
	    gameState.screen.handleDragStop(x, y);
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

GameState.prototype.renderFrame = function()
{
    if (this.screen) {
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
    this.renderer = PIXI.autoDetectRenderer(renderSize, renderSize);
    this.div.appendChild(this.renderer.view);
    this.div.style.width = this.renderer.width;
    this.div.style.height = this.renderer.height;

    if (this.screen) {
	this.screen.handleResize();
    }
    this.redraw();
}

/* Various mouse/touch event handlers. The coordinates are given relative to
 * the render canvas. */
GameState.prototype.handleClick = function(x, y)
{
    if (this.screen && this.screen.handleClick) 
	this.screen.handleClick(x, y);
}

GameState.prototype.handleDragStart = function(x, y)
{
    if (this.screen && this.screen.handleDragStart) 
	this.screen.handleDragStart(x, y);
}

GameState.prototype.handleDrag = function(x, y)
{
    if (this.screen && this.screen.handleDrag) 
	this.screen.handleDrag(x, y);
}

GameState.prototype.handleDragStop = function(x, y)
{
    if (this.screen && this.screen.handleDragStop) 
	this.screen.handleDragStop(x, y);
}
