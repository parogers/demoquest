(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.demoquest = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* APDUNGEON - A dungeon crawler demo written in javascript + pixi.js
 * Copyright (C) 2017  Peter Rogers (peter.rogers@gmail.com)
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
 * 
 * See LICENSE.txt for the full text of the license.
 */

var enabled = true;

module.exports = {};

module.exports.Effects = {
    Crow: "media/effects/crow.mp3",
    Drip: "media/effects/water-drop.mp3",
    ShapeSound: "media/effects/ufo.mp3",
    DoorOpening: "media/effects/door-opening.mp3",
    DoorClosing: "media/effects/door-closing.mp3",
    Crickets: "media/effects/crickets.mp3",
    Crickets2: "media/effects/crickets2.mp3",
    Cupboard: "media/effects/soft-click.mp3",
    Switch: "media/effects/soft-click.mp3"
};

module.exports.play = function (res, vol) {
    if (enabled) {
        if (vol !== undefined) sounds[res].volume = vol;
        sounds[res].play();
        return sounds[res];
    }
    return null;
};

module.exports.setEnabled = function (b) {
    enabled = b;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = sounds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var name = _step.value;

            if (sounds[name].play && sounds[name].pause) {
                sounds[name].pause();
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

module.exports.load = function (sources, opts) {
    sounds.whenLoaded = opts.whenLoaded || null;
    sounds.onFailed = opts.onFailed || null;
    sounds.onProgress = opts.onProgress || null;
    // Show and update the new progress bar for loading audio
    /*    progress.setText("LOADING AUDIO...");
        sounds.onProgress = function(percent) {
            progress.update(percent/100.0);
            requestAnimationFrame(function() {
                Render.getRenderer().render(stage);
            });
        };*/
    sounds.load(sources);
};

},{}],2:[function(require,module,exports){
"use strict";

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

var Events = require("./events");
var Utils = require("./utils");

/**********/
/* Dialog */
/**********/

function Dialog(width, height, stage, options) {
    this.container = new PIXI.Container();
    this.viewWidth = width;
    this.viewHeight = height;
    this.options = options;
    this.messages = [];
    this.stage = stage;

    var mgr = new Events.EventManager();
    this.onOpened = mgr.hook("opened");
    this.onClosed = mgr.hook("closed");
    this.onClosing = mgr.hook("closing");
    this.onRedraw = mgr.hook("redraw");
    this.onUpdate = mgr.hook("update");
    this.dispatch = mgr.dispatcher();

    this.state = "idle";

    // Render a solid colour. We cache it here for efficiency, and scale it 
    // to whatever size is needed below. 
    var texture = Utils.makeSolidColourTexture(this.options.background, 10, 10);
    this.bg = new PIXI.Sprite(texture);
    this.container.addChild(this.bg);
}

Dialog.prototype.isShown = function () {
    return this.state === "shown";
};

Dialog.prototype.showMessage = function (msg) {
    if (this.state !== "idle") {
        // Already showing a message. Add it to the queue for later
        this.messages.push(msg);
        return;
    }

    var pad = this.viewHeight * 0.02;
    var fontSize = this.viewHeight * 0.05;
    var text = new PIXI.Text(msg, {
        fontSize: fontSize,
        wordWrap: true,
        fontStyle: "italic",
        fill: this.options.fill,
        wordWrapWidth: this.viewWidth - 2 * pad
    });
    text.x = pad;
    text.y = pad;

    /*var lightbox = new PIXI.Sprite(texture);
    lightbox.alpha = 0.65;
    this.container.addChild(lightbox);*/

    this.bg.scale.set(this.viewWidth / this.bg.texture.width, (text.height + 2 * pad) / this.bg.texture.height);

    this.container.children = [];
    this.container.addChild(this.bg);
    this.container.addChild(text);

    //this.container.addChild(bg);
    //this.container.addChild(text);

    // Now position everything, a little offset from the bottom
    /*bg.y = this.viewHeight-bg.height-(this.viewHeight*0.03);
    text.x = pad;
    text.y = bg.y+pad;*/

    this.desty = this.viewHeight - this.bg.height - this.viewHeight * 0.03;
    this.container.y = this.viewHeight + 5;
    this.show();
};

Dialog.prototype.show = function () {
    var _this = this;

    if (this.state !== "idle") return;
    this.state = "showing";

    this.delay = 0;
    this.stage.addChild(this.container);
    // Have the dialog box slide into view from below
    this.dispatch("update", function (dt) {
        if (_this.delay > 0) {
            _this.delay -= dt;
            return true;
        }
        _this.container.y -= 0.9 * _this.viewHeight * dt;
        if (_this.container.y < _this.desty) {
            _this.container.y = _this.desty;
            _this.state = "shown";
            _this.dispatch("redraw");
            return false;
        }
        return true;
    });
    this.dispatch("opened");
};

Dialog.prototype.hide = function (delay) {
    var _this2 = this;

    if (this.state !== "shown") return;
    this.state = "hiding";

    // Have the dialog box slide off screen
    this.dispatch("closing");
    this.dispatch("update", function (dt) {
        if (delay > 0) {
            delay -= dt;
            return true;
        }

        _this2.container.y += 0.75 * _this2.viewHeight * dt;
        if (_this2.container.y > _this2.viewHeight) {
            _this2.container.parent.removeChild(_this2.container);
            _this2.state = "idle";
            if (_this2.messages.length > 0) {
                // Show the next message
                _this2.showMessage(_this2.messages.shift());
            } else {
                _this2.dispatch("closed");
            }
            _this2.dispatch("redraw");
            return false;
        }
        return true;
    });
};

Dialog.prototype.handleResize = function (width, height) {
    this.viewWidth = width;
    this.viewHeight = height;
    // TODO - handle resize when a message is displayed currently
};

module.exports = Dialog;

},{"./events":3,"./utils":13}],3:[function(require,module,exports){
"use strict";

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
function EventManager() {
    this.callbacks = {};
}

EventManager.prototype.destroy = function () {
    this.callbacks = null;
};

EventManager.prototype.hasListeners = function (event) {
    return this.callbacks[event] && this.callbacks[event].length > 0;
};

/* Add an event callback under the given name */
EventManager.prototype.addEventListener = function (event, callback) {
    var _this = this;

    if (!this.callbacks[event]) {
        this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return {
        remove: function remove() {
            _this.removeEventListener(event, callback);
        },
        event: event,
        callback: callback
    };
};

EventManager.prototype.removeEventListener = function (event, callback) {
    var lst = this.callbacks[event];
    if (!lst) return;

    var i = lst.indexOf(callback);
    if (i !== -1) {
        this.callbacks[event] = lst.slice(0, i).concat(lst.slice(i + 1));
    }
};

EventManager.prototype.dispatcher = function (event) {
    var _this2 = this;

    if (event) {
        return function () {
            _this2.dispatch(event);
        };
    }
    return this.dispatch.bind(this);
};

/* Trigger all callbacks attached to the given event name */
EventManager.prototype.dispatch = function (event) {
    if (!event) throw Error("must supply an event to dispatch");
    if (!this.callbacks[event]) {
        // No attached handlers
        return;
    }
    // Get the list of arguments and call the attached handlers
    var args = Array.prototype.slice.call(arguments, 1);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = this.callbacks[event][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var cb = _step.value;

            cb.apply(null, args);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

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
EventManager.prototype.hook = function (event) {
    var _this3 = this;

    var func = function func(callback) {
        return _this3.addEventListener(event, callback);
    };
    /*func.remove = (callback) => {
        this.removeEventListener(event, callback);
    };*/
    return func;
};

/*********/
/* Timer */
/*********/

/* Implements functionality similar to setTimeout and clearTimeout, but allows
 * the timer to be paused and resume. */
function Timer(callback, delay) {
    this.callback = callback;
    this.startTime = 0;
    this.delay = delay;
    this.timeLeft = delay;
    this.paused = true;
    this.timeoutEvent = null;
    this.resume();
}

Timer.prototype.destroy = function () {
    this.pause();
};

/* Pause the timer to be resumed later */
Timer.prototype.pause = function () {
    if (!this.paused) {
        this.paused = true;
        clearTimeout(this.timeoutEvent);
        this.timeoutEvent = null;
        // Update the amount of time left (for when the timer is resumed)
        this.timeLeft -= new Date().getTime() - this.startTime;
    }
};

/* Resume the timer when paused */
Timer.prototype.resume = function () {
    var _this4 = this;

    if (this.paused) {
        this.startTime = new Date().getTime();
        this.paused = false;
        this.timeoutEvent = setTimeout(function () {
            _this4.timeoutEvent = null;
            if (_this4.callback()) {
                _this4.timeLeft = _this4.delay;
                _this4.paused = true;
                _this4.resume();
            }
        }, this.timeLeft);
    }
};

/*************/
/* TimerList */
/*************/

function TimerList() {
    this.timers = [];
}

TimerList.prototype.destroy = function () {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = this.timers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var tm = _step2.value;

            tm.destroy();
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    this.timers = null;
};

TimerList.prototype.clear = function () {
    this.destroy();
    this.timers = [];
};

TimerList.prototype.start = function (callback, delay) {
    var _this5 = this;

    var tm = new Timer(function () {
        var ret = callback();
        if (!ret) {
            // No more callbacks - remove the timer from the list
            _this5.cancel(tm);
        }
        return ret;
    }, delay);
    this.timers.push(tm);
    return tm;
};

TimerList.prototype.cancel = function (tm) {
    var n = this.timers.indexOf(tm);
    tm.pause();
    if (n !== -1) {
        this.timers = this.timers.slice(0, n).concat(this.timers.slice(n + 1));
    }
};

TimerList.prototype.pause = function () {
    // Pause all timers
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = this.timers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var tm = _step3.value;

            tm.pause();
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }
};

TimerList.prototype.resume = function () {
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = this.timers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var tm = _step4.value;

            tm.resume();
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }
};

module.exports = {
    EventManager: EventManager,
    Timer: Timer,
    TimerList: TimerList
};

},{}],4:[function(require,module,exports){
"use strict";

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

/*************/
/* GameState */
/*************/

function GameState(div) {
   var _this = this;

   // The screen currently displayed
   this.screen = null;
   this.gameLogic = new Logic.GameLogic();
   this.dataList = {};
   this.lastRenderTime = null;

   //this.screen = new Screen();

   // Callback function for passing to renderAnimationFrame
   this.staticRenderFrame = function () {
      _this.renderFrame();
   };
   window.addEventListener("resize", function () {
      _this.handleResize();
   });
   // Call our resize handler to setup the render area at the correct size
   //this.handleResize();

   Render.configure(div, 1);

   // Setup mouse and/or touch handlers
   var m = new Input.MouseAdapter(Render.getRenderer().view);
   this.setupInputHandlers(m);

   this.screen = new Loader.LoadingScreen(Render.getRenderer().width, Render.getRenderer().height);

   this.screen.onDone(function () {
      _this._startGame();
   });

   this.screen.onRedraw(function () {
      _this.redraw();
   });

   this.screen.start();
}

/* Attach the player events to the various input handlers. An event adapter
 * should be passed in here. (eg MouseAdapter) */
GameState.prototype.setupInputHandlers = function (m) {
   var _this2 = this;

   m.onClick(function (evt) {
      if (_this2.screen && _this2.screen.handleClick) {
         _this2.screen.handleClick(evt);
      }
   });
   m.onDragStart(function (evt) {
      if (_this2.screen && _this2.screen.handleDragStart) {
         _this2.screen.handleDragStart(evt);
      }
   });
   m.onDrag(function (evt) {
      if (_this2.screen && _this2.screen.handleDrag) {
         _this2.screen.handleDrag(evt);
      }
   });
   m.onDragStop(function (evt) {
      if (_this2.screen && _this2.screen.handleDragStop) {
         _this2.screen.handleDragStop(evt);
      }
   });
};

/* Schedule a redraw of the game screen */
GameState.prototype.redraw = function () {
   if (!this.manualRedraw) {
      this.manualRedraw = true;
      requestAnimationFrame(this.staticRenderFrame);
   }
};

/* Returns the bounding (client) rectangle of the game rendering area */
/*
GameState.prototype.getBoundingClientRect = function()
{
    return this.renderer.view.getBoundingClientRect();
}*/

/* Renders the current screen. Should be called from requestAnimationFrame */
GameState.prototype.renderFrame = function () {
   if (!this.screen) return;

   var redraw = false;
   if (this.screen.update) {
      var now = new Date().getTime();
      var dt = 0;
      if (this.lastRenderTime !== null) {
         dt = (now - this.lastRenderTime) / 1000.0;
      }
      this.lastRenderTime = now;
      redraw = this.screen.update(dt);
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
};

GameState.prototype.handleResize = function () {
   Render.resize();
   if (this.screen && this.screen.handleResize) {
      this.screen.handleResize(Render.getRenderer().width, Render.getRenderer().height);
   }
   this.redraw();
};

GameState.prototype._startGame = function () {
   var _this3 = this;

   this.dataList = this.screen.dataList;
   this.screen = new PlayScreen(this.gameLogic, this.dataList, Render.getRenderer().width, Render.getRenderer().height);

   // Attach to various events exposed by the PlayScreen
   this.screen.onGameOver(function () {
      // ...
   });

   this.screen.onComplete(function () {
      // ...
   });

   this.screen.onRedraw(function () {
      _this3.redraw();
   });
   // Now change to the opening scene
   //this.screen.changeScene("closet", {cameraX: 0});
   this.gameLogic.startGame(this.screen);
};

module.exports = GameState;

},{"./input":5,"./loader":6,"./logic":7,"./playscreen":9,"./render":10}],5:[function(require,module,exports){
"use strict";

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

var Events = require("./events");

/****************/
/* MouseAdapter */
/****************/

/* Converts standard mouse events (mousedown/up/move) into a more convenient
 * interface:
 *
 *  - click - The standard click event is fired if a mousedown and mouseup
 *    are fired on the same element, even if there is movement between events
 *  - dragStart - The user has started dragging the mouse
 *  - drag - Fired for every mouse movement while dragging. The x, y offset
 *    from the start of the dragging action is passed into the callback.
 *  - dragStop - The dragging action is finished.
*/
function MouseAdapter(src) {
   var _this = this;

   this.src = src;
   // Whether the mouse button is currently being pressed
   this.pressing = false;
   // We track the number of mousemove events
   this.movements = 0;
   this.dragStartX = 0;
   this.dragStartY = 0;

   // Setup some event handlers for dispatching below
   var mgr = new Events.EventManager();
   this.onClick = mgr.hook("click");
   this.onDrag = mgr.hook("drag");
   this.onDragStart = mgr.hook("dragStart");
   this.onDragStop = mgr.hook("dragStop");

   // Attach the mousedown event to the render area, so the player has to 
   // click on the element (eg render area) to start dragging, or to 
   // interact with an object.
   src.addEventListener("mousedown", function (event) {
      _this.pressing = true;
      _this.movements = 0;
   });

   // However we attach the mousemove event to the whole window, so the player
   // can drag outside the render area and still pan around.
   window.addEventListener("mousemove", function (event) {
      if (!_this.pressing) return;

      // If the mouse just started moving, issue a drag start event
      if (_this.movements === 0) {
         var rect = _this.src.getBoundingClientRect();
         var x = event.clientX - rect.left;
         var y = event.clientY - rect.top;
         mgr.dispatch("dragStart", new GameEvent({ x: x, y: y }));

         _this.dragStartX = event.clientX;
         _this.dragStartY = event.clientY;
      } else {
         // The drag coordinates are always given relative to where the
         // user starting dragging.
         var evt = new GameEvent({
            dx: event.clientX - _this.dragStartX,
            dy: event.clientY - _this.dragStartY });
         mgr.dispatch("drag", evt);
      }
      _this.movements++;
   });

   // Attach the mouseup event to the window, so we can pickup on the event
   // even if the player has dragged out of the render area.
   window.addEventListener("mouseup", function (event) {
      var rect = _this.src.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;

      // If the mouse didn't move at all, it's a click event. Otherwise we
      // were dragging and should issue a drag stop event. Also note we 
      // make sure the mouse cursor is within the area before issuing
      // the click event. (ie you can't click things that are out of view
      var evt = new GameEvent({ x: x, y: y });
      if (_this.movements === 0 && x >= 0 && y >= 0 && x <= rect.right && y <= rect.bottom) {
         mgr.dispatch("click", evt);
      } else {
         // Pass in the drag start position (relative to the view area)
         var rect = _this.src.getBoundingClientRect();
         evt.dragStartX = _this.dragStartX - rect.left;
         evt.dragStartY = _this.dragStartY - rect.top;
         mgr.dispatch("dragStop", evt);
      }
      _this.pressing = false;
   });
}

function GameEvent(options) {
   for (var key in options) {
      this[key] = options[key];
   }
}

/****************/
/* TouchAdapter */
/****************/

function TouchAdapter() {}

module.exports = {
   MouseAdapter: MouseAdapter,
   TouchAdapter: TouchAdapter,
   GameEvent: GameEvent
};

},{"./events":3}],6:[function(require,module,exports){
"use strict";

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

var Events = require("./events");
var Scene = require("./scene");
var Audio = require("./audio");

/**********/
/* Loader */
/**********/

function Loader() {
    // The list of resource paths (eg path to image) to load
    this.queue = [];
    // The list of loaded resources (eg the images themselves)
    this.loaded = [];
    this._onload = null;
    this._onerror = null;
    this._ondone = null;
}

Loader.prototype.onload = function (handler) {
    this._onload = handler;
    return this;
};

Loader.prototype.onerror = function (handler) {
    this._onerror = handler;
    return this;
};

Loader.prototype.ondone = function (handler) {
    this._ondone = handler;
    return this;
};

Loader.prototype.handleError = function (src) {
    if (this._onerror) this._onerror(src);
};

Loader.prototype.handleDone = function () {
    if (this._ondone) this._ondone(this.loaded);
};

Loader.prototype.handleLoaded = function (obj, src, arg) {
    var i = this.queue.indexOf(src);
    if (i === -1) {
        console.log("ERROR: cannot dequeue " + src);
        return;
    }

    this.queue[i] = this.queue[this.queue.length - 1];
    this.queue.pop();
    this.loaded.push(obj);

    if (this._onload) this._onload(obj, arg);

    if (this.queue.length === 0) {
        this.handleDone();
    }
};

/*******************/
/* SceneDataLoader */
/*******************/

function SceneDataLoader(indexPath) {
    var _this = this;

    Loader.call(this);

    // First load index.json which will tell us what scenes to load
    var req = new XMLHttpRequest();
    req.overrideMimeType("application/json");

    // Add a timestamp to avoid caching this
    var srcPath = indexPath + "?time=" + new Date().getTime();
    req.open("GET", srcPath, true);

    req.onerror = function () {
        _this.handleError(indexPath);
    };
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == "200") {
            // TODO - handle exceptions here
            var scenes = JSON.parse(req.responseText);
            var n = indexPath.lastIndexOf("/");
            var basedir = indexPath.substr(0, n + 1);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = scenes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var scene = _step.value;

                    _this.add(basedir + scene + "/scene.json");
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    };
    req.send(null);
}
SceneDataLoader.prototype = Object.create(Loader.prototype);

SceneDataLoader.prototype.handleDone = function () {
    var scenes = {};
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = this.loaded[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var scn = _step2.value;

            scenes[scn.name] = scn;
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    if (this._ondone) this._ondone(scenes);
};

SceneDataLoader.prototype.add = function (src, arg) {
    var _this2 = this;

    this.queue.push(src);

    var req = new XMLHttpRequest();
    req.overrideMimeType("application/json");

    // Add a timestamp to avoid caching this
    var srcPath = src + "?time=" + new Date().getTime();
    req.open("GET", srcPath, true);

    req.onerror = function () {
        _this2.handleError(src);
    };

    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == "200") {
            // Parse the JSON and extract the scene info
            // TODO - handle exceptions here
            var scn = Scene.SceneData.fromJSON(src, req.responseText);
            scn.src = src;
            _this2.handleLoaded(scn, src, arg);
        }
    };

    req.send(null);
};

/*****************/
/* LoadingScreen */
/*****************/

/* Loads various game resources while showing a loading screen/progress to
 * the player. */
function LoadingScreen(viewWidth, viewHeight) {
    this.name = "LoadingScreen";
    this.stage = new PIXI.Container();
    this.started = false;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    var mgr = new Events.EventManager();
    this.dispatch = mgr.dispatcher();
    this.onRedraw = mgr.hook("redraw");
    this.onDone = mgr.hook("done");
}

LoadingScreen.prototype.start = function () {
    if (!this.started) {
        this.started = true;
        this._loadSceneData();
    }
};

LoadingScreen.prototype._showMessage = function (msg) {
    var fontSize = this.viewHeight * 0.05;
    var text = new PIXI.Text(msg, {
        fontSize: fontSize,
        fill: "white"
    });
    text.x = this.viewWidth * 0.05;
    text.y = this.viewHeight * 0.05;
    this.stage.children = [];
    this.stage.addChild(text);
    this.dispatch("redraw");
};

LoadingScreen.prototype._loadSceneData = function () {
    var _this3 = this;

    // Load all the scene meta data here, then the scene images below
    var ldr = new SceneDataLoader("media/scenes/index.json");
    ldr.ondone(function (dataList) {
        _this3._loadSceneImages(dataList);
    });

    ldr.onerror(function (src) {
        console.log("Error loading scene: " + src);
    });

    ldr.onload(function (scn, src) {
        console.log("Loaded scene: " + scn.name);
    });
    this._showMessage("Loading scene meta data");
};

/* Called when the basic scene data is loaded. This function loads the layer
 * and thing textures for each scene. */
LoadingScreen.prototype._loadSceneImages = function (dataList) {
    var _this4 = this;

    this.dataList = dataList;
    this._showMessage("Loading scene images");
    // Queue up the texture maps associated with the various scenes
    PIXI.loader.defaultQueryString = "nocache=" + new Date().getTime();
    for (var name in dataList) {
        PIXI.loader.add(dataList[name].spritesPath);
    };
    PIXI.loader.on("progress", function (loader, res) {
        //console.log(res);
        //this._showMessage("Loading scene images: " + res.url);
    });

    PIXI.loader.load(function () {
        _this4._loadAudio();
    });
};

LoadingScreen.prototype._loadAudio = function () {
    var _this5 = this;

    var sources = [];
    for (var name in Audio.Effects) {
        sources.push(Audio.Effects[name]);
    }

    Audio.load(sources, {
        whenLoaded: function whenLoaded() {
            _this5.dispatch("done");
        },
        onFailed: function onFailed() {
            console.log("Failed to load audio file: " + source);
        },
        onProgress: function onProgress() {
            // ...
        }
    });
    this._showMessage("Loading audio");
};

module.exports = {
    LoadingScreen: LoadingScreen
};

},{"./audio":1,"./events":3,"./scene":11}],7:[function(require,module,exports){
"use strict";

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Utils = require("./utils");
var Audio = require("./audio");
var Events = require("./events");
var Transition = require("./transition");

/*********/
/* State */
/*********/

var State = function State() {
	_classCallCheck(this, State);

	this.checkedDoor = false;
	this.hasRedKey = false;
	this.bush1Moved = false;
	this.bush2Moved = false;
	this.seenHole1 = false;
	this.seenHole2 = false;
};

/*********/
/* Logic */
/*********/

var GameLogic = function () {
	function GameLogic() {
		_classCallCheck(this, GameLogic);

		// Scene specific logic stored by name
		this.gameState = new State();
		this.sceneLogic = {
			"intro": new IntroLogic(this.gameState),
			"ride": new RideLogic(this.gameState),
			"road": new RoadLogic(this.gameState),
			"closet": new ClosetLogic(this.gameState),
			"building": new BuildingLogic(this.gameState),
			"cave": new CaveLogic(this.gameState),
			"darkroad": new DarkRoadLogic(this.gameState),
			"ending": new EndingLogic(this.gameState)
		};
	}

	_createClass(GameLogic, [{
		key: "getSceneLogic",
		value: function getSceneLogic(name) {
			return this.sceneLogic[name];
		}
	}, {
		key: "startGame",
		value: function startGame(screen) {
			//let trans = new Transition.FadeIn(screen, "closet", {cameraX: 0});
			var trans = new Transition.FadeIn(screen, "intro", { cameraX: -1 });
			trans.start();
		}
	}]);

	return GameLogic;
}();

/****************/
/* LogicContext */
/****************/

function LogicContext(args) {
	this.screen = null;
	this.scene = null;
	this.thing = null;
	if (args) {
		this.screen = args.screen;
		this.scene = args.scene;
		this.thing = args.thing;

		if (!this.screen) throw Error("LogicContext must include screen");
		if (!this.scene) throw Error("LogicContext must include scene");
	}
}

LogicContext.prototype.getLayer = function (name) {
	var layer = this.scene.getLayer(name);
	if (!layer) {
		console.log("ERROR: can't find layer: " + name);
	}
	return layer;
};

LogicContext.prototype.getThing = function (name) {
	var thing = this.scene.getThing(name);
	if (!thing) {
		console.log("ERROR: can't find thing: " + name);
	}
	return thing;
};

LogicContext.prototype.showMessage = function (msg, options) {
	return this.screen.showMessage(msg, options);
};

LogicContext.prototype.addUpdate = function () {
	console.log("ADDUPDATE: " + arguments);
	return this.screen.addUpdate.apply(this.screen, arguments);
};

LogicContext.prototype.redraw = function () {
	this.screen.redraw();
};

LogicContext.prototype.changeScene = function (name, args) {
	if (this.screen.scene) {
		var trans = new Transition.FadeToScene(this.scene, name, args);
		trans.start();
	}
};

/*************/
/* BaseLogic */
/*************/

var BaseLogic = function () {
	function BaseLogic(state) {
		_classCallCheck(this, BaseLogic);

		this.timers = new Events.TimerList();
		this.gameState = state;
	}

	_createClass(BaseLogic, [{
		key: "destroy",
		value: function destroy() {
			this.timers.destroy();
			this.timers = null;
		}
	}, {
		key: "initScene",
		value: function initScene(screen, scene) {
			this.ctx = new LogicContext({
				screen: screen,
				scene: scene
			});
		}
	}, {
		key: "uninitScene",
		value: function uninitScene() {
			this.ctx = null;
		}
	}, {
		key: "enterScene",
		value: function enterScene() {}
	}, {
		key: "leaveScene",
		value: function leaveScene() {}
	}, {
		key: "pause",
		value: function pause() {
			this.timers.pause();
		}
	}, {
		key: "resume",
		value: function resume() {
			this.timers.resume();
		}
	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {}
	}]);

	return BaseLogic;
}();

/***************/
/* Scene Logic */
/***************/

/* Logic classes for the various scenes in the game */


var IntroLogic = function (_BaseLogic) {
	_inherits(IntroLogic, _BaseLogic);

	function IntroLogic(state) {
		_classCallCheck(this, IntroLogic);

		return _possibleConstructorReturn(this, (IntroLogic.__proto__ || Object.getPrototypeOf(IntroLogic)).call(this, state));
	}

	_createClass(IntroLogic, [{
		key: "initScene",
		value: function initScene(screen, scene) {
			_get(IntroLogic.prototype.__proto__ || Object.getPrototypeOf(IntroLogic.prototype), "initScene", this).call(this, screen, scene);
			this.ctx.getThing("door").setState("closed");
			this.ctx.getThing("cupboard").setState("closed");
		}
	}, {
		key: "enterScene",
		value: function enterScene() {
			this.timers.start(function () {
				//this.ctx.getThing("door").setState("open");
				//this.ctx.showMessage("The door opens!");
				console.log("Tick");
			}, 3000);

			this.timers.start(function () {
				if (Math.random() < 0.4) {
					Audio.play(Audio.Effects.Crickets, 0.1);
				}
				return true;
			}, 700);
		}
	}, {
		key: "leaveScene",
		value: function leaveScene() {
			this.timers.clear();
		}
	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {
			switch (thing.name) {
				case "candle":
					console.log("CANDLE");
					this.ctx.showMessage("A candle for evening work. I won't need it.");
					this.ctx.showMessage("Or maybe I will!");
					break;

				case "cupboard":
					if (thing.state === "open") thing.setState("closed");else thing.setState("open");

					Audio.play(Audio.Effects.Cupboard, 0.4);
					break;

				case "door":
					if (thing.state === "open") {
						thing.setState("closed");
						Audio.play(Audio.Effects.DoorClosing, 0.4);
					} else {
						thing.setState("open");
						Audio.play(Audio.Effects.DoorOpening, 0.25);
					}
					break;

				case "outside":
					this.ctx.changeScene("road");
					break;
			}
		}
	}]);

	return IntroLogic;
}(BaseLogic);

var RideLogic = function (_BaseLogic2) {
	_inherits(RideLogic, _BaseLogic2);

	function RideLogic(state) {
		_classCallCheck(this, RideLogic);

		return _possibleConstructorReturn(this, (RideLogic.__proto__ || Object.getPrototypeOf(RideLogic)).call(this, state));
	}

	_createClass(RideLogic, [{
		key: "initScene",
		value: function initScene(screen, scene) {
			var _this3 = this;

			_get(RideLogic.prototype.__proto__ || Object.getPrototypeOf(RideLogic.prototype), "initScene", this).call(this, screen, scene);

			var frame = 0;
			var fps = 10;
			this.timers.start(function () {
				frame = (frame + 1) % 4;
				_this3.ctx.getThing("horse").setState("" + frame);
				_this3.ctx.redraw();
				return true;
			}, 1000 / fps);
		}
	}]);

	return RideLogic;
}(BaseLogic);

var RoadLogic = function (_BaseLogic3) {
	_inherits(RoadLogic, _BaseLogic3);

	function RoadLogic(state) {
		_classCallCheck(this, RoadLogic);

		return _possibleConstructorReturn(this, (RoadLogic.__proto__ || Object.getPrototypeOf(RoadLogic)).call(this, state));
	}

	_createClass(RoadLogic, [{
		key: "initScene",
		value: function initScene(screen, scene) {
			var _this5 = this;

			_get(RoadLogic.prototype.__proto__ || Object.getPrototypeOf(RoadLogic.prototype), "initScene", this).call(this, screen, scene);

			this.ctx.getThing("bush1").setVisible(!this.gameState.bush1Moved);
			this.ctx.getThing("bush2").setVisible(!this.gameState.bush2Moved);

			this.updateCrow();
			this.onCameraCallback = this.ctx.screen.onCamera(function () {
				_this5.updateCrow();
			});
		}
	}, {
		key: "leaveScene",
		value: function leaveScene() {
			this.onCameraCallback.remove();
		}
	}, {
		key: "updateCrow",
		value: function updateCrow() {
			if (this.ctx.scene.cameraX > -0.1) {
				this.crowFacing = "right";
			} else if (this.ctx.scene.cameraX < -0.2) {
				this.crowFacing = "left";
			}
			this.ctx.getThing("crow").setState(this.crowFacing);
		}
	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {
			switch (thing.name) {
				case "player":
					this.ctx.showMessage("It's been a long road here.");
					break;

				case "bush1":
					this.gameState.bush1Moved = true;
					thing.setVisible(false);
					if (this.gameState.bush2Moved) {
						this.ctx.showMessage("There's a cave behind these bushes!");
					} else {
						this.ctx.showMessage("I've cleared away some brush. There's something behind it!");
					}
					break;

				case "bush2":
					this.gameState.bush2Moved = true;
					thing.setVisible(false);
					if (this.gameState.bush1Moved) {
						this.ctx.showMessage("There's a cave behind these bushes!");
					} else {
						this.ctx.showMessage("I've cleared away some brush. There's something behind it!");
					}
					break;

				case "cave":
					if (!this.gameState.bush1Moved || !this.gameState.bush2Moved) {
						this.ctx.showMessage("I must clear the way first.");
					} else {
						this.ctx.changeScene("cave");
					}
					break;

				case "house":
					if (this.gameState.checkedDoor) {
						this.ctx.showMessage("Maybe I can find a key, or another way in.");
					} else {
						this.ctx.showMessage("There's no answer and the door's locked.");
						this.gameState.checkedDoor = true;
					}
					break;

				case "crow":
					this.ctx.showMessage("A crow is watching.");
					break;
			}
		}
	}]);

	return RoadLogic;
}(BaseLogic);

var ClosetLogic = function (_BaseLogic4) {
	_inherits(ClosetLogic, _BaseLogic4);

	function ClosetLogic(state) {
		_classCallCheck(this, ClosetLogic);

		var _this6 = _possibleConstructorReturn(this, (ClosetLogic.__proto__ || Object.getPrototypeOf(ClosetLogic)).call(this, state));

		_this6.States = {
			// Player enters scene
			None: 0,
			// Monster visible outside
			MonsterVisible: 1,
			// Moving the camera to centre on the monster
			CentreCamera: 2,
			// Left tentacle visible
			LeftTentacle: 3,
			// Right tentacle visible
			RightTentacle: 4,
			// Closet doors fully open
			DoorsOpen: 5,
			// Scene is fading out
			FadeOut: 6
		};
		_this6.state = _this6.States.None;
		return _this6;
	}

	_createClass(ClosetLogic, [{
		key: "initScene",
		value: function initScene(screen, scene) {
			var _this7 = this;

			_get(ClosetLogic.prototype.__proto__ || Object.getPrototypeOf(ClosetLogic.prototype), "initScene", this).call(this, screen, scene);

			this.ctx.getThing("monster").setVisible(false);
			this.ctx.getThing("tent1").setVisible(false);
			this.ctx.getThing("tent2").setVisible(false);

			this.ctx.screen.enterCutscene();
			var dialog = this.ctx.showMessage("Am I safe in here???");
			var closedCB = dialog.onClosed(function () {
				closedCB.remove();
				_this7.fadeInScene();
			});

			this.onCameraCallback = this.ctx.screen.onCamera(function () {
				if (_this7.state === _this7.States.MonsterVisible && _this7.ctx.scene.cameraX > -0.35 && _this7.ctx.scene.cameraX < 0.35) {
					_this7.changeState(_this7.States.CentreCamera);
				}
				if (_this7.state === _this7.States.None && (_this7.ctx.scene.cameraX > 0.75 || _this7.ctx.scene.cameraX < -0.75)) {
					_this7.changeState(_this7.States.MonsterVisible);
				}
			});
		}
	}, {
		key: "leaveScene",
		value: function leaveScene() {
			this.onCameraCallback.remove();
		}
	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {}
	}, {
		key: "fadeInScene",
		value: function fadeInScene() {
			var _this8 = this;

			this.ctx.addUpdate(Utils.delayUpdate(1.5), function (dt) {
				// Opening the crack
				var sprite = _this8.ctx.getThing("crack").getSprite();
				var stop = _this8.ctx.getThing("darkright").getSprite();
				var thing = _this8.ctx.getThing("crack");

				//this.offset += dt;
				//sprite.x += 10*dt*(Math.sin(this.offset/2)**2);
				sprite.x += 8 * dt;
				if (sprite.x > stop.x) {
					sprite.visible = false;
					_this8.ctx.screen.leaveCutscene();
					return false;
				}
				return true;
			}, function (dt) {
				// Player's eyes adjusting to the darkness
				var sprite1 = _this8.ctx.getThing("darkright").getSprite();
				var sprite2 = _this8.ctx.getThing("darkleft").getSprite();
				sprite1.alpha -= 0.30 * dt;
				sprite2.alpha -= 0.30 * dt;
				if (sprite1.alpha < 0) {
					sprite1.visible = false;
					sprite2.visible = false;
					return false;
				}
				return true;
			});
		}
	}, {
		key: "changeState",
		value: function changeState(state) {
			var _this9 = this;

			this.state = state;
			switch (state) {
				case this.States.MonsterVisible:
					// Show the monster now
					var monster = this.ctx.getThing("monster");
					if (!monster.isVisible()) {
						var frame = 0;
						this.timers.start(function () {
							frame = (frame + 1) % 2;
							monster.setState("" + frame);
							_this9.ctx.redraw();
							return true;
						}, 1000 / 5.0);
					}
					break;

				case this.States.CentreCamera:
					// Slowly pan the camera to X=0
					this.ctx.screen.enterCutscene();
					this.ctx.addUpdate(function (dt) {
						var speed = 0.6;
						var newX = _this9.ctx.scene.cameraX;
						newX -= Math.sign(_this9.ctx.scene.cameraX) * speed * dt;
						if (newX * _this9.ctx.scene.cameraX <= 0) {
							// Done panning
							_this9.ctx.scene.setCameraPos(0);
							_this9.changeState(_this9.States.LeftTentacle);
							return false;
						}
						_this9.ctx.scene.setCameraPos(newX);
						return true;
					});
					break;

				case this.States.LeftTentacle:
					this.timers.start(function () {
						_this9.ctx.getThing("tent1").setVisible(true);
						_this9.changeState(_this9.States.RightTentacle);
						return false;
					}, 750);
					break;

				case this.States.RightTentacle:
					this.timers.start(function () {
						_this9.ctx.getThing("tent2").setVisible(true);
						_this9.changeState(_this9.States.DoorsOpen);
						return false;
					}, 750);
					break;

				case this.States.DoorsOpen:
					this.timers.start(function () {
						var counter = 0;
						_this9.ctx.addUpdate(function (dt) {
							var speed = 20;
							_this9.ctx.getThing("doorleft").getSprite().x -= speed * dt;
							_this9.ctx.getThing("doorright").getSprite().x += speed * dt;
							_this9.ctx.getThing("tent1").getSprite().x -= speed * dt;
							_this9.ctx.getThing("tent2").getSprite().x += speed * dt;
							counter += speed * dt;
							if (counter > 5) {
								_this9.changeState(_this9.States.FadeOut);
								return false;
							}
						});
						return false;
					}, 750);
					break;

				case this.States.FadeOut:
					var trans = new Transition.FadeToScene(this.ctx.scene, "ending", {
						colour: "white",
						pauseTime: 1.5
					});
					trans.start();
					break;
			}
		}
	}]);

	return ClosetLogic;
}(BaseLogic);

var DarkRoadLogic = function (_BaseLogic5) {
	_inherits(DarkRoadLogic, _BaseLogic5);

	function DarkRoadLogic() {
		_classCallCheck(this, DarkRoadLogic);

		return _possibleConstructorReturn(this, (DarkRoadLogic.__proto__ || Object.getPrototypeOf(DarkRoadLogic)).apply(this, arguments));
	}

	_createClass(DarkRoadLogic, [{
		key: "enterScene",
		value: function enterScene() {
			_get(DarkRoadLogic.prototype.__proto__ || Object.getPrototypeOf(DarkRoadLogic.prototype), "enterScene", this).call(this);
			this.ctx.showMessage("Sunset. How long was I down there?");
		}
	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {
			switch (thing.name) {
				case "player":
					this.ctx.showMessage("I'm glad I brought a light.");
					break;

				case "cave":
					this.ctx.showMessage("No. I don't want to go back down there.");
					break;

				case "house":
					this.ctx.changeScene("building", { cameraX: -1 });
					break;
			}
		}
	}]);

	return DarkRoadLogic;
}(BaseLogic);

var CaveLogic = function (_BaseLogic6) {
	_inherits(CaveLogic, _BaseLogic6);

	function CaveLogic(state) {
		_classCallCheck(this, CaveLogic);

		return _possibleConstructorReturn(this, (CaveLogic.__proto__ || Object.getPrototypeOf(CaveLogic)).call(this, state));
	}

	_createClass(CaveLogic, [{
		key: "initScene",
		value: function initScene(screen, scene) {
			_get(CaveLogic.prototype.__proto__ || Object.getPrototypeOf(CaveLogic.prototype), "initScene", this).call(this, screen, scene);

			this.timers.start(function () {
				Audio.play(Audio.Effects.Drip, 0.5);
				return true;
			}, 5000);
			this.ctx.getThing("hole2").setState("empty");
			this.ctx.getThing("key").setVisible(!this.gameState.hasRedKey);
			this.ctx.getThing("shape").getSprite().x = -24;
		}
	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {
			var _this12 = this;

			switch (thing.name) {
				case "ladder":
					if (this.gameState.hasRedKey) {
						this.ctx.changeScene("darkroad", { cameraX: 1 });
					} else {
						this.ctx.changeScene("road", { cameraX: 1 });
					}
					break;

				case "key":
					this.ctx.getThing("key").setVisible(false);
					this.gameState.hasRedKey = true;
					this.ctx.showMessage("A small key. Odd it was left here.");
					break;

				case "hole1":
					if (this.gameState.seenHole1) {
						this.ctx.showMessage("There is only darkness.");
						break;
					}
					this.gameState.seenHole1 = true;
					this.ctx.getThing("hole1").setVisible(false);
					this.timers.start(function () {
						Audio.play(Audio.Effects.ShapeSound);
					}, 250);
					this.ctx.addUpdate(function (dt) {
						var sprite = _this12.ctx.getThing("shape").getSprite();
						sprite.x += 40 * dt;
						if (sprite.x > 16) {
							_this12.ctx.getThing("hole1").setVisible(true);
							_this12.ctx.showMessage("AHHH! What even was that?");
							return false;
						}
						return true;
					});
					break;

				case "hole2":
					//if (this.ctx.state.seenHole2) {
					this.ctx.showMessage("There is only darkness.");
					break;
					//}
					//this.ctx.state.seenHole2 = true;
					/*
     this.ctx.addUpdate(
         Utils.delayUpdate(0.5),
         (dt) => {
             this.ctx.getThing("hole2").setState("eyes");
         },
         Utils.delayUpdate(0.2),
         (dt) => {
             this.ctx.getThing("hole2").setState("empty");
         },
         Utils.delayUpdate(0.5),
         (dt) => {
             this.ctx.getThing("hole2").setState("eyes");
         },
         Utils.delayUpdate(0.5),
         (dt) => {
             this.ctx.getThing("hole2").setState("empty");
         }
     );*/
					break;
			}
		}
	}]);

	return CaveLogic;
}(BaseLogic);

var BuildingLogic = function (_BaseLogic7) {
	_inherits(BuildingLogic, _BaseLogic7);

	function BuildingLogic(state) {
		_classCallCheck(this, BuildingLogic);

		var _this13 = _possibleConstructorReturn(this, (BuildingLogic.__proto__ || Object.getPrototypeOf(BuildingLogic)).call(this, state));

		_this13.States = {
			// Default state when the player enters the scene
			None: 0,
			// Monster waiting behind door. Triggered by checking closet
			MonsterWaiting: 1,
			// Front door is closed, player must retreat to closet
			PlayerMustHide: 2
		};
		_this13.state = _this13.States.None;
		return _this13;
	}

	_createClass(BuildingLogic, [{
		key: "initScene",
		value: function initScene(screen, scene) {
			_get(BuildingLogic.prototype.__proto__ || Object.getPrototypeOf(BuildingLogic.prototype), "initScene", this).call(this, screen, scene);

			this.ctx.getThing("door").setState("open");
			this.ctx.getThing("cdoor").setState("closed");
			this.ctx.getThing("light").setState("off");
			this.ctx.getThing("candle").invisibleToClicks = true;
			this.ctx.getThing("darkness").invisibleToClicks = true;
			this.ctx.getThing("closet").setState("dark");
			this.ctx.getThing("monster").setVisible(false);
		}

		/*    changeState(state) {
  	this.state = state;
  	switch(state) 
  	{
  	case this.States.MonsterWaiting:
  	    break;
  
  	case this.States.PlayerMustHide:
  	    break;
  	}
      }*/

	}, {
		key: "handleClicked",
		value: function handleClicked(thing) {
			var _this14 = this;

			switch (thing.name) {
				case "door":
					if (this.state === this.States.MonsterWaiting) {
						var fps = 5;
						var frame = 0;
						this.ctx.getThing("door").setState("open");
						this.ctx.getThing("monster").setState("0");
						this.timers.start(function () {
							if (_this14.state === _this14.States.PlayerMustHide) {
								return false;
							}
							frame = (frame + 1) % 2;
							_this14.ctx.getThing("monster").setState("" + frame);
							_this14.ctx.redraw();
							return true;
						}, 1000.0 / fps);

						this.timers.start(function () {
							_this14.state = _this14.States.PlayerMustHide;
							_this14.ctx.getThing("door").setState("closed");
							_this14.ctx.showMessage("WHAT IS THAT??!? I've got to hide!");
						}, 1000);
					} else if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("No! I've got to hide!");
					} else if (thing.state === "open") {
						thing.setState("closed");
						Audio.play(Audio.Effects.DoorClosing, 0.4);
					} else {
						thing.setState("open");
						Audio.play(Audio.Effects.DoorOpening, 0.25);
					}
					break;

				case "cdoor":
					if (thing.state === "open") {
						thing.setState("closed");
						//Audio.play(Audio.Effects.DoorClosing, 0.4);
					} else {
						thing.setState("open");
						//Audio.play(Audio.Effects.DoorOpening, 0.25);
					}
					break;

				case "closet":
					if (this.state === this.States.PlayerMustHide) {
						this.ctx.changeScene("closet", { cameraX: 0 });
					} else if (thing.state === "dark") {
						this.ctx.showMessage("Even with the lamp it's too dark to see anything in there.");
						this.ctx.showMessage("...the blood... I need to find a light.");
					} else {
						this.ctx.showMessage("It's filled with clothing and random junk. That's it. It's just a closet. Why the blood?");
						this.ctx.getThing("door").setState("closed");
						this.state = this.States.MonsterWaiting;
					}
					break;

				case "clock":
					if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("I need to find a place to hide!");
					} else {
						this.ctx.showMessage("It stopped years ago.");
					}
					break;

				case "outside":
					if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("I need to find a place to hide!");
					} else {
						this.ctx.showMessage("I should look around first.");
					}
					break;

				case "bookshelf":
					if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("I need to find a place to hide!");
					} else {
						this.ctx.showMessage("Everything is covered in grit and dust. Does anybody still live here?");
					}
					break;

				case "clothes":
					if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("I need to find a place to hide!");
					} else {
						this.ctx.showMessage("Dirty sheets... this place is a mess.");
					}
					break;

				case "bloodarea":
					if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("I need to find a place to hide!");
					} else {
						this.ctx.showMessage("Blood... what happened here?");
					}
					break;

				case "light":
					if (thing.state === "off") {
						thing.setState("on");
						this.ctx.getThing("darkness").setVisible(false);
						this.ctx.getThing("closet").setState("light");
						this.ctx.addUpdate(Utils.delayUpdate(0.4), function (dt) {
							var sprite = _this14.ctx.getThing("candle").getSprite();
							sprite.y += 20 * dt;
							if (sprite.y > 0) {
								_this14.ctx.getThing("candle").setVisible(false);
								return false;
							}
							return true;
						});
					} else if (this.state === this.States.PlayerMustHide) {
						this.ctx.showMessage("I need to find a place to hide!");
					} else {
						this.ctx.showMessage("...I'd prefer the lights stay on.");
					}
					break;
			}
		}
	}]);

	return BuildingLogic;
}(BaseLogic);

