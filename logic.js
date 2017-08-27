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

Logic.prototype.handleClicked = function(ctx)
{
    var logic = this.sceneLogic[ctx.scene.name];
    if (logic && logic.handleClicked) logic.handleClicked(ctx);
}

Logic.prototype.handleDragStart = function(ctx)
{
}

Logic.prototype.handleDrag = function(ctx)
{
}

Logic.prototype.handleDragStop = function(ctx)
{
}

/***************/
/* Scene Logic */
/***************/

/* Logic classes for the various scenes in the game */

function IntroLogic(logic)
{
    this.logic = logic;

    this.initScene = function(scene) {
	scene.getThing("door").setState("closed");
	scene.getThing("cupboard").setState("closed");
    }

    this.handleClicked = function(ctx) {
	switch(ctx.thing.name) {
	case "candle":
	    console.log("CANDLE");
	    //ctx.thing.setVisible(false);
	    //gameState.screen.setScene("road");
	    ctx.screen.showMessage(
		"A candle for evening work. I won't need it.");
	    break;

	case "cupboard":
	    if (ctx.thing.state === "open") 
		ctx.thing.setState("closed");
	    else
		ctx.thing.setState("open");
	    break;

	case "door":
	    if (ctx.thing.state === "open") 
		ctx.thing.setState("closed");
	    else
		ctx.thing.setState("open");
	    break;

	}
    }
}

function RoadLogic(logic)
{
    this.logic = logic;

    this.initScene = function(scene) {
    }

    this.handleClicked = function(ctx) {
    }
}

