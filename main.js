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

var SCENES = ["road", "intro"];
var gameState = null;

function onload()
{
    var div = document.getElementById("canvas-area");
    gameState = new GameState(div);

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
