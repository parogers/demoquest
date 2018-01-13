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

EventManager.prototype.destroy = function()
{
    this.callbacks = null;
}

EventManager.prototype.hasListeners = function(event)
{
    return this.callbacks[event] && this.callbacks[event].length > 0;
}

/* Add an event callback under the given name */
EventManager.prototype.addEventListener = function(event, callback, autoRemove)
{
    if (!this.callbacks[event]) {
	this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return {
        remove: () => {
            this.removeEventListener(event, callback);
        },
        event: event,
        callback: callback
    }
}

EventManager.prototype.removeEventListener = function(event, callback)
{
    let lst = this.callbacks[event];
    if (!lst) return;

    let i = lst.indexOf(callback);
    if (i !== -1) {
        this.callbacks[event] = lst.slice(0, i).concat(lst.slice(i+1));
    }
}

EventManager.prototype.dispatcher = function(event)
{
    if (event) {
	return (() => {
	    this.dispatch(event);
	});
    }
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
    let func = (callback, autoRemove) => {
	return this.addEventListener(event, callback, autoRemove);
    };
    return func
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
    this.timerList = null;
}

Timer.prototype.destroy = function()
{
    this.pause();
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
	this.timeoutEvent = setTimeout((() => {
	    this.timeoutEvent = null;
	    if (this.callback()) {
		this.timeLeft = this.delay;
		this.paused = true;
		this.resume();
	    }
	}), this.timeLeft);
    }
}

Timer.prototype.cancel = function()
{
    this.pause();
    if (this.timerList) this.timerList.cancel(this);
}

/*************/
/* TimerList */
/*************/

function TimerList()
{
    this.timers = [];
}

TimerList.prototype.destroy = function()
{
    for (var tm of this.timers) {
	tm.destroy();
    }
    this.timers = null;
}

TimerList.prototype.clear = function()
{
    this.destroy();
    this.timers = [];
}

TimerList.prototype.start = function(callback, delay, immediate)
{
    var tm = new Timer(() => {
	let ret = callback();
	if (!ret) {
	    // No more callbacks - remove the timer from the list
	    this.cancel(tm);
	}
	return ret;
    }, delay);
    tm.timerList = this;
    this.timers.push(tm);
    if (immediate === true) {
	tm.pause();
	tm.timeLeft = 1;
	tm.resume();
    }
    return tm;
}

TimerList.prototype.cancel = function(tm)
{
    let n = this.timers.indexOf(tm)
    tm.pause();
    if (n !== -1) {
	this.timers = this.timers.slice(0, n).concat(this.timers.slice(n+1));
    }
}

TimerList.prototype.pause = function()
{
    // Pause all timers
    for (var tm of this.timers) {
	tm.pause();
    }
}

TimerList.prototype.resume = function()
{
    for (var tm of this.timers) {
	tm.resume();
    }
}

/* Returns a promise that waits a period of (game) time before resolving */
TimerList.prototype.wait = function(delay)
{
    return new Promise(
	(resolve, reject) => {
	    let tm = this.start(() => {
		resolve();
		return false;
	    }, delay);
	},
	err => {
	    console.log("Error running timer: " + err);
	}
    );
}

module.exports = {
    EventManager: EventManager,
    Timer: Timer,
    TimerList: TimerList
};
