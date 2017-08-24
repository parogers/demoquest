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
    this.sceneLogic = {
	"intro" : new IntroLogic(this),
	"road" : new RoadLogic(this)
    };
}

Logic.prototype.initScene = function(scene)
{
    var logic = this.sceneLogic[scene.name];
    if (logic && logic.initScene) logic.initScene(scene);
}

Logic.prototype.handleClicked = function(target)
{
    var logic = this.sceneLogic[target.scene.name];
    if (logic && logic.handleClicked) logic.handleClicked(target);
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

/* *** */

function IntroLogic(logic)
{
    this.logic = this;

    this.initScene = function(scene) {
	scene.getThing("door").setState("closed");
	scene.getThing("cupboard").setState("closed");
    }

    this.handleClicked = function(target) {
	switch(target.thing.name) {
	case "candle":
	    console.log("CANDLE");
	    //target.thing.setVisible(false);
	    //gameState.screen.setScene("road");
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
    }
}

function RoadLogic(logic)
{
    this.logic = this;

    this.initScene = function(scene) {
    }

    this.handleClicked = function(target) {
    }
}

