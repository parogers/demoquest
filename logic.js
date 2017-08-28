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

Logic.prototype.initScene = function(ctx)
{
    var logic = this.sceneLogic[ctx.scene.name];
    if (logic && logic.initScene) logic.initScene(ctx);
}

Logic.prototype.leaveScene = function(ctx)
{
    var logic = this.sceneLogic[ctx.scene.name];
    if (logic && logic.leaveScene) logic.leaveScene(ctx);
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

/****************/
/* LogicContext */
/****************/

function LogicContext(screen, scene, thing, sprite)
{
    this.screen = screen;
    this.scene = scene;
    this.thing = thing;
    this.sprite = sprite;
}

LogicContext.prototype.getThing = function(name)
{
    return this.scene.getThing(name);
}

LogicContext.prototype.showMessage = function(msg, options)
{
    this.screen.showMessage(msg, options);
}

LogicContext.prototype.startTimer = function(callback, delay)
{
    return this.screen.startTimer(callback, delay);
}

/***************/
/* Scene Logic */
/***************/

/* Logic classes for the various scenes in the game */

function IntroLogic(logic)
{
    this.logic = logic;

    this.initScene = function(ctx) {
	ctx.getThing("door").setState("closed");
	ctx.getThing("cupboard").setState("closed");

	ctx.startTimer(function(ctx) {
	    //ctx.getThing("door").setState("open");
	    //ctx.showMessage("The door opens!");
	    console.log("Tick");
	}, 3000);

	return;

	var sprite = ctx.getThing("darkness").setVisible(false);
	sprite.alpha = 0;

	var timer = ctx.startTimer(1000, (
	    function(ctx) {
		sprite.alpha = Math.max(sprite.alpha+0.05, 1);
		if (sprite.alpha >= 1) {
		    
		}
	    }
	).bind(this));

	timer.cancel();
	timer.pause();
	timer.resume();
    }

    this.leaveScene = function(ctx) {
    }

    this.handleClicked = function(ctx) {
	switch(ctx.thing.name) 
	{
	case "candle":
	    console.log("CANDLE");
	    //ctx.thing.setVisible(false);
	    //gameState.screen.setScene("road");
	    ctx.showMessage(
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

    this.initScene = function(ctx) {
    }

    this.handleClicked = function(ctx) {
    }
}

