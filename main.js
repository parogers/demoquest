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

var sceneNode = null;
var stage = null;
var Media = {};

/***/

function onload()
{
/*
    var layers = [];
    for (var n = 1; ; n++) {
	var img = document.getElementById("layer" + n);
	if (!img) break;

	img.ondragstart = function() { return false; }
	console.log(img.width);

	layers.push(img);
    }

*/

    stage = new Stage(
	document.getElementById("stage"),
	document.getElementById("scene"),
	document.getElementById("curtain"),
	document.getElementById("messages")
    );
    stage.handleScreenResize();

    window.addEventListener("resize", function() {
	stage.handleScreenResize();
    });

    var cameraX = 0;
    var newCameraX = 0;
    var dragX = 0;
    var pressing = false;
    window.addEventListener("mousemove", function(event) {
	if (!pressing) return;
	var x = cameraX + (event.pageX - dragX) / (window.innerWidth/4);
	x = Math.max(Math.min(x, 1), -1);
	stage.setCameraPos(x);
	newCameraX = x;
    });

    stage.stageNode.addEventListener("mousedown", function(event) {
	pressing = true;
	dragX = event.pageX;
    });

    window.addEventListener("mouseup", function(event) {
	pressing = false;
	cameraX = newCameraX;

	if (event.pageX === dragX) {
	    stage.handleClicked(event);
	}
    });

    // Load all the scene meta data here, then the scene images below
    var ldr = new Loader.SceneLoader();
    ldr.add("media/scenes/road/scene.json");
    ldr.ondone(function(scenes) {
	loadSceneImages(scenes);
    });
    ldr.onerror(function(src) {
	console.log("Error loading scene: " + src);
    });
    ldr.onload(function(scn, src) {
	console.log("Loaded scene: " + scn.keyname);
    });
}

/* Called when the basic scene data is loaded. This function loads the layer
 * images for each scene. */
function loadSceneImages(scenes)
{
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
	Media[path] = img;
	/*img.className = "layer";
	layer.img = img;
	layer.div.appendChild(img);
	layer.origWidth = img.width;
	layer.origHeight = img.height;
	layer.mask = getTransparencyMask(img);*/
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
    }
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
