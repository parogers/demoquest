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

function getTransparencyMask(img)
{
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0);

    var imgData = ctx.getImageData(0, 0, img.width, img.height);
    var mask = [];
    for (var x = 0; x < img.width; x++) {
	mask.push([]);
	for (var y = 0; y < img.height; y++) {
	    var value = imgData.data[4*(x + y*img.width)+3];
	    mask[mask.length-1].push(value);
	}
    }
    return mask;
}

function getNativeWidth(img)
{
    var tmp = new Image();
    tmp.src = img.src;
    return tmp.width;
}

function getNativeHeight(img)
{
    var tmp = new Image();
    tmp.src = img.src;
    return tmp.height;
}

