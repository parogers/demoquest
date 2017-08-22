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
    this.name = null;
    // List of things in this scene, stored by name (eg cupboard)
    this.things = {};
    // The same list of things, but stored by sprite name (eg cupboard_open)
    this.thingsBySpriteName = {};
}

/* Builds a new scene given the SceneData instance. This function builds
 * the layers and adds the sprites. */
Scene.fromData = function(sceneData)
{
    var scn = new Scene();
    scn.name = sceneData.name;
    scn.sceneData = sceneData;
    // Build the layers and contained sprites
    for (var layerData of sceneData.layers) 
    {
	var texture = scn.getTexture(layerData.name);
	var layer = new Layer(layerData.name, texture);
	scn.addLayer(layer);
	for (var spriteData of layerData["sprites"]) {
	    var texture = scn.getTexture(spriteData["name"]);
	    var sprite = new PIXI.Sprite(texture);
	    sprite.name = spriteData["name"];
	    sprite.anchor.set(0, 0);
	    sprite.x = spriteData["x"] - layer.getWidth()/2;
	    sprite.y = spriteData["y"] - layer.getHeight()/2;
	    layer.addSprite(sprite);

	    var n = sprite.name.indexOf("_");
	    var thingName = sprite.name;
	    var stateName = "";
	    if (n !== -1) {
		thingName = sprite.name.substr(0, n);
		stateName = sprite.name.substr(n+1);
	    }
	    var thing = scn.things[thingName];
	    if (!thing) {
		thing = scn.things[thingName] = new Thing(thingName);
	    }
	    thing.sprites[stateName] = sprite;
	    scn.thingsBySpriteName[sprite.name] = thing;
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
    layer.scene = this;
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
    var xoffset = x - this.getBaseSize().width/2;
    var yoffset = y - this.getBaseSize().height/2;
    var reversed = this.layers.slice().reverse();
    for (var layer of reversed)
    {
	var xp = xoffset - layer.container.x;
	var yp = yoffset;

	// First check if they clicked on a thing in the layer
	var sprite = layer.checkHitSprite(xp, yp);
	if (sprite) {
	    var thing = this.thingsBySpriteName[sprite.name];
	    return {
		scene: this, 
		layer: layer, 
		sprite: sprite, 
		thing: thing
	    };
	}

	// Now check if they clicked on this layer itself
	if (layer.checkHit(xp, yp)) {
	    return {scene: this, layer: layer, sprite: null, thing: null};
	}
    }
    return {scene: this, layer: null, sprite: null, thing: null};
}

Scene.prototype.getLayer = function(name)
{
    for (var layer of this.layers) {
	if (layer.name === name) {
	    return layer;
	}
    }
    return null;
}

Scene.prototype.getThing = function(name)
{
    return this.things[name];
}

/*************/
/* SceneData */
/*************/

function SceneData(scenePath)
{
    // Descriptive scene name
    this.name = null;
    // Logic for this scene (handles player interactions and gameplay logic)
    this.logic = null;
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
    scn.title = data["title"];
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
    /*
    try {
	scn.logic = eval(data["logic"]);
    } catch(e) {
	console.log("ERROR parsing scene logic for " + scn.name + ": " + e);
    }
    */
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
    this.scene = null;
    // The layer name (unique to the scene)
    this.name = name;
    // The transparency mask for the image. Useful for determining whether
    // the user clicks on a piece of this layer.
    this.mask = getTransparencyMask(gameState.renderer, texture);
    // The container holding the background image, and all thing sprites 
    // on this layer.
    this.container = new PIXI.Container();
    this.background = new PIXI.Sprite(texture);
    this.background.anchor.set(0.5, 0.5);
    this.container.addChild(this.background);
    // The list of sprites rendered in this scene (stored by name)
    this.sprites = {};
    // The transparency masks for the rendered sprites
    this.masks = {};
}

Layer.prototype.getWidth = function()
{
    return this.background.texture.width;
}

Layer.prototype.getHeight = function()
{
    return this.background.texture.height;
}

/* Check if the given point refers to an opaque pixel of this layer */
Layer.prototype.checkHit = function(x, y)
{
    var xp = (x + this.getWidth()/2)|0;
    var yp = (y + this.getHeight()/2)|0;
    if (xp >= 0 && yp >= 0 && xp < this.mask.length && yp < this.mask[0].length)
    {
	return (this.mask[xp][yp] === 255);
    }
    return false;
}

/* Similar to checkHit, but checks if the given point connects with a sprite
 * instance in this layer. If so, this returns the sprite. */
Layer.prototype.checkHitSprite = function(x, y)
{
    for (var name in this.sprites) {
	var sprite = this.sprites[name];
	if (sprite.visible && 
	    x >= sprite.x && 
	    y >= sprite.y && 
	    x < sprite.x + sprite.width && 
	    y < sprite.y + sprite.height)
	{
	    var xp = (x-sprite.x)|0;
	    var yp = (y-sprite.y)|0;
	    if (this.masks && this.masks[name][xp][yp] === 255) 
		return sprite;
	}
    }
    return null;
}

Layer.prototype.addSprite = function(sprite)
{
    // TODO - check for duplicates
    this.sprites[sprite.name] = sprite;
    this.masks[sprite.name] = getTransparencyMask(
	gameState.renderer, 
	sprite.texture);
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
    gameState.logic.initScene(scn);
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
	if (args.thing) {
	    gameState.logic.handleThingClicked(args);
	    gameState.redraw();
	}
    }
}

PlayScreen.prototype.handleDragStart = function(x, y)
{
    if (!this.scene) return;

    var xp = x/this.displayScale;
    var yp = y/this.displayScale;
    var args = this.scene.checkHit(xp, yp);
    if (false) { //args.thing) {
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

PlayScreen.prototype.handleDragStop = function(x, y)
{
    this.dragging = null;
}

PlayScreen.prototype.handleDrag = function(dx, dy)
{
    if (!this.scene) return;

    if (this.dragging) {
	// Dragging a thing
	this.dragging.x = this.dragStartX + dx/this.displayScale;
	this.dragging.y = this.dragStartY + dy/this.displayScale;
	gameState.redraw();

    } else {
	// Panning the scene around
	var pos = this.dragStartX - dx / (window.innerWidth/4);
	pos = Math.max(Math.min(pos, 1), -1);
	this.scene.setCameraPos(pos);
	gameState.redraw();
    }
}

/*********/
/* Thing */
/*********/

/* A thing is a collection of sprites, each sprite representing a different
 * visual state. For example, a bird would be represented by certain sprites
 * such as the bird in flight, the bird sitting on a branch, etc. */
function Thing(name)
{
    // Sprites associated with this thing, stored by "state" name
    this.sprites = {};
    this.state = "";
    this.name = name;
}

/* Sets the current "state" of this thing. It sets as visible the sprite 
 * called thingName + "_" + state, and sets all others as invisible. */
Thing.prototype.setState = function(state)
{
    if (!this.sprites[state]) {
	throw Error("invalid thing state: " + state);
    }
    for (var spriteName in this.sprites) {
	this.sprites[spriteName].visible = false;
    }
    this.sprites[state].visible = true;
    this.state = state;
}
