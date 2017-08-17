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
/* Scene */
/*********/

function Scene()
{
    this.layers = [];
    // The sprite container where everything in the scene is kept
    this.container = new PIXI.Container();
    this.sceneData = null;
    this.cameraX = 0;
}

/* Builds a new scene given the SceneData instance. This function builds
 * the layers and adds the sprites. */
Scene.fromData = function(sceneData)
{
    var scn = new Scene();
    scn.sceneData = sceneData;
    // Build the layers and contained sprites
    for (var layerData of sceneData.layers) 
    {
	var texture = scn.getTexture(layerData.name);
	var layer = new Layer(layerData.name, texture);
	scn.addLayer(layer);
	for (var thingData of layerData["things"]) {
	    var texture = scn.getTexture(thingData["name"]);
	    var thing = new PIXI.Sprite(texture);
	    thing.anchor.set(0, 0);
	    thing.x = thingData["x"] - layer.sprite.texture.width/2;
	    thing.y = thingData["y"] - layer.sprite.texture.height/2;
	    layer.addThing(thingData["name"], thing);
	}
    }
    return scn;
}

/* Returns the width and height of the bottom layer in this scene. This is
 * considered the 'base size' and is used to determine how the scene should
 * be scaled to fit the viewport */
Scene.prototype.getBaseSize = function()
{
    return {
	width: this.layers[0].getWidth(),
	height: this.layers[0].getHeight()
    };
}

Scene.prototype.addLayer = function(layer)
{
    this.layers.push(layer);
    this.container.addChild(layer.container);
}

/* Returns a PIXI texture given it's name (assuemd to belong to this scene */
Scene.prototype.getTexture = function(name)
{
    var res = PIXI.loader.resources[this.sceneData.spritesPath];
    if (!res) {
	throw Error("No such sprite resource: " + this.sceneData.spritesPath);
    }
    var texture = res.textures[name];
    if (!texture) {
	throw Error("No such texture: " + name);
    }
    return texture;
}

/* Set the camera position within the scene. The position is from -1 (furthest
 * left) to 1 (furthest right) with 0 being the centre of the scene. This 
 * code moves the layers around to simulate parallax scrolling. */
Scene.prototype.setCameraPos = function(xpos)
{
    var backWidth = this.getBaseSize().width;
    var centreX = 0;
    for (var layer of this.layers) {
	var pos = centreX-xpos*(layer.getWidth()/2-backWidth/2);
	layer.container.x = pos;
    }
    this.cameraX = xpos;
}

/* Returns the scene element under the position (given relative to the top
 * left corner of the unscaled scene viewport) 
 * This returns {layer: name, thing: name} which names the layer that was 
 * clicked, and (optionally) the thing within that layer that was clicked. */
Scene.prototype.checkHit = function(x, y)
{
    // Search through the stage layers in reverse order, so we start with
    // the "front most" layer and proceed to the ones behind.
    var offset = x - this.getBaseSize().width/2;
    var reversed = Array.slice(this.layers).reverse();
    for (var layer of reversed)
    {
	var xp = offset - layer.container.x + layer.getWidth()/2;
	var yp = y;

	// First check if they clicked on a thing in the layer
	var thing = layer.checkHitThing(xp, yp);
	if (thing) {
	    return {layer: layer.name, thing: thing};
	}

	// Now check if they clicked on this layer itself
	if (layer.checkHit(xp, yp)) {
	    return {layer: layer.name, thing: null};
	}
    }
    return {layer: null, thing: null};
}

/*************/
/* SceneData */
/*************/

function SceneData(scenePath)
{
    // Descriptive scene name
    this.name = null;
    // Relative path to the scene directory (ends with '/')
    this.scenePath = scenePath;
    this.spritesFile = "sprites.json";
    this.spritesPath = scenePath + this.spritesFile;
    // The scene keyname should be unique game-wide
    this.keyname = null;
    // The layers that makeup the scene (Layer instances)
    this.layers = [];
    // The camera position (-1 to 1)
    this.cameraX = 0;
}

SceneData.fromJSON = function(src, raw)
{
    // Determine the scene directory
    var i = src.lastIndexOf("/");
    var scn = new SceneData(src.substring(0, i+1));
    var data = JSON.parse(raw);
    scn.name = data["name"];
    scn.keyname = data["keyname"];
    scn.description = data["description"];
    // Build the layers
    /*for (var layerData of data["layers"]) {
	var layer = new Layer(layerData["name"]);
	layer.src = layerData["background"];
	if (layerData["things"]) {
	    layer.things = layerData["things"];
	}
	scn.layers.push(layer);
    }*/
    scn.layers = data["layers"];
    scn.rawJSON = raw;
    return scn;
}

