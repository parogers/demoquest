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
    // Descriptive scene name
    this.name = null;
    // Relative path to the scene directory (ends with '/')
    this.scenePath = null;
    // The scene keyname should be unique game-wide
    this.keyname = null;
    // The layers that makeup the scene (Layer instances)
    this.layers = [];
    // The camera position (-1 to 1)
    this.cameraX = 0;
}

function buildSceneFromJSON(src, raw)
{
    var scn = new Scene();
    var data = JSON.parse(raw);
    scn.name = data["name"];
    scn.keyname = data["keyname"];
    scn.description = data["description"];
    // Determine the scene directory
    var i = src.lastIndexOf("/");
    scn.scenePath = src.substring(0, i+1);
    // Build the layers
    for (var layerData of data["layers"]) {
	var layer = new Layer(layerData["name"]);
	layer.src = layerData["background"];
	if (layerData["things"]) {
	    layer.things = layerData["things"];
	}
	scn.layers.push(layer);
    }
    scn.rawJSON = raw;
    return scn;
}

/*********/
/* Layer */
/*********/

/* A layer is a "slice" of a level consisting of an image along with a 
 * collection of things. The stack of layers are rendered together in parallax
 * fashion to form the scene. */
function Layer(name)
{
    // The layer name (unique to the scene)
    this.name = name;
    // Path to the image
    this.src = null;
    // The transparency mask for the image. Useful for determining whether
    // the user clicks on a piece of this layer.
    this.mask = null;
    // The div element which will contain the layer image, and any thing
    // images in this layer.
    //this.div = document.createElement("div");
    this.things = [];
}

/* Check if the given point refers to an opaque pixel of this layer. The point
 * is given relative to the top-left corner of the image, and is expressed in
 * scaled screen coordinates. (ie relative to the rendered image size) */
Layer.prototype.checkHit = function(x, y)
{
    var scale = this.getDisplayScale();
    var xp = Math.floor(x/scale);
    var yp = Math.floor(y/scale);

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
