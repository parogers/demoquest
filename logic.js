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
	"road" : new RoadLogic(this),
	"closet" : new ClosetLogic(this)
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
    var thing = this.scene.getThing(name);
    if (!thing) {
	console.log("ERROR: can't find thing: " + name);
    }
    return thing;
}

LogicContext.prototype.showMessage = function(msg, options)
{
    this.screen.showMessage(msg, options);
}

LogicContext.prototype.startTimer = function(callback, delay)
{
    return this.screen.startTimer(callback, delay);
}

LogicContext.prototype.addUpdate = function(callback)
{
    return this.screen.addUpdate(callback);
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

	var timer = ctx.startTimer(1000, ctx => {
	    sprite.alpha = Math.max(sprite.alpha+0.05, 1);
	    if (sprite.alpha >= 1) {
		
	    }
	});

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
	    ctx.showMessage("A candle for evening work. I won't need it.");
	    ctx.showMessage("Or maybe I will!");
	    break;

	case "cupboard":
	    if (ctx.thing.state === "open") 
		ctx.thing.setState("closed");
	    else
		ctx.thing.setState("open");
	    break;

	case "door":
	    if (ctx.thing.state === "open") {
		ctx.thing.setState("closed");
	    } else {
		ctx.thing.setState("open");
		ctx.screen.changeScene("road");
	    }
	    break;

	}
    }
}

function RoadLogic(logic)
{
    this.logic = logic;
    this.bush1Moved = false;
    this.bush2Moved = false;

    this.initScene = function(ctx) {
	ctx.getThing("bush1").setVisible(!this.bush1Moved);
	ctx.getThing("bush2").setVisible(!this.bush2Moved);
    }

    this.handleClicked = function(ctx) {
	switch(ctx.thing.name) 
	{
	case "bush1":
	    this.bush1Moved = true;
	    ctx.thing.setVisible(false);
	    if (this.bush2Moved) {
		ctx.showMessage("You clear away some brush revealing a cave!")
	    } else {
		ctx.showMessage("You clear away some brush. You see something behind it!")
	    }
	    break;

	case "bush2":
	    this.bush2Moved = true;
	    ctx.thing.setVisible(false);
	    if (this.bush1Moved) {
		ctx.showMessage("You clear away some brush revealing a cave!")
	    } else {
		ctx.showMessage("You clear away some brush. You see something behind it!")
	    }
	    break;

	case "cave":
	    if (!this.bush1Moved || !this.bush2Moved) {
		ctx.showMessage("I must clear the way first.");
	    } else {
		ctx.screen.changeScene("cave");
	    }
	    break;
	}
    }
}

function ClosetLogic(logic)
{
    this.logic = logic;

    this.initScene = function(ctx) {
	this.timer = 0;
	this.state = "start";

	ctx.getThing("trigger").onVisible(function(ctx) {
	    console.log("VISIBLE!");
	});

	ctx.addUpdate(dt => {
	    if (this.timer > 0) {
		this.timer -= dt;
		return true;
	    }
	    switch(this.state) {
	    case "start":
		// Wait for the scene to fade in a bit
		this.state = "opening";
		this.timer = 1.5;
		//this.offset = 0;
		break;
	    case "opening":
		// Opening the crack
		var sprite = ctx.getThing("crack").getSprite();
		var stop = ctx.getThing("darkright").getSprite();
		var thing = ctx.getThing("crack");
		//this.offset += dt;
		//sprite.x += 10*dt*(Math.sin(this.offset/2)**2);
		sprite.x += 10*dt;
		if (sprite.x > stop.x) {
		    sprite.visible = false;
		    this.state = "brighter";
		    this.timer = 2;
		}
		break;
	    case "brighter":
		var sprite1 = ctx.getThing("darkright").getSprite();
		var sprite2 = ctx.getThing("darkleft").getSprite();
		sprite1.alpha -= 0.2*dt;
		sprite2.alpha -= 0.2*dt;
		if (sprite1.alpha < 0) {
		    sprite1.visible = false;
		    sprite2.visible = false;
		    return false;
		}
		break;
	    }
	    return true;
	});
    }

    this.handleClicked = function(ctx) {
	switch(ctx.thing.name) 
	{
	}
    }
}

module.exports = {
    Logic: Logic,
    LogicContext: LogicContext
};