/*********/
/* Layer */
/*********/

/* A layer is a "slice" of a level consisting of an image along with a 
 * collection of things. */
function Layer(name, texture)
{
    // The layer name (unique to the scene)
    this.name = name;
    // The transparency mask for the image. Useful for determining whether
    // the user clicks on a piece of this layer.
    this.mask = getTransparencyMask(gameState.renderer, texture);
    // The container holding the background image, and all thing sprites 
    // on this layer.
    this.container = new PIXI.Container();
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.sprite);
    // The thing sprites rendered in this scene
    this.sprites = {};
}

Layer.prototype.getWidth = function()
{
    return this.sprite.texture.width;
}

Layer.prototype.getHeight = function()
{
    return this.sprite.texture.height;
}

/* Check if the given point refers to an opaque pixel of this layer */
Layer.prototype.checkHit = function(x, y)
{
    var xp = x|0;
    var yp = y|0;
    if (xp >= 0 && yp >= 0 && xp < this.mask.length && yp < this.mask[0].length)
    {
	return (this.mask[xp][yp] === 255);
    }
    return false;
}

/* Similar to checkHit, but checks if the given point connects with a thing
 * instance in this layer. If so, this returns the thing. */
Layer.prototype.checkHitThing = function(x, y)
{
}

Layer.prototype.addThing = function(name, sprite)
{
    // TODO - check for duplicates
    this.sprites[name] = sprite;
    this.container.addChild(sprite);
}

/**************/
/* PlayScreen */
/**************/

function PlayScreen()
{
    // The scene displayed
    this.scene = null;
    // The top-level PIXI container that holds the scene sprites. This 
    // container gets scaled to fit the canvas.
    this.stage = new PIXI.Container();
    this.displayScale = 1;
    // The thing being dragged around, or null if no dragging is happening
    // or the player is panning around instead.
    this.dragging = null;
    // The mouse cursor position when the player started dragging around
    this.dragStartX = 0;
    this.dragStartY = 0;
}

PlayScreen.prototype.setScene = function(scn)
{
    this.scene = scn;
    this.stage.children = [];
    this.stage.addChild(scn.container);
    this.handleResize();
}

/* Called when the game window is resized. This scales the scene to fit the 
 * available space. */
PlayScreen.prototype.handleResize = function()
{
    if (this.scene) {
	var renderer = gameState.renderer;
	this.displayScale = renderer.height/this.scene.getBaseSize().height;
	this.stage.scale.set(this.displayScale);
	this.stage.x = renderer.width/2;
	this.stage.y = renderer.height/2;
    }
}

PlayScreen.prototype.handleClick = function(x, y)
{
    if (this.scene) {
	var xp = x/this.displayScale;
	var yp = y/this.displayScale;
	var args = this.scene.checkHit(xp, yp);
	console.log(args);
    }
}

PlayScreen.prototype.handleDragStart = function(x, y)
{
    if (!this.scene) return;

    //var args = this.checkHit(x, y);
    if (false) { //args.thing) {
	// Dragging an object
	var thing = this.scene.getThing(args.layer, args.thing);
	var rect = thing.getBoundingClientRect();
	this.dragging = args;
	this.dragStartX = parseInt(thing.style.left);
	this.dragStartY = parseInt(thing.style.top);
    } else {
	// Panning the scene
	this.dragging = null;
	this.dragStartX = this.scene.cameraX;
    }
}

PlayScreen.prototype.handleDragStop = function(x, y)
{
    this.dragging = null;
}

PlayScreen.prototype.handleDrag = function(dx, dy)
{
    if (!this.scene) return;

    if (this.dragging) {
	// Dragging a thing
	var thing = this.scene.getThing(
	    this.dragging.layer, this.dragging.thing);
	thing.style.left = this.dragStartX + dx;
	thing.style.top = this.dragStartY + dy;

    } else {
	// Panning the scene around
	var pos = this.dragStartX + dx / (window.innerWidth/4);
	pos = Math.max(Math.min(pos, 1), -1);
	this.scene.setCameraPos(pos);
	gameState.redraw();
    }
}
