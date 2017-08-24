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

/* Returns a 2d matrix containing the alpha values of each pixel in the given
 * image. So that grid[x][y] => alpha value at pixel (x, y) */
function getTransparencyMask(renderer, texture)
{
    var sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0, 0);
    // This returns a flat array packed with pixel values (RGBARGBA...)
    var pixels = renderer.extract.pixels(sprite);
    var mask = [];
    for (var x = 0; x < sprite.width; x++) {
	mask.push([]);
	for (var y = 0; y < sprite.height; y++) {
	    var value = pixels[4*(x + y*sprite.width)+3];
	    mask[mask.length-1].push(value);
	}
    }
    return mask;
}

function getNativeWidth(img)
{
    var tmp = new Image();
    tmp.src = img.src;
    return tmp.width;
}

function getNativeHeight(img)
{
    var tmp = new Image();
    tmp.src = img.src;
    return tmp.height;
}

/****************/
/* EventManager */
/****************/

/* An event manager and dispatcher class */
function EventManager()
{
    this.callbacks = {};
}

/* Add an event callback under the given name */
EventManager.prototype.addEventListener = function(event, callback)
{
    if (!this.callbacks[event]) {
	this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
}

/* Trigger all callbacks attached to the given event name */
EventManager.prototype.dispatch = function(event)
{
    if (!event) throw Error("must supply an event to dispatch");
    if (!this.callbacks[event]) {
	// No attached handlers
	return;
    }	
    // Get the list of arguments and call the attached handlers
    var args = Array.prototype.slice.call(arguments, 1);
    for (var cb of this.callbacks[event]) {
	cb.apply(null, args);
    }
}

/* Make a "hook" for easy connecting of events to another object. Use it
 * like this:
 *
 *    mgr = new EventManager();
 *    onClick = mgr.hook("click");
 *    // Saves having to type out addEventListener(...)
 *    onClick(function() {
 *        // callback
 *    });
 */
EventManager.prototype.hook = function(event)
{
    var mgr = this;
    return function(callback) {
	mgr.addEventListener(event, callback);
    }
}
