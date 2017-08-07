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

/* The stage manages the user interface. Each piece of the interface is
 * associated with a DOM node:
 * 
 *    stageNode = A container div holding the UI
 *    sceneNode = Contains elements of the scene (eg background images)
 *    curtainNode = An overlay that is used to transition between scenes
 *    messagesNode = Displays messages to the player
 */
function Stage()
{
    // The HTML element (div) holding the scene images
    this.sceneNode = document.getElementById("scene");
    this.stageNode = document.getElementById("stage");
    this.curtainNode = document.getElementById("curtain");
    this.messagesNode = document.getElementById("messages");
    // The scene being displayed
    this.scene = null;
    this.cameraX = 0;
    this.stageLayers = [];
}

Stage.prototype.setScene = function(scene)
{
    // A callback used below to prevent img elements from getting dragged
    // around when the player is trying to pan the scene.
    function noDragging() {
	return false;
    }

    this.scene = scene;
    this.sceneNode.innerHTML = "";
    this.stageLayers = [];
    for (var layer of scene.layers) 
    {
	// Create a div to hold the layer background images, and any floating
	// images within in.
	var div = document.createElement("div");
	this.sceneNode.appendChild(div);

	// Note we take a copy of the background and thing images, so we can
	// fiddle with their attributes (ie render size, class names, etc)
	// without mucking up the original.
	var src = scene.scenePath + layer.name;
	var img = new Image();
	img.src = Media[src].src;
	img.id = "layer_" + layer.name
	// Prevent the img from being dragged. (function cached above)
	img.ondragstart = noDragging;
	img.className = "layer";
	img.style.height = this.sceneNode.style.height;
	//console.log("LAYER: " + src + " " + img);
	div.appendChild(img);

	// Size the div to match the image dimensions
	div.style.width = img.width;
	div.style.height = img.height;

	// Keep a copy of the transparency mask (used later for checking
	// mouse clicks)
	var stageLayer = new StageLayer();
	stageLayer.div = div;
	stageLayer.name = layer.name;
	stageLayer.mask = getTransparencyMask(Media[src]);
	this.stageLayers.push(stageLayer);

	// Now that we know the render size of the background layer (by
	// setting the class name above) we can figure out the overall
	// scale being applied to scale the things below.
	var scale = img.height / Media[src].height;
	stageLayer.scale = scale;

	for (var thing of layer.things) 
	{
	    var src = scene.scenePath + thing.name;
	    var img = new Image();
	    img.src = Media[src].src;
	    img.id = "thing_" + thing.name;
	    img.name = thing.name;
	    img.ondragstart = noDragging;
	    img.className = "thing";
	    img.height = scale*Media[src].height;
	    img.style.left = scale*thing.x;
	    img.style.top = scale*thing.y;

	    //console.log("THING: " + src + " " + thing.x + ", " + thing.y);
	    div.appendChild(img);
	    stageLayer.thingImgs.push(img);
	}
    }
    this.setCameraPos(this.cameraX);
}

/* Set the camera position within the scene. The position is from -1 (furthest
 * left) to 1 (furthest right) with 0 being the centre of the scene. This 
 * code moves the layers around to simulate parallax scrolling. */
Stage.prototype.setCameraPos = function(xpos)
{
    var centreX = this.sceneNode.clientWidth/2;
    var backWidth = this.stageLayers[0].div.clientWidth;
    for (var stageLayer of this.stageLayers) 
    {
	var div = stageLayer.div;
	var pos = (
	    centreX-div.clientWidth/2-xpos*(div.clientWidth/2-backWidth/2));
	div.style.left = pos|0;
    }
    this.cameraX = xpos;
}

/* Called to handle a mouse click on the stage area. The event is passed 
 * through as-is from the click handler. */
