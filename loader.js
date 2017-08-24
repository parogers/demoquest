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

/**********/
/* Loader */
/**********/

function Loader()
{
    // The list of resource paths (eg path to image) to load
    this.queue = [];
    // The list of loaded resources (eg the images themselves)
    this.loaded = [];
    this._onload = null;
    this._onerror = null;
    this._ondone = null;
}

Loader.prototype.onload = function(handler)
{
    this._onload = handler;
    return this;
}

Loader.prototype.onerror = function(handler)
{
    this._onerror = handler;
    return this;
}

Loader.prototype.ondone = function(handler)
{
    this._ondone = handler;
    return this;
}

Loader.prototype.handleError = function(src)
{
    if (this._onerror) this._onerror(src);    
}

Loader.prototype.handleDone = function()
{
    if (this._ondone) this._ondone(this.loaded);
}

Loader.prototype.handleLoaded = function(obj, src, arg)
{
    var i = this.queue.indexOf(src);
    if (i === -1) {
	console.log("ERROR: cannot dequeue " + src);
	return;
    }

    this.queue[i] = this.queue[this.queue.length-1];
    this.queue.pop();
    this.loaded.push(obj);

    if (this._onload) this._onload(obj, arg);

    if (this.queue.length === 0) {
	this.handleDone();
    }
}

/*******************/
/* SceneDataLoader */
/*******************/

function SceneDataLoader()
{
    Loader.call(this);
}
SceneDataLoader.prototype = Object.create(Loader.prototype);

SceneDataLoader.prototype.handleDone = function()
{
    var scenes = {};
    for (var scn of this.loaded) {
	scenes[scn.name] = scn;
    }
    if (this._ondone) this._ondone(scenes);
}

SceneDataLoader.prototype.add = function(src, arg)
{
    this.queue.push(src);

    var req = new XMLHttpRequest();
    req.overrideMimeType("application/json");

    // Add a timestamp to avoid caching this
    var srcPath = src + "?time=" + (new Date()).getTime();
    req.open("GET", srcPath, true);

    req.onerror = (
	function() {
	    this.handleError(src);
	}
    ).bind(this);

    req.onreadystatechange = (
	function() {
	    if (req.readyState == 4 && req.status == "200") {
		// Parse the JSON and extract the scene info
		// TODO - handle exceptions here
		scn = SceneData.fromJSON(src, req.responseText);
		scn.src = src;
		this.handleLoaded(scn, src, arg);
	    }
	}
    ).bind(this);

    req.send(null);
}

/*****************/
/* LoadingScreen */
/*****************/

/* Loads various game resources while showing a loading screen/progress to
 * the player. */
function LoadingScreen()
{
    this.name = "LoadingScreen";
    this.stage = new PIXI.Container();
    this.started = false;

    this.eventManager = new EventManager();
    this.onDone = this.eventManager.hook("done");
}

LoadingScreen.prototype.start = function()
{
    if (!this.started) {
	this.started = true;
	this._loadSceneData();
    }
}

LoadingScreen.prototype._loadSceneData = function()
{
    // Load all the scene meta data here, then the scene images below
    var ldr = new SceneDataLoader();
    for (var scene of SCENES) {
	ldr.add("media/scenes/" + scene + "/scene.json");
    }
    ldr.ondone((
	function(dataList) {
	    this._loadSceneImages(dataList);
	}
    ).bind(this));

    ldr.onerror((
	function(src) {
	    console.log("Error loading scene: " + src);
	}
    ).bind(this));

    ldr.onload((
	function(scn, src) {
	    console.log("Loaded scene: " + scn.name);
	}
    ).bind(this));
    console.log("Loading scene meta data");
}

/* Called when the basic scene data is loaded. This function loads the layer
 * and thing textures for each scene. */
LoadingScreen.prototype._loadSceneImages = function(dataList)
{
    this.dataList = dataList;
    console.log("Loading scene images");
    // Queue up the texture maps associated with the various scenes
    PIXI.loader.defaultQueryString = "nocache=" + (new Date()).getTime();
    for (var name in dataList) {
	PIXI.loader.add(dataList[name].spritesPath);
    };
    //PIXI.loader.on("progress", progresscb);

    PIXI.loader.load((function() {
	console.log("DONE loading scene images");
	this.eventManager.dispatch("done");
    }).bind(this));
}
