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
var scene = null;

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

    sceneNode = document.getElementById("scene");
    handleScreenResize();

    window.addEventListener("resize", handleScreenResize);

    var cameraX = 0;
    var newCameraX = 0;
    var dragX = 0;
    var pressing = false;
    window.addEventListener("mousemove", function(event) {
	if (!pressing) return;
	var x = cameraX + (event.pageX - dragX) / (window.innerWidth/4);
	x = Math.max(Math.min(x, 1), -1);
	updateCamera(x);
	newCameraX = x;
    });

    window.addEventListener("mousedown", function(event) {
	pressing = true;
	dragX = event.pageX;
    });

    window.addEventListener("mouseup", function(event) {
	pressing = false;
	cameraX = newCameraX;
    });

/*    Loader.loadImages([
	"out1.png",
	"out2.png",
	"out3.png",
	"out4.png",
	"out5.png"
    ]).onload(function(img) {
	console.log("LOADED: " + img.src);

    }).onerror(function(img) {
	console.log("ERROR LOADING: " + img.src);

    }).ondone(loaded);*/

    // Load all the scene meta data here, then the scene images below
    var ldr = new Loader.SceneLoader();
    ldr.add("media/scenes/test/scene.json");
    ldr.ondone(function(scenes) {
	handleScenesLoaded(scenes);
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
function handleScenesLoaded(scenes)
{
    // Use a single loader instance to load everything at once
    var ldr = new Loader.ImageLoader();
    ldr.ondone(function() {
	handleLayersLoaded(scenes);
    });
    ldr.onload(function(img, layer) {
	layer.img = img;
    });

    for (var key in scenes) 
    {
	var scene = scenes[key];
	for (var layer of scene.layers) {
	    ldr.add(scene.scenePath + layer.src, layer);
	}
    }
}

/* Called once all the layer images are loaded */
function handleLayersLoaded(scenes)
{
    console.log("Done loading scene images");

    for (var key in scenes) 
    {
	// Now that the layer images are loaded we can sort them by relative
	// depth. Images that are wider are considered closer to the camera.
	scenes[key].layers.sort(function(a, b) {
	    return (a.img.width > b.img.width) - (a.img.width < b.img.width);
	});
    }

    function noDragging() {
	return false;
    }

    scene = scenes["road"];
    for (layer of scene.layers) {
	layer.img.ondragstart = noDragging;
	sceneNode.appendChild(layer.img);
    }
    scene = scn;
    updateCamera(0);
}

function updateCamera(x)
{
    var n = 1;
    var centreX = sceneNode.clientWidth/2;
    var backWidth = scene.layers[0].img.width;
    for (layer of scene.layers) {
	var img = layer.img;
	img.style.left = (centreX-img.width/2-x*(img.width/2-backWidth/2))|0;
	n++;
    }
}


function handleScreenResize()
{
    // Center the game screen in the window, as best we can
    var top = window.innerHeight/2-sceneNode.clientHeight/2;
    if (top < 0) top = 0;
    sceneNode.style.top = top;
    sceneNode.style.left = window.innerWidth/2 - sceneNode.clientWidth/2;
}
