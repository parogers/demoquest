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

function Scene()
{
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

Scene.prototype.destroy = function()
{
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

/* Set the camera position within the scene. The position is from -1 (furthest
 * left) to 1 (furthest right) with 0 being the centre of the scene. This 
 * code moves the layers around to simulate parallax scrolling. */
Scene.prototype.setCameraPos = function(xpos, ypos)
{
    if (xpos !== this.cameraX || ypos !== this.cameraY) 
    {
	var backWidth = this.getBaseSize().width;
	var centreX = 0;
	xpos = Math.min(Math.max(xpos, -1), 1);
	for (var layer of this.layers) {
	    var pos = centreX-xpos*(layer.getWidth()/2-backWidth/2);
	    layer.container.x = pos;
	}
	this.cameraX = xpos;
	// TODO - handle ypos...
    }
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
	    return {layer: layer, sprite: null, thing: null};
	}
    }
    return {layer: null, sprite: null, thing: null};
}

Scene.prototype.getThing = function(name)
{
    return this.things[name];
}

Scene.prototype.getLayer = function(name)
{
    for (let layer of this.layers) {
	if (layer.name === name) return layer;
    }
    return null;
}

Scene.prototype.pause = function()
{
    this.logic.pause();
}

Scene.prototype.resume = function()
{
    this.logic.resume();
}

Scene.prototype.initScene = function(screen, logic)
{
    this.screen = screen;
    this.logic = logic;
    this.logic.initScene(screen, this);
}

Scene.prototype.handleClicked = function(x, y)
{
    var args = this.checkHit(x, y);
    if (args.thing) {
	this.logic.handleClicked(args.thing);
	return true;
    }
    return false;
}

/* Builds a new scene given the SceneData instance. This function builds
 * the layers and adds the sprites. */
Scene.fromData = function(sceneData)
{
    var scn = new Scene();
    scn.name = sceneData.name;
    scn.sceneData = sceneData;

    let renderer = Render.getRenderer();

    // Build the layers and contained sprites
    for (var layerData of sceneData.layers) 
    {
	var texture = scn.sceneData.getTexture(layerData.name);
	var mask = Utils.getTransparencyMask(renderer, texture);
	var layer = new Layer(layerData.name, texture, mask);
	scn.addLayer(layer);
	for (var spriteData of layerData["sprites"]) 
	{
	    var texture = scn.sceneData.getTexture(spriteData["name"]);
	    var sprite = new PIXI.Sprite(texture);
	    sprite.name = spriteData["name"];
	    sprite.anchor.set(0, 0);
	    sprite.x = spriteData["x"] - layer.getWidth()/2;
	    sprite.y = spriteData["y"] - layer.getHeight()/2;

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
		stateName = sprite.name.substr(n+1);
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
    }
    scn.setCameraPos(sceneData.cameraX, sceneData.cameraY);
    return scn;
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

SceneData.fromJSON = function(src, raw)
{
    // Determine the scene directory
    var i = src.lastIndexOf("/");
    var scn = new SceneData(src.substring(0, i+1));
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
}

/* Returns a PIXI texture given it's name (assuemd to belong to this scene */
SceneData.prototype.getTexture = function(name)
{
    var res = PIXI.loader.resources[this.spritesPath];
    if (!res) {
	throw Error("No such sprite resource: " + this.spritesPath);
    }
    var texture = res.textures[name];
    if (!texture) {
	throw Error("No such texture: " + name);
    }
    return texture;
}

/*********/
/* Layer */
/*********/

/* A layer is a "slice" of a level consisting of an image along with a 
 * collection of things. */
function Layer(name, texture, mask)
{
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
    var reversed = this.container.children.slice().reverse();
    for (var sprite of reversed) {
	if (sprite.name && 
	    sprite.visible && 
	    x >= sprite.x && 
	    y >= sprite.y && 
	    x < sprite.x + sprite.width && 
	    y < sprite.y + sprite.height)
	{
	    var xp = (x-sprite.x)|0;
	    var yp = (y-sprite.y)|0;
	    if (this.masks && this.masks[sprite.name][xp][yp] > 0)
		return sprite;
	}
    }
    return null;
}

Layer.prototype.addSprite = function(sprite, mask)
{
    // TODO - check for duplicates
    //this.sprites[sprite.name] = sprite;
    this.masks[sprite.name] = mask;
    this.container.addChild(sprite);
}

Layer.prototype.setVisible = function(b)
{
    this.container.visible = !!b;
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
    this.name = name;
    this.state = "default";
    this.invisibleToClicks = false;

    var mgr = new Events.EventManager();
    this.onVisible = mgr.hook("visible");
    this.dispatch = mgr.dispatcher();
}

Thing.prototype.getSprite = function(state)
{
    if (state === undefined) state = this.state;
    return this.sprites[state];
}

/* Sets the current "state" of this thing. It sets as visible the sprite 
 * called thingName + "_" + state, and sets all others as invisible. */
Thing.prototype.setState = function(state)
{
    if (!this.sprites[state]) {
	throw Error("invalid thing state for " + this.name + ": " + state);
    }
    for (var spriteName in this.sprites) {
	this.sprites[spriteName].visible = false;
    }
    this.sprites[state].visible = true;
    this.state = state;
    return this.getSprite();
}

Thing.prototype.isVisible = function()
{
    for (var name in this.sprites) {
	if (this.sprites[name].visible) return true;
    }
    return false;
}

Thing.prototype.setVisible = function(b)
{
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
}

module.exports = {
    Scene: Scene,
    SceneData: SceneData,
    Thing: Thing
};
