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

/* Returns a 2d matrix containing the alpha values of each pixel in the given
 * image. So that grid[x][y] => alpha value at pixel (x, y) */
function getTransparencyMask(renderer, texture)
{
    var sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0, 0);
    // This returns a flat array packed with pixel values (RGBARGBA...)
    var pixels = renderer.extract.pixels(sprite);
    var mask = [];
    for (var x = 0; x < sprite.width; x++) {
	mask.push([]);
	for (var y = 0; y < sprite.height; y++) {
	    var value = pixels[4*(x + y*sprite.width)+3];
	    mask[mask.length-1].push(value);
	}
    }
    return mask;
}

function makeSolidColourTexture(colour, width, height)
{
    // Use an HTML canvas to render a solid area of colour
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return PIXI.Texture.fromCanvas(canvas);
}

function delayUpdate(delay)
{
    return function(dt) {
        delay -= dt;
        return delay > 0;
    }
}

/**********/
/* Screen */
/**********/

function Screen()
{
    this.renderer = null;
    this.width = width;
    this.height = height;

    var mgr = new EventManager();
    this.dispatch = mgr.dispatcher();
    this.onResize = mgr.hook("resize");
}

Screen.prototype.configure = function(renderer)
{
    this.renderer = renderer;
    this.width = renderer.width;
    this.height = renderer.height;
}

/*********/
/* Fader */
/*********/

function Fader(width, height, dir, duration)
{
    var txt = makeSolidColourTexture("black", width, height);
    this.sprite = new PIXI.Sprite(txt);
    this.sprite.alpha = (dir === 1 ? 0 : 1);
    this.duration = duration;
    this.dir = dir;
}

Fader.prototype.start = function(stage)
{
    stage.addChild(this.sprite);
}

Fader.prototype.update = function(dt)
{
    this.sprite.alpha += this.dir*dt/this.duration;
    if (this.dir > 0 && this.sprite.alpha >= 1) {
	this.sprite.alpha = 1;
	this.sprite.parent.removeChild(this.sprite);
	return false;
    } else if (this.dir < 0 && this.sprite.alpha <= 0) {
	this.sprite.alpha = 0;
	this.sprite.parent.removeChild(this.sprite);
	return false;
    }
    return true;
}

module.exports = {
    makeSolidColourTexture: makeSolidColourTexture,
    getTransparencyMask: getTransparencyMask,
    Fader: Fader,
    delayUpdate: delayUpdate
};
