(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.demoquest = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    this.onClosed = mgr.hook("closed");
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

    this.delay = 0.15;
    this.stage.addChild(this.container);
    // Have the dialog box slide into view from below
    this.dispatch("update", function (dt) {
        if (_this.delay > 0) {
            _this.delay -= dt;
            return true;
        }
        _this.container.y -= _this.viewHeight * dt;
        if (_this.container.y < _this.desty) {
            _this.container.y = _this.desty;
            _this.state = "shown";
            return false;
        }
        return true;
    });
};

Dialog.prototype.hide = function (delay) {
    var _this2 = this;

    if (this.state !== "shown") return;
    this.state = "hiding";

    // Have the dialog box slide off screen
    this.dispatch("update", function (dt) {
        _this2.container.y += 1.2 * _this2.viewHeight * dt;
        if (_this2.container.y > _this2.viewHeight) {
            _this2.container.parent.removeChild(_this2.container);
            _this2.state = "idle";
            if (_this2.messages.length > 0) {
                // Show the next message
                _this2.showMessage(_this2.messages.shift());
            } else {
                _this2.dispatch("closed");
            }
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

},{"./events":2,"./utils":11}],2:[function(require,module,exports){
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

/* Add an event callback under the given name */
EventManager.prototype.addEventListener = function (event, callback) {
    if (!this.callbacks[event]) {
        this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
};

EventManager.prototype.dispatcher = function (event) {
    var _this = this;

    if (event) {
        return function () {
            _this.dispatch(event);
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
    var _this2 = this;

    return function (callback) {
        return _this2.addEventListener(event, callback);
    };
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
    var _this3 = this;

    if (this.paused) {
        this.startTime = new Date().getTime();
        this.paused = false;
        this.timeoutEvent = setTimeout(function () {
            _this3.timeoutEvent = null;
            if (_this3.callback()) {
                _this3.timeLeft = _this3.delay;
                _this3.paused = true;
                _this3.resume();
            }
        }, this.timeLeft);
    }
};

module.exports = {
    EventManager: EventManager,
    Timer: Timer
};

},{}],3:[function(require,module,exports){
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
   this.logic = new Logic.Logic();
   this.state = new Logic.State();
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
   requestAnimationFrame(this.staticRenderFrame);
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
   Render.getRenderer().render(this.screen.stage);

   if (redraw) this.redraw();else this.lastRenderTime = null;
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
   this.screen = new PlayScreen(this.logic, this.dataList, Render.getRenderer().width, Render.getRenderer().height);

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
   this.screen.changeScene("intro");
};

module.exports = GameState;

},{"./input":4,"./loader":5,"./logic":6,"./playscreen":8,"./render":9}],4:[function(require,module,exports){
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

},{"./events":2}],5:[function(require,module,exports){
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
        _this4.dispatch("done");
    });
};

module.exports = {
    LoadingScreen: LoadingScreen
};

},{"./events":2,"./scene":10}],6:[function(require,module,exports){
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

/*********/
/* State */
/*********/

var State = function State() {
				_classCallCheck(this, State);

				this.hasRedKey = false;
				this.bush1Moved = false;
				this.bush2Moved = false;
};

/*********/
/* Logic */
/*********/

var Logic = function () {
				function Logic() {
								_classCallCheck(this, Logic);

								// Scene specific logic stored by name
								this.state = new State();
								this.sceneLogic = {
												"intro": new IntroLogic(),
												"road": new RoadLogic(),
												"closet": new ClosetLogic(),
												"cave": new CaveLogic()
								};
				}

				_createClass(Logic, [{
								key: "makeContext",
								value: function makeContext(args) {
												return new LogicContext(this.state, args);
								}
				}, {
								key: "initScene",
								value: function initScene(ctx) {
												var logic = this.sceneLogic[ctx.scene.name];
												if (logic && logic.initScene) logic.initScene(ctx);
								}
				}, {
								key: "leaveScene",
								value: function leaveScene(ctx) {
												var logic = this.sceneLogic[ctx.scene.name];
												if (logic && logic.leaveScene) logic.leaveScene(ctx);
								}
				}, {
								key: "handleClicked",
								value: function handleClicked(ctx) {
												var logic = this.sceneLogic[ctx.scene.name];
												if (logic && logic.handleClicked) logic.handleClicked(ctx);
								}
				}, {
								key: "handleDragStart",
								value: function handleDragStart(ctx) {}
				}, {
								key: "handleDrag",
								value: function handleDrag(ctx) {}
				}, {
								key: "handleDragStop",
								value: function handleDragStop(ctx) {}
				}]);

				return Logic;
}();

/****************/
/* LogicContext */
/****************/

function LogicContext(state, args) {
				this.state = state;
				this.screen = null;
				this.scene = null;
				this.thing = null;
				this.sprite = null;
				if (args) {
								this.screen = args.screen;
								this.scene = args.scene;
								this.thing = args.thing;
								this.sprite = args.sprite;
				}
}

LogicContext.prototype.getThing = function (name) {
				var thing = this.scene.getThing(name);
				if (!thing) {
								console.log("ERROR: can't find thing: " + name);
				}
				return thing;
};

LogicContext.prototype.showMessage = function (msg, options) {
				this.screen.showMessage(msg, options);
};

LogicContext.prototype.startTimer = function (callback, delay) {
				return this.screen.startTimer(callback, delay);
};

LogicContext.prototype.addUpdate = function (callback) {
				return this.screen.addUpdate(callback);
};

/***************/
/* Scene Logic */
/***************/

/* Logic classes for the various scenes in the game */

var IntroLogic = function () {
				function IntroLogic() {
								_classCallCheck(this, IntroLogic);
				}

				_createClass(IntroLogic, [{
								key: "initScene",
								value: function initScene(ctx) {
												ctx.getThing("door").setState("closed");
												ctx.getThing("cupboard").setState("closed");

												ctx.startTimer(function (ctx) {
																//ctx.getThing("door").setState("open");
																//ctx.showMessage("The door opens!");
																console.log("Tick");
												}, 3000);

												return;

												var sprite = ctx.getThing("darkness").setVisible(false);
												sprite.alpha = 0;

												var timer = ctx.startTimer(1000, function (ctx) {
																sprite.alpha = Math.max(sprite.alpha + 0.05, 1);
																if (sprite.alpha >= 1) {}
												});

												timer.cancel();
												timer.pause();
												timer.resume();
								}
				}, {
								key: "leaveScene",
								value: function leaveScene(ctx) {}
				}, {
								key: "handleClicked",
								value: function handleClicked(ctx) {
												switch (ctx.thing.name) {
																case "candle":
																				console.log("CANDLE");
																				ctx.showMessage("A candle for evening work. I won't need it.");
																				ctx.showMessage("Or maybe I will!");
																				break;

																case "cupboard":
																				if (ctx.thing.state === "open") ctx.thing.setState("closed");else ctx.thing.setState("open");
																				break;

																case "door":
																				if (ctx.thing.state === "open") {
																								ctx.thing.setState("closed");
																				} else {
																								ctx.thing.setState("open");
																				}
																				break;

																case "outside":
																				ctx.screen.changeScene("road");
																				break;
												}
								}
				}]);

				return IntroLogic;
}();

var RoadLogic = function () {
				function RoadLogic() {
								_classCallCheck(this, RoadLogic);
				}

				_createClass(RoadLogic, [{
								key: "initScene",
								value: function initScene(ctx) {
												ctx.getThing("bush1").setVisible(!ctx.state.bush1Moved);
												ctx.getThing("bush2").setVisible(!ctx.state.bush2Moved);
								}
				}, {
								key: "handleClicked",
								value: function handleClicked(ctx) {
												switch (ctx.thing.name) {
																case "bush1":
																				ctx.state.bush1Moved = true;
																				ctx.thing.setVisible(false);
																				if (ctx.state.bush2Moved) {
																								ctx.showMessage("You clear away some brush revealing a cave!");
																				} else {
																								ctx.showMessage("You clear away some brush. You see something behind it!");
																				}
																				break;

																case "bush2":
																				ctx.state.bush2Moved = true;
																				ctx.thing.setVisible(false);
																				if (ctx.state.bush1Moved) {
																								ctx.showMessage("You clear away some brush revealing a cave!");
																				} else {
																								ctx.showMessage("You clear away some brush. You see something behind it!");
																				}
																				break;

																case "cave":
																				if (!ctx.state.bush1Moved || !ctx.state.bush2Moved) {
																								ctx.showMessage("I must clear the way first.");
																				} else {
																								ctx.screen.changeScene("cave");
																				}
																				break;
												}
								}
				}]);

				return RoadLogic;
}();

var ClosetLogic = function () {
				function ClosetLogic() {
								_classCallCheck(this, ClosetLogic);
				}

				_createClass(ClosetLogic, [{
								key: "initScene",
								value: function initScene(ctx) {
												var _this = this;

												this.timer = 0;
												this.state = "start";

												ctx.getThing("trigger").onVisible(function (ctx) {
																console.log("VISIBLE!");
												});

												ctx.addUpdate(function (dt) {
																if (_this.timer > 0) {
																				_this.timer -= dt;
																				return true;
																}
																switch (_this.state) {
																				case "start":
																								// Wait for the scene to fade in a bit
																								_this.state = "opening";
																								_this.timer = 1.5;
																								//this.offset = 0;
																								break;
																				case "opening":
																								// Opening the crack
																								var sprite = ctx.getThing("crack").getSprite();
																								var stop = ctx.getThing("darkright").getSprite();
																								var thing = ctx.getThing("crack");
																								//this.offset += dt;
																								//sprite.x += 10*dt*(Math.sin(this.offset/2)**2);
																								sprite.x += 10 * dt;
																								if (sprite.x > stop.x) {
																												sprite.visible = false;
																												_this.state = "brighter";
																												_this.timer = 2;
																								}
																								break;
																				case "brighter":
																								var sprite1 = ctx.getThing("darkright").getSprite();
																								var sprite2 = ctx.getThing("darkleft").getSprite();
																								sprite1.alpha -= 0.2 * dt;
																								sprite2.alpha -= 0.2 * dt;
																								if (sprite1.alpha < 0) {
																												sprite1.visible = false;
																												sprite2.visible = false;
																												return false;
																								}
																								break;
																}
																return true;
												});
								}
				}, {
								key: "handleClicked",
								value: function handleClicked(ctx) {
												switch (ctx.thing.name) {}
								}
				}]);

				return ClosetLogic;
}();

var CaveLogic = function () {
				function CaveLogic() {
								_classCallCheck(this, CaveLogic);
				}

				_createClass(CaveLogic, [{
								key: "initScene",
								value: function initScene(ctx) {
												//ctx.getThing("key").setVisible(
								}
				}, {
								key: "handleClicked",
								value: function handleClicked(ctx) {
												switch (ctx.thing.name) {
																case "ladder":
																				ctx.screen.changeScene("road", { cameraX: 1 });
																				break;

																case "key":
																				break;
												}
								}
				}]);

				return CaveLogic;
}();

module.exports = {
				Logic: Logic,
				LogicContext: LogicContext,
				State: State
};

},{}],7:[function(require,module,exports){
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

},{"./gamestate":3}],8:[function(require,module,exports){
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

function PlayScreen(logic, dataList, width, height) {
   var _this = this;

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
   // The size of the viewing area
   this.viewWidth = width;
   this.viewHeight = height;
   this.cutScene = false;
   // The thing being dragged around, or null if no dragging is happening
   // or the player is panning around instead.
   this.dragging = null;
   // The mouse cursor position when the player started dragging around
   this.dragStartX = 0;
   this.dragStartY = 0;
   // List of currently active timers in the game (Timer instances)
   this.timers = [];
   // List of animation callback functions
   this.updateCallbacks = [];
   // Setup some events for communicating with the main game state
   var mgr = new Events.EventManager();
   this.onComplete = mgr.hook("complete");
   this.onGameOver = mgr.hook("gameover");
   this.onRedraw = mgr.hook("redraw");
   this.onVisible = mgr.hook("thing-visible");
   this.dispatch = mgr.dispatcher();
   this.redraw = mgr.dispatcher("redraw");

   this.dialogDefaults = {
      fill: "black",
      background: "white",
      lightbox: "black"
   };

   // Setup the dialog/message area and attach some event handlers
   this.dialog = new Dialog(this.viewWidth, this.viewHeight, this.stage, this.dialogDefaults);

   this.dialog.onUpdate(function (cb) {
      _this.addUpdate(cb);
   });

   this.dialog.onRedraw(function (cb) {
      _this.redraw();
   });

   this.dialog.onClosed(function (cb) {
      _this.redraw();
      _this.resume();
   });
}

/* Called for every frame that is rendered by the game state. (called before
 * rendering to screen) Returns true to request another frame be rendered 
 * after this one, or false otherwise. */
PlayScreen.prototype.update = function (dt) {
   var lst = [];
   var _iteratorNormalCompletion = true;
   var _didIteratorError = false;
   var _iteratorError = undefined;

   try {
      for (var _iterator = this.updateCallbacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
         var callback = _step.value;

         if (callback(dt)) lst.push(callback);
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
   return this.updateCallbacks.length > 0;
};

PlayScreen.prototype.addUpdate = function (callback) {
   this.updateCallbacks.push(callback);
   if (this.updateCallbacks.length === 1) this.redraw();
};

PlayScreen.prototype.changeScene = function (name, args) {
   var _this2 = this;

   if (!this.dataList.hasOwnProperty(name)) {
      throw Error("No such scene: " + name);
   }

   // Default camera position for a new scene
   var cameraX = -1;
   var cameraY = 0;

   if (args) {
      if (args.cameraX !== undefined) cameraX = args.cameraX;
      if (args.cameraY !== undefined) cameraY = args.cameraY;
   }

   if (this.scene === null) {
      // Slow fade into the starting scene
      this.setScene(name);
      this.pause();
      this.setCameraPos(cameraX, cameraY);
      var fader = new Utils.Fader(this.viewWidth, this.viewHeight, -1, 2);
      fader.start(this.stage);
      this.addUpdate(function (dt) {
         if (!fader.update(dt)) {
            _this2.resume();
            return false;
         }
         return true;
      });
   } else {
      // Fade out, switch scenes, then fade back in
      var fadeout = new Utils.Fader(this.viewWidth, this.viewHeight, 1, 1);
      var fadein = new Utils.Fader(this.viewWidth, this.viewHeight, -1, 1);
      this.stage.removeChild(fadeout.sprite);
      this.pause();
      fadeout.start(this.stage);
      this.addUpdate(function (dt) {
         if (!fadeout.update(dt)) {
            _this2.setScene(name);
            _this2.setCameraPos(cameraX, cameraY);
            fadein.start(_this2.stage);
            _this2.addUpdate(function (dt) {
               if (!fadein.update(dt)) {
                  _this2.resume();
                  return false;
               }
               return true;
            });
            return false;
         }
         return true;
      });
   }
};

PlayScreen.prototype.setScene = function (name) {
   if (!this.dataList[name]) {
      throw Error("No such scene: " + name);
   }
   if (this.scene) {
      var _ctx = this.logic.makeContext({
         screen: this,
         scene: this.scene
      });
      this.logic.leaveScene(_ctx);
   }

   var scene = Scene.Scene.fromData(this.dataList[name]);
   this.scene = scene;
   this.sceneStage.children = [];
   this.sceneStage.addChild(scene.container);
   this.sceneStage.scale.set(this.getDisplayScale());
   this.sceneStage.x = this.viewWidth / 2;
   this.sceneStage.y = this.viewHeight / 2;

   var ctx = this.logic.makeContext({
      screen: this,
      scene: this.scene
   });
   this.logic.initScene(ctx);
};

PlayScreen.prototype.setCameraPos = function (xpos, ypos) {
   this.scene.setCameraPos(xpos, ypos);
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
   }
};

PlayScreen.prototype.handleClick = function (evt) {
   // A direct click will dismiss the dialog box
   if (this.dialog.isShown()) {
      this.dialog.hide();
      return;
   }

   if (!this.scene) return;
   if (this.cutScene) return;

   var xp = evt.x / this.getDisplayScale();
   var yp = evt.y / this.getDisplayScale();
   var args = this.scene.checkHit(xp, yp);
   if (args.thing) {
      var ctx = this.logic.makeContext({
         screen: this,
         scene: this.scene,
         thing: args.thing,
         sprite: args.sprite
      });
      this.logic.handleClicked(ctx);
      this.redraw();
   }
};

PlayScreen.prototype.handleDragStart = function (evt) {
   var _this3 = this;

   if (this.dialog.isShown()) {
      setTimeout(function () {
         _this3.dialog.hide();
      }, 1000);
   }
   if (!this.scene) return;
   if (this.cutScene) return;

   var xp = evt.x / this.getDisplayScale();
   var yp = evt.y / this.getDisplayScale();
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
};

PlayScreen.prototype.handleDragStop = function (evt) {
   // If the player clicked and panned the scene around only a short distance,
   // count this as a click event.
   var dist = 5;
   if (!this.dragging && Math.abs(evt.x - evt.dragStartX) < dist && Math.abs(evt.y - evt.dragStartY) < dist) {
      this.handleClick(evt);
   }
   this.dragging = null;
};

PlayScreen.prototype.handleDrag = function (evt) {
   if (!this.scene) return;
   if (this.cutScene) return;

   if (this.dragging) {
      // Dragging a thing
      this.dragging.x = this.dragStartX + evt.dx / this.getDisplayScale();
      this.dragging.y = this.dragStartY + evt.dy / this.getDisplayScale();
      this.redraw();
   } else {
      // Panning the scene around
      var pos = this.dragStartX - evt.dx / (window.innerWidth / 2);
      pos = Math.max(Math.min(pos, 1), -1);
      this.scene.setCameraPos(pos);
      this.redraw();
      // Now figure out what's in view and send visibility events
      // ...
   }
};

PlayScreen.prototype.showMessage = function (msg) {
   // Pause game play and show the message (will be resumed when the 
   // dialog box is closed)
   this.pause();
   this.dialog.showMessage(msg);
};

/* Starts an in-game timer for the given callback. This timer can be paused
 * and resumed. (eg when transitionin between scenes and when showing dialog
 * boxes) */
PlayScreen.prototype.startTimer = function (callback, delay) {
   var _this4 = this;

   var tm = new Events.Timer(function () {
      var ctx = _this4.logic.makeContext({
         screen: _this4,
         scene: _this4.scene
      });
      var ret = callback(ctx);
      if (!ret) {
         // No more callbacks - remove the timer from the list
         _this4.cancelTimer(tm);
      }
      _this4.redraw();
      return ret;
   }, delay);
   this.timers.push(tm);
   return tm;
};

PlayScreen.prototype.cancelTimer = function (tm) {
   var n = this.timers.indexOf(tm);
   tm.pause();
   if (n !== -1) {
      this.timers = this.timers.slice(0, n).concat(this.timers.slice(n + 1));
   }
};

/* Pause the gameplay. This happens when showing the player a message */
PlayScreen.prototype.pause = function () {
   // Pause all timers
   var _iteratorNormalCompletion2 = true;
   var _didIteratorError2 = false;
   var _iteratorError2 = undefined;

   try {
      for (var _iterator2 = this.timers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
         var tm = _step2.value;

         tm.pause();
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
};

/* Resume the gameplay after pausing */
PlayScreen.prototype.resume = function () {
   var _iteratorNormalCompletion3 = true;
   var _didIteratorError3 = false;
   var _iteratorError3 = undefined;

   try {
      for (var _iterator3 = this.timers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
         var tm = _step3.value;

         tm.resume();
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

module.exports = PlayScreen;

},{"./dialog":1,"./events":2,"./logic":6,"./scene":10,"./utils":11}],9:[function(require,module,exports){
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

    renderer = new PIXI.CanvasRenderer({
        //renderer = PIXI.autoDetectRenderer({
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

},{}],10:[function(require,module,exports){
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
    this.name = null;
    // List of things in this scene, stored by name (eg cupboard)
    this.things = {};
    // The same list of things, but stored by sprite name (eg cupboard_open)
    this.thingsBySpriteName = {};
}

/* Builds a new scene given the SceneData instance. This function builds
 * the layers and adds the sprites. */
Scene.fromData = function (sceneData) {
    var scn = new Scene();
    scn.name = sceneData.name;
    scn.sceneData = sceneData;

    var renderer = Render.getRenderer();

    // Build the layers and contained sprites
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = sceneData.layers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var layerData = _step.value;

            var texture = scn.sceneData.getTexture(layerData.name);
            var mask = Utils.getTransparencyMask(renderer, texture);
            var layer = new Layer(layerData.name, texture, mask);
            scn.addLayer(layer);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = layerData["sprites"][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var spriteData = _step2.value;

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

    scn.setCameraPos(sceneData.cameraX, sceneData.cameraY);
    return scn;
};

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
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = this.layers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var layer = _step3.value;

                var pos = centreX - xpos * (layer.getWidth() / 2 - backWidth / 2);
                layer.container.x = pos;
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

        this.cameraX = xpos;
        // TODO - handle ypos...
        this.updateVisible();
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
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = reversed[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var layer = _step4.value;

            var xp = xoffset - layer.container.x;
            var yp = yoffset;

            // First check if they clicked on a thing in the layer
            var sprite = layer.checkHitSprite(xp, yp);
            if (sprite) {
                var thing = this.thingsBySpriteName[sprite.name];
                return {
                    layer: layer,
                    sprite: sprite,
                    thing: thing
                };
            }

            // Now check if they clicked on this layer itself
            if (layer.checkHit(xp, yp)) {
                return { layer: layer, sprite: null, thing: null };
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

    return { layer: null, sprite: null, thing: null };
};

Scene.prototype.getThing = function (name) {
    return this.things[name];
};

/* Emits a 'visible' message for each thing currently visible on the screen */
Scene.prototype.updateVisible = function () {};

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
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = reversed[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var sprite = _step5.value;

            if (sprite.name && sprite.visible && x >= sprite.x && y >= sprite.y && x < sprite.x + sprite.width && y < sprite.y + sprite.height) {
                var xp = x - sprite.x | 0;
                var yp = y - sprite.y | 0;
                if (this.masks && this.masks[sprite.name][xp][yp] > 0) return sprite;
            }
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

    return null;
};

Layer.prototype.addSprite = function (sprite, mask) {
    // TODO - check for duplicates
    //this.sprites[sprite.name] = sprite;
    this.masks[sprite.name] = mask;
    this.container.addChild(sprite);
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
        throw Error("invalid thing state: " + state);
    }
    for (var spriteName in this.sprites) {
        this.sprites[spriteName].visible = false;
    }
    this.sprites[state].visible = true;
    this.state = state;
    return this.getSprite();
};

Thing.prototype.setVisible = function (b) {
    if (!this.sprites["default"]) {
        throw Error("thing has no default state");
    }
    for (var spriteName in this.sprites) {
        this.sprites[spriteName].visible = false;
    }
    if (b === undefined) b = true;
    this.sprites["default"].visible = b;
    return this.getSprite();
};

module.exports = {
    Scene: Scene,
    SceneData: SceneData,
    Thing: Thing
};

},{"./events":2,"./render":9,"./utils":11}],11:[function(require,module,exports){
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

/*********/
/* Fader */
/*********/

function Fader(width, height, dir, duration) {
    var txt = makeSolidColourTexture("black", width, height);
    this.sprite = new PIXI.Sprite(txt);
    this.sprite.alpha = dir === 1 ? 0 : 1;
    this.duration = duration;
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

module.exports = {
    makeSolidColourTexture: makeSolidColourTexture,
    getTransparencyMask: getTransparencyMask,
    Fader: Fader
};

},{}]},{},[7])(7)
});