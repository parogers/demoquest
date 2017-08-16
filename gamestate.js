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
/* Functions */
/*************/

/* Attach handlers for mouse-related events. The events (mouseup/down/move) 
 * are first transformed into something more convenient before being forwarded
 * to the game state instance. */
function setupMouseEvents(gameState)
{
    var dragStartX = 0;
    var dragStartY = 0;
    var pressing = false;

    window.addEventListener("mousemove", function(event) {
	if (pressing) {
	    gameState.handleDrag(
		event.clientX-dragStartX, 
		event.clientY-dragStartY);
	}
    });

    window.addEventListener("mousedown", function(event) {
	pressing = true;
	dragStartX = event.clientX;
	dragStartY = event.clientY;
	gameState.handleDragStart(event.clientX, event.clientY);
    });

    window.addEventListener("mouseup", function(event) {
	var rect = gameState.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	if (event.clientX === dragStartX && event.clientY === dragStartY) {
	    gameState.handleClick(x, y);
	} else {
	    gameState.handleDragStop(x, y);
	}
	pressing = false;
    });
}

/* Attach handlers to touch-related events. This is similar in function to 
 * setupMouseEvents. */
function setupTouchEvents(gameState)
{
}

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
    this.staticRenderFrame = function(gameState) {
	return function() {
	    gameState.renderFrame();
	}
    }(this);
    // Setup mouse and touch handlers, attaching events to this instance
    setupMouseEvents(this);
    setupTouchEvents(this);
    this.handleResize();
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
