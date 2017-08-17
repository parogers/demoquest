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

var gameState = null;

function onload()
{
    // Set pixel scaling to be "nearest neighbour" which makes textures 
    // render nice and blocky.
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    // Disable the ticker sinc we don't use it (rendering happens as needed)
    PIXI.ticker.shared.autoStart = false;
    PIXI.ticker.shared.stop();

    var div = document.getElementById("canvas-area");
    gameState = new GameState(div);

    window.addEventListener("resize", function() {
	gameState.handleResize();
    });

    // Load all the scene meta data here, then the scene images below
    var ldr = new Loader.SceneDataLoader();
    ldr.add("media/scenes/road/scene.json");
    ldr.ondone(function(scenes) {
	console.log("DONE loading scene metadata");
	loadSceneImages(scenes);
    });
    ldr.onerror(function(src) {
	console.log("Error loading scene: " + src);
    });
    ldr.onload(function(scn, src) {
	console.log("Loaded scene: " + scn.keyname);
    });

/*
    window.addEventListener("touchstart", function(event) {
	var touches = event.changedTouches;

	for (var touch of touches) {
	    var div = document.createElement("div");
	    div.className = "marker";
	    div.style.left = touch.pageX;
	    div.style.top = touch.pageY;
	    document.body.appendChild(div);
	}

    }, false);

    window.addEventListener("touchmove", function(event) {
    }, false);

    window.addEventListener("touchcancel", function(event) {
    }, false);

    window.addEventListener("touchend", function(event) {
    }, false);

    stage = new Stage();
    stage.handleScreenResize();
*/
}

/* Called when the basic scene data is loaded. This function loads the layer
 * and thing textures for each scene. */
function loadSceneImages(dataList)
{
    var now = (new Date()).getTime();
    Object.values(dataList).forEach(function(data) {
	PIXI.loader.add(data.spritesPath);
    });
    //PIXI.loader.on("progress", progresscb);
    PIXI.loader.defaultQueryString = "nocache=" + now;
    PIXI.loader.load(function() {
	console.log("DONE loading scene images");

	var scene = Scene.fromData(dataList["road"]);
	gameState.screen.setScene(scene);
	gameState.redraw();
    });

/*
    // Use a single loader instance to load everything at once
    var ldr = new Loader.ImageLoader();
    ldr.ondone(function() {
	stage.setScene(scenes["road"]);
	//setup(scenes);
	//handleLayersLoaded(scenes);
    });
    ldr.onerror(function(src) {
	console.log("ERROR loading media: " + src);
    });
    ldr.onload(function(img, path) {
    });

    for (var key in scenes) 
    {
	var scene = scenes[key];
	for (var layer of scene.layers) {
	    // Queue the background image and anything else in the scene. Note
	    // all images are stored in a global 'Media' object.
	    ldr.add(
		scene.scenePath + layer.src, 
		scene.scenePath + layer.name);
	    for (var thing of layer.things) 
	    {
		ldr.add(
		    scene.scenePath + thing.src,
		    scene.scenePath + thing.name);
	    }
	}
    }*/
}

/* Called once all the layer images are loaded. This function triggers the
 * main loop which starts the game. */
function setup(scenes)
{
    console.log("Done loading scene images");

/*    Loader.loadImages([
	"key.png"
    ]).onload(function(img) {
	console.log("LOADED: " + img.src);

	var thing = new Thing(img);
	img.className = "thing";
	img.style.top = 0;
	img.style.left = 0;

	img.width = img.width*scene.getDisplayScale();

	scene.layers[4].div.appendChild(img);

	console.log(scene.layers[4].name);

    }).onerror(function(img) {
	console.log("ERROR LOADING: " + img.src);

    });*/
}
