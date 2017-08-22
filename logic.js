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
/* Logic */
/*********/

function Logic()
{
    // Scene specific logic stored by name
    this.sceneLogic = {};
}

Logic.prototype.initScene = function(scene)
{
    scene.getThing("door").setState("closed");
    scene.getThing("cupboard").setState("closed");
}

Logic.prototype.handleThingClicked = function(target)
{
    switch(target.scene.name) {
    case "intro":
	switch(target.thing.name) {
	case "candle":
	    console.log("CANDLE");
	    break;

	case "cupboard":
	    if (target.thing.state === "open") 
		target.thing.setState("closed");
	    else
		target.thing.setState("open");
	    break;

	case "door":
	    if (target.thing.state === "open") 
		target.thing.setState("closed");
	    else
		target.thing.setState("open");
	    break;

	}
	break;
    }
}

Logic.prototype.handleDragStart = function(target)
{
}

Logic.prototype.handleDrag = function(target)
{
}

Logic.prototype.handleDragStop = function(target)
{
}
