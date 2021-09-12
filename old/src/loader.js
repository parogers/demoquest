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

function SceneDataLoader(indexPath)
{
    Loader.call(this);

    // First load index.json which will tell us what scenes to load
    var req = new XMLHttpRequest();
    req.overrideMimeType("application/json");

    // Add a timestamp to avoid caching this
    var srcPath = indexPath + "?time=" + (new Date()).getTime();
    req.open("GET", srcPath, true);

    req.onerror = (() => {
	this.handleError(indexPath);
    });
    req.onreadystatechange = (() => {
	if (req.readyState == 4 && req.status == "200") {
	    // TODO - handle exceptions here
	    var scenes = JSON.parse(req.responseText);
	    var n = indexPath.lastIndexOf("/");
	    var basedir = indexPath.substr(0, n+1);
	    for (var scene of scenes) {
		this.add(basedir + scene + "/scene.json");
	    }
	}
    });
    req.send(null);
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

    req.onerror = (() => {
	this.handleError(src);
    });

    req.onreadystatechange = (() => {
	if (req.readyState == 4 && req.status == "200") {
	    // Parse the JSON and extract the scene info
	    // TODO - handle exceptions here
	    var scn = Scene.SceneData.fromJSON(src, req.responseText);
	    scn.src = src;
	    this.handleLoaded(scn, src, arg);
	}
    });

    req.send(null);
}

/*****************/
/* LoadingScreen */
/*****************/

/* Loads various game resources while showing a loading screen/progress to
 * the player. */
function LoadingScreen(viewWidth, viewHeight)
{
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

LoadingScreen.prototype.start = function()
{
    if (!this.started) {
	this.started = true;
	this._loadSceneData();
    }
}

LoadingScreen.prototype._showMessage = function(msg)
{
    var fontSize = this.viewHeight*0.05;
    var text = new PIXI.Text(msg, {
	fontSize: fontSize, 
	fill: "white",
    });
    text.x = this.viewWidth*0.05;
    text.y = this.viewHeight*0.05;
    this.stage.children = [];
    this.stage.addChild(text);
    this.dispatch("redraw");
}

LoadingScreen.prototype._loadSceneData = function()
{
    // Load all the scene meta data here, then the scene images below
    var ldr = new SceneDataLoader("media/scenes/index.json");
    ldr.ondone(dataList => {
	this._loadSceneImages(dataList);
    });

    ldr.onerror((src, err) => {
	console.log("Error loading scene: " + src);
    });

    ldr.onload((scn, src) => {
	console.log("Loaded scene: " + scn.name);
    });
    this._showMessage("Loading scene data");
}

/* Called when the basic scene data is loaded. This function loads the layer
 * and thing textures for each scene. */
LoadingScreen.prototype._loadSceneImages = function(dataList)
{
    this.dataList = dataList;
    this._showMessage("Loading scene images");
    // Queue up the texture maps associated with the various scenes
    PIXI.loader.defaultQueryString = "nocache=" + (new Date()).getTime();
    for (var name in dataList) {
	PIXI.loader.add(dataList[name].spritesPath);
    };
    PIXI.loader.on("progress", (loader, res) => {
	//console.log(res);
	//this._showMessage("Loading scene images: " + res.url);
    });

    PIXI.loader.load(() => {
	this._loadAudio();
    });
}

LoadingScreen.prototype._loadAudio = function()
{
    let sources = [];
    for (let name in Audio.Effects) {
	sources.push(Audio.Effects[name]);
    }

    let processed = 0;
    Audio.load(sources, {
	whenLoaded: () => {
	    this.dispatch("done");
	    processed++;
	},
	onFailed: (source, err) => {
            console.log("Failed to load audio: " + source + ', ' + err);
	    processed++;
	    
	    if (processed >= sources.length) {
		this.dispatch('done');
	    }
	},
	onProgress: () => {
	    // ...
	}
    });
    this._showMessage("Loading audio");
}

module.exports = {
    LoadingScreen: LoadingScreen
};
