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

EventManager.prototype.dispatcher = function()
{
    return this.dispatch.bind(this);
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
    return (function(callback) {
	return this.addEventListener(event, callback);
    }).bind(this);
}

/*********/
/* Timer */
/*********/

/* Implements functionality similar to setTimeout and clearTimeout, but allows
 * the timer to be paused and resume. */
function Timer(callback, delay)
{
    this.callback = callback;
    this.startTime = 0;
    this.delay = delay;
    this.timeLeft = delay;
    this.paused = true;
    this.timeoutEvent = null;
    this.resume();
}

/* Pause the timer to be resumed later */
Timer.prototype.pause = function()
{
    if (!this.paused) {
	this.paused = true;
	clearTimeout(this.timeoutEvent);
	this.timeoutEvent = null;
	// Update the amount of time left (for when the timer is resumed)
	this.timeLeft -= (new Date()).getTime() - this.startTime;
    }
}

/* Resume the timer when paused */
Timer.prototype.resume = function()
{
    if (this.paused) {
	this.startTime = (new Date()).getTime();
	this.paused = false;
	this.timeoutEvent = setTimeout((
	    function() {
		this.timeoutEvent = null;
		if (this.callback()) {
		    this.timeLeft = this.delay;
		    this.paused = true;
		    this.resume();
		}
	    }
	).bind(this), this.timeLeft);
    }
}