var EndingLogic = function (_BaseLogic8) {
	_inherits(EndingLogic, _BaseLogic8);

	function EndingLogic(state) {
		_classCallCheck(this, EndingLogic);

		return _possibleConstructorReturn(this, (EndingLogic.__proto__ || Object.getPrototypeOf(EndingLogic)).call(this, state));
	}

	_createClass(EndingLogic, [{
		key: "enterScene",
		value: function enterScene() {
			var _this16 = this;

			_get(EndingLogic.prototype.__proto__ || Object.getPrototypeOf(EndingLogic.prototype), "enterScene", this).call(this);

			this.timers.start(function () {
				_this16.ctx.showMessage("Thanks for playing this demo!");
			}, 5000);
		}
	}]);

	return EndingLogic;
}(BaseLogic);

module.exports = {
	GameLogic: GameLogic,
	State: State
};

},{"./audio":1,"./events":3,"./transition":12,"./utils":13}],8:[function(require,module,exports){
"use strict";

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

var GameState = require("./gamestate");
var gameState = null;

module.exports = {};
module.exports.configure = function (div) {
    gameState = new GameState(div);
};

module.exports.getState = function () {
    return gameState;
};

module.exports.resize = function () {
    return gameState.handleResize();
};

},{"./gamestate":4}],9:[function(require,module,exports){
"use strict";

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
var Events = require("./events");
var Dialog = require("./dialog");
var Scene = require("./scene");
var Utils = require("./utils");

/**************/
/* PlayScreen */
/**************/

function PlayScreen(gameLogic, dataList, width, height) {
    var _this = this;

    this.name = "PlayScreen";
    // The scene currently displayed (Scene instance)
    this.scene = null;
    // The gameplay logic
    this.gameLogic = gameLogic;
    // The collection of all scenes (SceneData) in the game
    this.sceneDataList = dataList;
    // The top-level PIXI container that holds the scene sprites. This 
    // container gets scaled to fit the canvas.
    this.stage = new PIXI.Container();
    this.sceneStage = new PIXI.Container();
    this.stage.addChild(this.sceneStage);
    // The size of the viewing area
    this.viewWidth = width;
    this.viewHeight = height;
    this.isScenePaused = false;
    this.isCutscene = 0;
    // The thing being dragged around, or null if no dragging is happening
    // or the player is panning around instead.
    this.dragging = null;
    // The mouse cursor position when the player started dragging around
    this.dragStartX = 0;
    this.dragStartY = 0;
    // List of animation callback functions
    this.updateCallbacks = [];
    // Setup some events for communicating with the main game state
    var mgr = new Events.EventManager();
    this.onCamera = mgr.hook("camera");
    this.onComplete = mgr.hook("complete");
    this.onGameOver = mgr.hook("gameover");
    this.onRedraw = mgr.hook("redraw");
    this.onResize = mgr.hook("resize");
    this.onClick = mgr.hook("click");
    this.onDragStart = mgr.hook("dragStart");
    this.onDragStop = mgr.hook("dragStop");
    this.onDrag = mgr.hook("drag");
    //this.onVisible = mgr.hook("thing-visible");
    this.dispatch = mgr.dispatcher();
    this.redraw = mgr.dispatcher("redraw");
    this.eventManager = mgr;

    // Setup the dialog/message area and attach some event handlers
    this.dialog = new Dialog(this.viewWidth, this.viewHeight, this.stage, {
        fill: "black",
        background: "white",
        lightbox: "black"
    });

    this.dialog.onUpdate(function (cb) {
        _this.addUpdate(cb);
    });

    this.dialog.onRedraw(this.redraw.bind());

    this.dialog.onOpened(function (cb) {
        // Pause game play and show the message (will be resumed when the 
        // dialog box is closed)
        _this.pause();
        _this.enterCutscene();
    });

    this.dialog.onClosing(function (cb) {
        _this.resume();
        _this.leaveCutscene();
    });
}

/* Called for every frame that is rendered by the game state. (called before
 * rendering to screen) Returns true to request another frame be rendered 
 * after this one, or false otherwise. */
PlayScreen.prototype.update = function (dt) {
    var lst = [];
    var redraw = false;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = this.updateCallbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var callback = _step.value;

            var ret = callback(dt);
            if (ret === true) redraw = true;
            if (ret !== false) {
                lst.push(callback);
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    this.updateCallbacks = lst;
    // Request more redraws while there is stuff to animate (via callbacks)
    //this.redraw()
    //return redraw;
    return this.updateCallbacks.length > 0;
};

/* Register an function to be called for every frame of animation. The handler
 * can return a code to indicate what it needs:
 * 
 * true => request a redraw of the screen
 * false => unregister the update handler
 * undefined => keep calling the handler, but a redraw is not requested
 * 
 */
PlayScreen.prototype.addUpdate = function () {
    var callbacks = Array.prototype.slice.call(arguments);
    var callback = function callback(dt) {
        if (callbacks.length === 0) return false;
        var ret = callbacks[0](dt);
        if (ret === false) {
            callbacks.shift();
        }
        return callbacks.length > 0;
    };
    this.updateCallbacks.push(callback);
    this.redraw();
};

PlayScreen.prototype.setScene = function (name, args) {
    // Default camera position for a new scene
    var cameraX = -1;
    var cameraY = 0;

    if (args) {
        if (args.cameraX !== undefined) cameraX = args.cameraX;
        if (args.cameraY !== undefined) cameraY = args.cameraY;
    }

    if (!this.sceneDataList[name]) {
        throw Error("No such scene: " + name);
    }
    if (this.scene) {
        this.scene.logic.leaveScene();
        this.scene.logic.uninitScene();
        this.scene.destroy(); // TODO - cache the scene
        this.scene = null;
    }

    this.scene = Scene.Scene.fromData(this.sceneDataList[name]);

    var logic = this.gameLogic.getSceneLogic(name);
    if (!logic) throw Error("Logic not found for scene: " + name);
    this.scene.initScene(this, logic);
    this.sceneStage.children = [];
    this.sceneStage.addChild(this.scene.container);
    this.sceneStage.scale.set(this.getDisplayScale());
    this.sceneStage.x = this.viewWidth / 2;
    this.sceneStage.y = this.viewHeight / 2;
    this.scene.setCameraPos(cameraX, cameraY);
    this.scene.logic.enterScene();
};

PlayScreen.prototype.setCameraPos = function (xpos, ypos) {
    this.scene.setCameraPos(xpos, ypos);
    if (this.eventManager.hasListeners("camera")) {
        this.dispatch("camera");
    }
};

PlayScreen.prototype.getDisplayScale = function () {
    return this.viewWidth / this.scene.getBaseSize().width;
};

/* Called when the game window is resized. This scales the scene to fit the 
 * available space. */
PlayScreen.prototype.handleResize = function (width, height) {
    if (this.scene) {
        this.viewWidth = width;
        this.viewHeight = height;
        this.sceneStage.x = width / 2;
        this.sceneStage.y = height / 2;
        this.sceneStage.scale.set(this.getDisplayScale());
        this.dialog.handleResize(width, height);
        this.dispatch("resize", width, height);
    }
};

PlayScreen.prototype.handleClick = function (evt) {
    if (!this.scene) return;

    var xp = evt.x / this.getDisplayScale();
    var yp = evt.y / this.getDisplayScale();

    if (!this.isCutscene) {
        if (this.scene.handleClicked(xp, yp)) {
            this.redraw();
        }
    }

    // A direct click will dismiss the dialog box
    if (this.dialog.isShown()) {
        this.dialog.hide();
        return;
    }
    this.dispatch("click", xp, yp);
};

PlayScreen.prototype.handleDragStart = function (evt) {
    if (!this.scene) return;

    if (this.dialog.isShown()) {
        this.dialog.hide(0.75);
        /*setTimeout(() => {
            this.dialog.hide();
        }, 1000);*/
    }

    this.dispatch("dragStart", xp, yp);

    var xp = evt.x / this.getDisplayScale();
    var yp = evt.y / this.getDisplayScale();

    if (!this.isCutscene) {
        var args = this.scene.checkHit(xp, yp);
        if (false) {
            //args.thing) {
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
};

PlayScreen.prototype.handleDragStop = function (evt) {
    // If the player clicked and panned the scene around only a short distance,
    // count this as a click event.
    var dist = 5;
    if (!this.dragging && Math.abs(evt.x - evt.dragStartX) < dist && Math.abs(evt.y - evt.dragStartY) < dist) {
        this.handleClick(evt);
    }
    this.dragging = null;

    this.dispatch("dragStop");
};

PlayScreen.prototype.handleDrag = function (evt) {
    if (!this.scene) return;

    if (!this.isCutscene) {
        if (this.dragging) {
            // Dragging a thing
            this.dragging.x = this.dragStartX + evt.dx / this.getDisplayScale();
            this.dragging.y = this.dragStartY + evt.dy / this.getDisplayScale();
            this.redraw();
        } else {
            // Panning the scene around
            var pos = this.dragStartX - evt.dx / (window.innerWidth / 2);
            pos = Math.max(Math.min(pos, 1), -1);
            this.setCameraPos(pos);
            this.redraw();
            // Now figure out what's in view and send visibility events
            // ...
        }
    }
};

PlayScreen.prototype.showMessage = function (msg) {
    this.dialog.showMessage(msg);
    return this.dialog;
};

/* Pause the gameplay. This happens when showing the player a message */
PlayScreen.prototype.pause = function () {
    if (!this.isScenePaused) {
        this.isScenePaused = true;
        if (this.scene) this.scene.pause();
    }
};

/* Resume the gameplay after pausing */
PlayScreen.prototype.resume = function () {
    if (this.isScenePaused) {
        this.isScenePaused = false;
        if (this.scene) this.scene.resume();
    }
};

PlayScreen.prototype.enterCutscene = function () {
    this.isCutscene++;
};

PlayScreen.prototype.leaveCutscene = function () {
    this.isCutscene--;
};

module.exports = PlayScreen;

},{"./dialog":2,"./events":3,"./logic":7,"./scene":11,"./utils":13}],10:[function(require,module,exports){
"use strict";

/* APDUNGEON - A dungeon crawler demo written in javascript + pixi.js
 * Copyright (C) 2017  Peter Rogers (peter.rogers@gmail.com)
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
 * 
 * See LICENSE.txt for the full text of the license.
 */

// The PIXI renderer
var renderer = null;
// The containing element
var container = null;
// The preferred aspect ratio for sizing the render view
var aspectRatio = 1;

module.exports = {};

/* Configures the renderer (via PIXI) and adds the view to the given HTML
 * element. The renderer width/height will conform to the given aspect 
 * ratio. */
module.exports.configure = function (div, aspect) {
    // Set pixel scaling to be "nearest neighbour" which makes textures 
    // render nice and blocky.
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    // Disable the ticker sinc we don't use it (rendering happens as needed)
    PIXI.ticker.shared.autoStart = false;
    PIXI.ticker.shared.stop();

    var rect = div.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        throw Error("Invalid size for renderer: " + rect.width + ", " + rect.height);
    }

    // Maintain the aspect ratio when sizing the render view
    var width = Math.round(rect.height * aspect);
    var height = rect.height;

    if (width > rect.width) {
        width = rect.width;
        height = Math.round(rect.height / aspect);
    }

    //renderer = new PIXI.CanvasRenderer({
    renderer = PIXI.autoDetectRenderer({
        width: width,
        height: height,
        //antialias: true,
        // Required to prevent flickering in Chrome on Android (others too?)
        preserveDrawingBuffer: true
        //clearBeforeRender: true
    });
    renderer.plugins.interaction.destroy();

    //renderer.view.className = "canvas";

    div.innerHTML = "";
    div.appendChild(renderer.view);
    container = div;
    aspectRatio = aspect;
};

module.exports.getContainer = function () {
    return container;
};

module.exports.getRenderer = function () {
    return renderer;
};

/* Resize the renderer to fit the parent container */
module.exports.resize = function () {
    var rect = container.getBoundingClientRect();
    // Maintain the aspect ratio when resizing the render view
    var width = Math.round(rect.height * aspectRatio);
    var height = rect.height;

    if (width > rect.width) {
        width = rect.width;
        height = Math.round(rect.width / aspectRatio);
    }

    renderer.resize(width, height);
    //container.innerHTML = "";
    //container.appendChild(renderer.view);
};

},{}],11:[function(require,module,exports){
"use strict";

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
var Render = require("./render");
var Events = require("./events");
var Utils = require("./utils");

/*********/
/* Scene */
/*********/

function Scene() {
    this.layers = [];
    // The sprite container where everything in the scene is kept
    this.container = new PIXI.Container();
    this.sceneData = null;
    this.cameraX = 0;
    this.cameraY = 0;
    this.name = null;
    // List of things in this scene, stored by name (eg cupboard)
    this.things = {};
    // The same list of things, but stored by sprite name (eg cupboard_open)
    this.thingsBySpriteName = {};
    this.logic = null;
    /*let mgr = new Events.EventManager();
    this.onCamera = mgr.hook("camera");
    this.onUpdate = mgr.hook("update");*/
}

Scene.prototype.destroy = function () {};

/* Returns the width and height of the bottom layer in this scene. This is
 * considered the 'base size' and is used to determine how the scene should
 * be scaled to fit the viewport */
Scene.prototype.getBaseSize = function () {
    return {
        width: this.layers[0].getWidth(),
        height: this.layers[0].getHeight()
    };
};

Scene.prototype.addLayer = function (layer) {
    layer.scene = this;
    this.layers.push(layer);
    this.container.addChild(layer.container);
};

/* Set the camera position within the scene. The position is from -1 (furthest
 * left) to 1 (furthest right) with 0 being the centre of the scene. This 
 * code moves the layers around to simulate parallax scrolling. */
Scene.prototype.setCameraPos = function (xpos, ypos) {
    if (xpos !== this.cameraX || ypos !== this.cameraY) {
        var backWidth = this.getBaseSize().width;
        var centreX = 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.layers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var layer = _step.value;

                var pos = centreX - xpos * (layer.getWidth() / 2 - backWidth / 2);
                layer.container.x = pos;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        this.cameraX = xpos;
        // TODO - handle ypos...
    }
};

/* Returns the scene element under the position (given relative to the top
 * left corner of the unscaled scene viewport) 
 * This returns {layer: name, thing: name} which names the layer that was 
 * clicked, and (optionally) the thing within that layer that was clicked. */
Scene.prototype.checkHit = function (x, y) {
    // Search through the stage layers in reverse order, so we start with
    // the "front most" layer and proceed to the ones behind.
    var xoffset = x - this.getBaseSize().width / 2;
    var yoffset = y - this.getBaseSize().height / 2;
    var reversed = this.layers.slice().reverse();
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = reversed[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var layer = _step2.value;

            var xp = xoffset - layer.container.x;
            var yp = yoffset;

            // First check if they clicked on a thing in the layer
            var sprite = layer.checkHitSprite(xp, yp);
            if (sprite) {
                var thing = this.thingsBySpriteName[sprite.name];
                if (!thing.invisibleToClicks) {
                    return {
                        layer: layer,
                        sprite: sprite,
                        thing: thing
                    };
                }
            }

            // Now check if they clicked on this layer itself
            if (layer.checkHit(xp, yp)) {
                return { layer: layer, sprite: null, thing: null };
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return { layer: null, sprite: null, thing: null };
};

Scene.prototype.getThing = function (name) {
    return this.things[name];
};

Scene.prototype.getLayer = function (name) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = this.layers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var layer = _step3.value;

            if (layer.name === name) return layer;
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return null;
};

Scene.prototype.pause = function () {
    this.logic.pause();
};

Scene.prototype.resume = function () {
    this.logic.resume();
};

Scene.prototype.initScene = function (screen, logic) {
    this.screen = screen;
    this.logic = logic;
    this.logic.initScene(screen, this);
};

Scene.prototype.handleClicked = function (x, y) {
    var args = this.checkHit(x, y);
    if (args.thing) {
        this.logic.handleClicked(args.thing);
        return true;
    }
    return false;
};

/* Builds a new scene given the SceneData instance. This function builds
 * the layers and adds the sprites. */
Scene.fromData = function (sceneData) {
    var scn = new Scene();
    scn.name = sceneData.name;
    scn.sceneData = sceneData;

    var renderer = Render.getRenderer();

    // Build the layers and contained sprites
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = sceneData.layers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var layerData = _step4.value;

            var texture = scn.sceneData.getTexture(layerData.name);
            var mask = Utils.getTransparencyMask(renderer, texture);
            var layer = new Layer(layerData.name, texture, mask);
            scn.addLayer(layer);
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = layerData["sprites"][Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var spriteData = _step5.value;

                    var texture = scn.sceneData.getTexture(spriteData["name"]);
                    var sprite = new PIXI.Sprite(texture);
                    sprite.name = spriteData["name"];
                    sprite.anchor.set(0, 0);
                    sprite.x = spriteData["x"] - layer.getWidth() / 2;
                    sprite.y = spriteData["y"] - layer.getHeight() / 2;

                    var mask = Utils.getTransparencyMask(renderer, sprite.texture);
                    layer.addSprite(sprite, mask);

                    // If the sprite name is of the form "something_blah" then actually
                    // it belongs to a thing named "something" and visually represents 
                    // the state "blah". (eg bird_flying) Otherwise the entire sprite
                    // name is assumed to be the thing name, in the default state.
                    var n = sprite.name.indexOf("_");
                    var thingName = sprite.name;
                    var stateName = "default";
                    if (n !== -1) {
                        // Parse out the thing and state names
                        thingName = sprite.name.substr(0, n);
                        stateName = sprite.name.substr(n + 1);
                    }
                    var thing = null;
                    if (scn.things.hasOwnProperty(thingName)) {
                        thing = scn.things[thingName];
                    } else {
                        thing = scn.things[thingName] = new Thing(thingName);
                    }
                    thing.sprites[stateName] = sprite;
                    scn.thingsBySpriteName[sprite.name] = thing;
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    scn.setCameraPos(sceneData.cameraX, sceneData.cameraY);
    return scn;
};

/*************/
/* SceneData */
/*************/

function SceneData(scenePath) {
    // Descriptive scene name
    this.name = null;
    // Relative path to the scene directory (ends with '/')
    this.scenePath = scenePath;
    this.spritesFile = "sprites.json";
    this.spritesPath = scenePath + this.spritesFile;
    // The scene name should be unique game-wide
    this.name = null;
    // The descriptive scene name
    this.title = null;
    // The layers that makeup the scene (Layer instances)
    this.layers = [];
    // The default camera position for the scene (-1 to 1)
    this.cameraX = 0;
    this.cameraY = 0;
}

SceneData.fromJSON = function (src, raw) {
    // Determine the scene directory
    var i = src.lastIndexOf("/");
    var scn = new SceneData(src.substring(0, i + 1));
    var data = JSON.parse(raw);
    scn.name = data["name"];
    scn.title = data["title"];
    scn.description = data["description"];

    var pos = data["camera"];
    if (pos !== undefined) {
        pos = pos.split(",");
        if (pos.length === 1) {
            scn.cameraX = parseInt(pos[0]);
        } else if (pos.length === 2) {
            scn.cameraX = parseInt(pos[0]);
            scn.cameraY = parseInt(pos[1]);
        }
    }
    scn.layers = data["layers"];
    scn.rawJSON = raw;
    return scn;
};

/* Returns a PIXI texture given it's name (assuemd to belong to this scene */
SceneData.prototype.getTexture = function (name) {
    var res = PIXI.loader.resources[this.spritesPath];
    if (!res) {
        throw Error("No such sprite resource: " + this.spritesPath);
    }
    var texture = res.textures[name];
    if (!texture) {
        throw Error("No such texture: " + name);
    }
    return texture;
};

/*********/
/* Layer */
/*********/

/* A layer is a "slice" of a level consisting of an image along with a 
 * collection of things. */
function Layer(name, texture, mask) {
    this.scene = null;
    // The layer name (unique to the scene)
    this.name = name;
    // The transparency mask for the image. Useful for determining whether
    // the user clicks on a piece of this layer.
    this.mask = mask;
    // The container holding the background image, and all thing sprites 
    // on this layer.
    this.container = new PIXI.Container();
    this.background = new PIXI.Sprite(texture);
    this.background.anchor.set(0.5, 0.5);
    this.container.addChild(this.background);
    // The list of sprites rendered in this scene (stored by name)
    //this.sprites = {};
    // The transparency masks for the rendered sprites (by name)
    this.masks = {};
}

Layer.prototype.getWidth = function () {
    return this.background.texture.width;
};

Layer.prototype.getHeight = function () {
    return this.background.texture.height;
};

/* Check if the given point refers to an opaque pixel of this layer */
Layer.prototype.checkHit = function (x, y) {
    var xp = x + this.getWidth() / 2 | 0;
    var yp = y + this.getHeight() / 2 | 0;
    if (xp >= 0 && yp >= 0 && xp < this.mask.length && yp < this.mask[0].length) {
        return this.mask[xp][yp] === 255;
    }
    return false;
};

/* Similar to checkHit, but checks if the given point connects with a sprite
 * instance in this layer. If so, this returns the sprite. */
Layer.prototype.checkHitSprite = function (x, y) {
    var reversed = this.container.children.slice().reverse();
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = reversed[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var sprite = _step6.value;

            if (sprite.name && sprite.visible && x >= sprite.x && y >= sprite.y && x < sprite.x + sprite.width && y < sprite.y + sprite.height) {
                var xp = x - sprite.x | 0;
                var yp = y - sprite.y | 0;
                if (this.masks && this.masks[sprite.name][xp][yp] > 0) return sprite;
            }
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    return null;
};

Layer.prototype.addSprite = function (sprite, mask) {
    // TODO - check for duplicates
    //this.sprites[sprite.name] = sprite;
    this.masks[sprite.name] = mask;
    this.container.addChild(sprite);
};

Layer.prototype.setVisible = function (b) {
    this.container.visible = !!b;
};

/*********/
/* Thing */
/*********/

/* A thing is a collection of sprites, each sprite representing a different
 * visual state. For example, a bird would be represented by certain sprites
 * such as the bird in flight, the bird sitting on a branch, etc. */
function Thing(name) {
    // Sprites associated with this thing, stored by "state" name
    this.sprites = {};
    this.name = name;
    this.state = "default";
    this.invisibleToClicks = false;

    var mgr = new Events.EventManager();
    this.onVisible = mgr.hook("visible");
    this.dispatch = mgr.dispatcher();
}

Thing.prototype.getSprite = function (state) {
    if (state === undefined) state = this.state;
    return this.sprites[state];
};

/* Sets the current "state" of this thing. It sets as visible the sprite 
 * called thingName + "_" + state, and sets all others as invisible. */
Thing.prototype.setState = function (state) {
    if (!this.sprites[state]) {
        throw Error("invalid thing state for " + this.name + ": " + state);
    }
    for (var spriteName in this.sprites) {
        this.sprites[spriteName].visible = false;
    }
    this.sprites[state].visible = true;
    this.state = state;
    return this.getSprite();
};

Thing.prototype.isVisible = function () {
    for (var name in this.sprites) {
        if (this.sprites[name].visible) return true;
    }
    return false;
};

Thing.prototype.setVisible = function (b) {
    for (var spriteName in this.sprites) {
        this.sprites[spriteName].visible = false;
    }
    if (b === undefined) b = true;
    if (b) {
        if (!this.sprites["default"]) {
            throw Error("thing has no default state");
        }
        this.sprites["default"].visible = true;
    }
    return this.getSprite();
};

module.exports = {
    Scene: Scene,
    SceneData: SceneData,
    Thing: Thing
};

},{"./events":3,"./logic":7,"./render":10,"./utils":13}],12:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Utils = require("./utils");

/*********/
/* Fader */
/*********/

function Fader(width, height, args) {
				var dir = args.dir !== undefined ? args.dir : 1;
				var colour = args.colour !== undefined ? args.colour : "black";
				var txt = Utils.makeSolidColourTexture(colour, width, height);
				this.sprite = new PIXI.Sprite(txt);
				this.sprite.alpha = 1 - dir;
				this.duration = args.duration !== undefined ? args.duration : 1;
				this.dir = dir;
}

Fader.prototype.start = function (stage) {
				stage.addChild(this.sprite);
};

Fader.prototype.update = function (dt) {
				this.sprite.alpha += this.dir * dt / this.duration;
				if (this.dir > 0 && this.sprite.alpha >= 1) {
								this.sprite.alpha = 1;
								this.sprite.parent.removeChild(this.sprite);
								return false;
				} else if (this.dir < 0 && this.sprite.alpha <= 0) {
								this.sprite.alpha = 0;
								this.sprite.parent.removeChild(this.sprite);
								return false;
				}
				return true;
};

/******************/
/* FadeTransition */
/******************/

var FadeTransition = function () {
				function FadeTransition(startScene, endSceneName, args) {
								_classCallCheck(this, FadeTransition);

								this.startSCene = startScene;
								this.endSceneName = endSceneName;
								this.screen = startScene.screen;
								this.args = args || {};
				}

				_createClass(FadeTransition, [{
								key: "start",
								value: function start() {
												var _this = this;

												// Fade out, switch scenes, then fade back in
												var fadeout = new Fader(this.screen.viewWidth, this.screen.viewHeight, {
																dir: 1,
																duration: this.args.duration || 1,
																colour: this.args.colour
												});
												var fadein = new Fader(this.screen.viewWidth, this.screen.viewHeight, {
																dir: -1,
																duration: this.args.duration || 1,
																colour: this.args.colour
												});
												var pauseTime = this.args.pauseTime !== undefined ? this.args.pauseTime : 0;
												//this.screen.stage.removeChild(fadeout.sprite);
												this.screen.pause();
												this.screen.enterCutscene();
												fadeout.start(this.screen.stage);
												this.screen.addUpdate(function (dt) {
																if (!fadeout.update(dt)) {
																				_this.screen.setScene(_this.endSceneName, _this.args);
																				fadein.start(_this.screen.stage);
																				return false;
																}
																return true;
												}, Utils.delayUpdate(pauseTime), function (dt) {
																if (!fadein.update(dt)) {
																				_this.screen.resume();
																				_this.screen.leaveCutscene();
																				return false;
																}
																return true;
												});
								}
				}]);

				return FadeTransition;
}();

/********************/
/* FadeInTransition */
/********************/

var FadeInTransition = function () {
				function FadeInTransition(screen, sceneName, args) {
								_classCallCheck(this, FadeInTransition);

								this.screen = screen;
								this.sceneName = sceneName;
								this.args = args || {};
				}

				_createClass(FadeInTransition, [{
								key: "start",
								value: function start() {
												var _this2 = this;

												this.screen.setScene(this.sceneName, this.args);
												this.screen.pause();
												var fader = new Fader(this.screen.viewWidth, this.screen.viewHeight, {
																dir: -1,
																duration: this.args.duration || 2,
																colour: this.args.colour
												});
												fader.start(this.screen.stage);
												this.screen.addUpdate(function (dt) {
																if (!fader.update(dt)) {
																				_this2.screen.resume();
																				return false;
																}
																return true;
												});
								}
				}]);

				return FadeInTransition;
}();

/*********************/
/* FadeOutTransition */
/*********************/

var FadeOutTransition = function () {
				function FadeOutTransition(screen, args) {
								_classCallCheck(this, FadeOutTransition);

								this.screen = screen;
								this.args = args || {};
				}

				_createClass(FadeOutTransition, [{
								key: "start",
								value: function start(onComplete) {
												var fader = new Fader(this.screen.viewWidth, this.screen.viewHeight, {
																dir: 1,
																duration: this.args.duration || 1,
																colour: this.args.colour
												});
												fader.start(this.screen.stage);
												this.screen.addUpdate(function (dt) {
																if (!fader.update(dt)) {
																				if (onComplete) onComplete();
																				return false;
																}
																return true;
												});
								}
				}]);

				return FadeOutTransition;
}();

module.exports = {
				FadeToScene: FadeTransition,
				FadeIn: FadeInTransition,
				FadeOut: FadeOutTransition,
				Fader: Fader
};

},{"./utils":13}],13:[function(require,module,exports){
"use strict";

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
function getTransparencyMask(renderer, texture) {
    var sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0, 0);
    // This returns a flat array packed with pixel values (RGBARGBA...)
    var pixels = renderer.extract.pixels(sprite);
    var mask = [];
    for (var x = 0; x < sprite.width; x++) {
        mask.push([]);
        for (var y = 0; y < sprite.height; y++) {
            var value = pixels[4 * (x + y * sprite.width) + 3];
            mask[mask.length - 1].push(value);
        }
    }
    return mask;
}

function makeSolidColourTexture(colour, width, height) {
    // Use an HTML canvas to render a solid area of colour
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return PIXI.Texture.fromCanvas(canvas);
}

function delayUpdate(delay) {
    return function (dt) {
        delay -= dt;
        if (delay <= 0) return false;
        return undefined;
    };
}

/**********/
/* Screen */
/**********/

function Screen() {
    this.renderer = null;
    this.width = width;
    this.height = height;

    var mgr = new EventManager();
    this.dispatch = mgr.dispatcher();
    this.onResize = mgr.hook("resize");
}

Screen.prototype.configure = function (renderer) {
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
};

module.exports = {
    makeSolidColourTexture: makeSolidColourTexture,
    getTransparencyMask: getTransparencyMask,
    delayUpdate: delayUpdate
};

},{}]},{},[8])(8)
});