Stage.prototype.handleClicked = function(event)
{
    var rect = this.sceneNode.getBoundingClientRect();
    var x = event.clientX;
    var y = event.clientY;

    if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) 
    {
	return;
    }

    // Search through the stage layers in reverse order (closest layer is
    // considered first). It would be nice to hook into the DOM event API
    // here and attach 'mousedown' handlers to the layer divs, but it just
    // won't work. Pixel visibility (alpha) isn't taken into account when 
    // checking for mouse clicks on elements.
    var reversed = Array.slice(this.stageLayers).reverse();
    for (var stageLayer of reversed)
    {
	// First check if they clicked on a thing in the layer
	var hit = stageLayer.checkHitThing(x, y);
	if (hit !== null) {
	    console.log("CLICKED THING: " + hit + "\n");
	    break;
	}

	// Now check if they clicked on this layer itself
	if (stageLayer.checkHit(x, y)) {
	    console.log("CLICKED: " + stageLayer.name + "\n");
	    break;
	}
    }
}

Stage.prototype.handleScreenResize = function()
{
    this.stageNode.style.display = "block";

    var messageArea = document.getElementById("message-area");
    var rect = messageArea.getBoundingClientRect();
    var msgHeight = (rect.bottom-rect.top);
    var sceneSize = Math.min(
	window.innerWidth-16,
	window.innerHeight-16-msgHeight);
    var stageWidth = sceneSize;
    var stageHeight = sceneSize + msgHeight;

    console.log("STAGE: " + stageWidth + ", " + stageHeight);
    console.log("SCENE: " + sceneSize);

    // Make the scene div visible (let's us query the width/height)
    this.stageNode.style.width = stageWidth;
    this.stageNode.style.height = stageHeight;

    this.sceneNode.style.width = sceneSize;
    this.sceneNode.style.height = sceneSize;

    messageArea.style.top = sceneSize + "px";
    messageArea.style.width = sceneSize + "px";

    /*var width = this.sceneNode.offsetWidth || this.sceneNode.clientWidth;
    var height = this.sceneNode.offsetHeight || this.sceneNode.clientHeight;

    var style = window.getComputedStyle(this.sceneNode);

    this.stageNode.style.width = style.width;
    this.stageNode.style.height = (rect.bottom-rect.top) + "px";

    this.curtainNode.style.width = style.width;
    this.curtainNode.style.height = style.height;

    this.messagesNode.style.top = style.height;*/

    // Center the staging area in the window, as best we can
    var top = window.innerHeight/2-stageHeight/2;
    if (top < 0) top = 0;
    this.stageNode.style.top = top;
    this.stageNode.style.left = window.innerWidth/2 - stageWidth/2;

    // TODO - this is very inefficient
    if (this.scene) this.setScene(this.scene);
}

/**************/
/* StageLayer */
/**************/

/* The visual equivalent to a scene Layer. (ie a visual "slice" of the scene
 * at a fixed depth) Manages the background image and clickable objects 
 * on this layer. */
function StageLayer()
{
    // The div holding the layer image and all things
    this.div = null;
    this.thingImgs = [];
    // The transparency mask for the layer image
    this.mask = null;
    // The scaling factor from original source image size to display size
    this.scale = 1;
}

/* Check if the given point refers to an opaque pixel of this layer. The point
 * is given relative to the viewport. */
StageLayer.prototype.checkHit = function(x, y)
{
    // First we need to convert from display coordinates to coordinates 
    // relative to the layer div.
    var rect = this.div.getBoundingClientRect();
    var xp = x - rect.left;
    var yp = y - rect.top;

    // Now convert from div coordinates to unscaled image coordinates
    // (ie as loaded from file) so we can use the transparency mask to 
    // detect a mouse hit.
    var xp = Math.floor(xp/this.scale);
    var yp = Math.floor(yp/this.scale);

    // Now check against the transparency mask
    if (xp >= 0 && yp >= 0 && xp < this.mask.length && yp < this.mask[0].length)
    {
	return (this.mask[xp][yp] === 255);
    }
    return false;
}

/* Similar to checkHit but checks against thing images in this layer. Returns
 * the name of the thing hit, or null if nothing is found. */
StageLayer.prototype.checkHitThing = function(x, y)
{
    for (var img of this.thingImgs) {
	var rect = img.getBoundingClientRect();
	if (x >= rect.left && x <= rect.right && 
	    y >= rect.top && y <= rect.bottom) {
	    return img.name;
	}
    }
    return null;
}
