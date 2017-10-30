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

var Utils = require("./utils");

/*********/
/* State */
/*********/

class State
{
    constructor() {
        this.checkedDoor = false;
        this.hasRedKey = false;
        this.bush1Moved = false;
        this.bush2Moved = false;
        this.seenHole1 = false;
        this.seenHole2 = false;
    }
}

/*********/
/* Logic */
/*********/

class Logic
{
    constructor() {
	// Scene specific logic stored by name
        this.state = new State();
	this.sceneLogic = {
	    "intro" : new IntroLogic(),
	    "road" : new RoadLogic(),
	    "closet" : new ClosetLogic(),
	    "cave" : new CaveLogic()
	};
    }

    makeContext(args) {
        return new LogicContext(this.state, args);
    }

    initScene(ctx) {
	this._handleLogicEvent("initScene", ctx);
    }

    uninitScene(ctx) {
	this._handleLogicEvent("uninitScene", ctx);
    }

    enterScene(ctx) {
	this._handleLogicEvent("enterScene", ctx);
    }

    leaveScene(ctx) {
	this._handleLogicEvent("leaveScene", ctx);
    }

    handleClicked(ctx) {
	this._handleLogicEvent("handleClicked", ctx);
    }

    _handleLogicEvent(event, ctx) {
	var logic = this.sceneLogic[ctx.scene.name];
	if (logic && logic[event]) logic[event](ctx);
    }

    handleDragStart(ctx) {
    }

    handleDrag(ctx) {
    }

    handleDragStop(ctx) {
    }

}

/****************/
/* LogicContext */
/****************/

function LogicContext(state, args)
{
    this.state = state;
    this.screen = null;
    this.scene = null;
    this.thing = null;
    this.sprite = null;
    if (args) {
        this.screen = args.screen;
        this.scene = args.scene;
        this.thing = args.thing;
        this.sprite = args.sprite;
    }
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
    return this.scene.timers.start(callback, delay);
}

LogicContext.prototype.addUpdate = function(callback)
{
    return this.screen.addUpdate(callback);
}

/***************/
/* Scene Logic */
/***************/

/* Logic classes for the various scenes in the game */

class IntroLogic
{
    constructor() {
    }

    initScene(ctx) {
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

    leaveScene(ctx) {
    }

    handleClicked(ctx) {
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
	    }
	    break;

	case "outside":
	    ctx.screen.changeScene("road");
	    break;
	}
    }
}

class RoadLogic
{
    constructor() {
    }

    initScene(ctx) {
	ctx.getThing("bush1").setVisible(!ctx.state.bush1Moved);
	ctx.getThing("bush2").setVisible(!ctx.state.bush2Moved);

        this.updateCrow(ctx);
        this.onCameraCallback = ctx.screen.onCamera(ctx => {
            this.updateCrow(ctx);
        });
    }

    leaveScene(ctx)
    {
        this.onCameraCallback.remove();
    }

    updateCrow(ctx)
    {
        if (ctx.scene.cameraX > -0.1) {
            this.crowFacing = "right";
        } else if (ctx.scene.cameraX < -0.2) {
            this.crowFacing = "left";
        }
        ctx.getThing("crow").setState(this.crowFacing);
    }

    handleClicked(ctx) {
	switch(ctx.thing.name) 
	{
	case "bush1":
	    ctx.state.bush1Moved = true;
	    ctx.thing.setVisible(false);
	    if (ctx.state.bush2Moved) {
		ctx.showMessage("You clear away some brush revealing a cave!")
	    } else {
		ctx.showMessage("You clear away some brush. There's something behind it!")
	    }
	    break;

	case "bush2":
	    ctx.state.bush2Moved = true;
	    ctx.thing.setVisible(false);
	    if (ctx.state.bush1Moved) {
		ctx.showMessage("You clear away some brush revealing a cave!")
	    } else {
		ctx.showMessage("You clear away some brush. There's something behind it!")
	    }
	    break;

	case "cave":
	    if (!ctx.state.bush1Moved || !ctx.state.bush2Moved) {
		ctx.showMessage("I must clear the way first.");
	    } else {
		ctx.screen.changeScene("cave");
	    }
	    break;

        case "house":
            if (ctx.state.hasRedKey) {
	        ctx.screen.changeScene("building", {cameraX: -1});
            } else if (ctx.state.checkedDoor) {
                ctx.showMessage("Maybe I can find a key, or another way in.");
            } else {
                ctx.showMessage("There's no answer and the door's locked.");
                ctx.state.checkedDoor = true;
            }
            break;

        case "crow":
            ctx.showMessage("A crow is watching.");
            break;
	}
    }
}

class ClosetLogic
{
    constructor() {
    }

    initScene(ctx) {
	this.timer = 0;
	this.state = "start";

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

        this.onCameraCallback = ctx.screen.onCamera(function(ctx) {
            if (ctx.scene.cameraX > 1.75) {
                console.log("CAMERA: " + ctx.scene.cameraX);
            }
        });
    }

    leaveScene(ctx)
    {
        this.onCameraCallback.remove();
    }

    handleClicked(ctx) {
	switch(ctx.thing.name) 
	{
	}
    }
}

class CaveLogic
{
    constructor() {
    }

    initScene(ctx)
    {
	ctx.startTimer(() => {
	    console.log("DRIP");
	    return true;
	}, 3000);
        ctx.getThing("hole2").setState("empty");
        ctx.getThing("key").setVisible(!ctx.state.hasRedKey);
        ctx.getThing("shape").getSprite().x = -24;
    }

    handleClicked(ctx) 
    {
	switch(ctx.thing.name) 
	{
        case "ladder":
	    ctx.screen.changeScene("road", {cameraX: 1});
            break;

        case "key":
            ctx.getThing("key").setVisible(false);
            ctx.state.hasRedKey = true;
	    ctx.showMessage("A small key. Odd it was left here.");
            break;

        case "hole1":
            //ctx.showMessage("You see only darkness.");
            if (ctx.state.seenHole1) {
                ctx.showMessage("There is only darkness.");
                break;
            }
            ctx.state.seenHole1 = true;
            ctx.getThing("hole1").setVisible(false);
            ctx.addUpdate(dt => {
                let sprite = ctx.getThing("shape").getSprite();
                sprite.x += 40*dt;
                if (sprite.x > 16) {
                    ctx.getThing("hole1").setVisible(true);
                    ctx.showMessage("AHHH! What even was that?");
                    return false;
                }
                return true;
            });
            break;

        case "hole2":
            //if (ctx.state.seenHole2) {
            ctx.showMessage("There is only darkness.");
            break;
            //}
            //ctx.state.seenHole2 = true;
            /*
            ctx.addUpdate(Utils.chainUpdates(
                Utils.delayUpdate(0.5),
                (dt) => {
                    ctx.getThing("hole2").setState("eyes");
                },
                Utils.delayUpdate(0.2),
                (dt) => {
                    ctx.getThing("hole2").setState("empty");
                },
                Utils.delayUpdate(0.5),
                (dt) => {
                    ctx.getThing("hole2").setState("eyes");
                },
                Utils.delayUpdate(0.5),
                (dt) => {
                    ctx.getThing("hole2").setState("empty");
                }
            ));*/
            break;
	}
    }
}

module.exports = {
    Logic: Logic,
    LogicContext: LogicContext,
    State: State
};
