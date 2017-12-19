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
var Audio = require("./audio");

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
	    "ride" : new RideLogic(),
	    "road" : new RoadLogic(),
	    "closet" : new ClosetLogic(),
	    "building" : new BuildingLogic(),
	    "cave" : new CaveLogic(),
	    "darkroad" : new DarkRoadLogic()
	};
    }

    startGame(ctx) {
	ctx.changeScene("closet", {cameraX: 0});
	//ctx.screen.redraw();
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

LogicContext.prototype.getLayer = function(name)
{
    var layer = this.scene.getLayer(name);
    if (!layer) {
	console.log("ERROR: can't find layer: " + name);
    }
    return layer;
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
    return this.screen.showMessage(msg, options);
}

LogicContext.prototype.startTimer = function(callback, delay)
{
    return this.scene.timers.start(callback, delay);
}

LogicContext.prototype.addUpdate = function()
{
    console.log("ADDUPDATE: " + arguments);
    return this.screen.addUpdate.apply(this.screen, arguments);
}

LogicContext.prototype.redraw = function()
{
    this.screen.redraw();
}

LogicContext.prototype.changeScene = function(name, args)
{
    if (this.screen.scene === null) {
	// Slow fade into the starting scene
	this.screen.setScene(name, args);
	this.screen.pause();
	var fader = new Utils.Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {dir: -1, duration: 2});
	fader.start(this.screen.stage);
	this.addUpdate(dt => {
	    if (!fader.update(dt)) {
		this.screen.resume();
		return false;
	    }
	    return true;
	});
	
    } else {
	// Fade out, switch scenes, then fade back in
	var fadeout = new Utils.Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {dir: 1, duration: 1});
	var fadein = new Utils.Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {dir: -1, duration: 1});
	//this.screen.stage.removeChild(fadeout.sprite);
	this.screen.pause();
	this.screen.enterCutscene();
	fadeout.start(this.screen.stage);
        this.addUpdate(
            dt => {
	        if (!fadeout.update(dt)) 
	        {
		    this.screen.setScene(name, args);
		    fadein.start(this.screen.stage);
                    return false;
                }
                return true
            },
            dt => {
		if (!fadein.update(dt)) {
		    this.screen.resume();
		    this.screen.leaveCutscene();
		    return false;
		}
		return true;
            }
	);
    }
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

	ctx.startTimer(() => {
	    if (Math.random() < 0.4) {
		Audio.play(Audio.Effects.Crickets, 0.1);
	    }
	    return true;
	}, 700);

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

	    Audio.play(Audio.Effects.Cupboard, 0.4);
	    break;

	case "door":
	    if (ctx.thing.state === "open") {
		ctx.thing.setState("closed");
		Audio.play(Audio.Effects.DoorClosing, 0.4);
	    } else {
		ctx.thing.setState("open");
		Audio.play(Audio.Effects.DoorOpening, 0.25);
	    }
	    break;

	case "outside":
	    ctx.changeScene("road");
	    break;
	}
    }
}

class RideLogic
{
    constructor() {
    }

    initScene(ctx) {
	let frame = 0;
	let fps = 10;
	ctx.startTimer(() => {
	    frame = (frame+1) % 4;
	    ctx.getThing("horse").setState("" + frame);
	    ctx.redraw();
	    return true;
	}, 1000/fps);
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
	case "player":
	    ctx.showMessage("It's been a long road here.");
	    break;

	case "bush1":
	    ctx.state.bush1Moved = true;
	    ctx.thing.setVisible(false);
	    if (ctx.state.bush2Moved) {
		ctx.showMessage("There's a cave behind these bushes!")
	    } else {
		ctx.showMessage("I've cleared away some brush. There's something behind it!")
	    }
	    break;

	case "bush2":
	    ctx.state.bush2Moved = true;
	    ctx.thing.setVisible(false);
	    if (ctx.state.bush1Moved) {
		ctx.showMessage("There's a cave behind these bushes!")
	    } else {
		ctx.showMessage("I've cleared away some brush. There's something behind it!")
	    }
	    break;

	case "cave":
	    if (!ctx.state.bush1Moved || !ctx.state.bush2Moved) {
		ctx.showMessage("I must clear the way first.");
	    } else {
		ctx.changeScene("cave");
	    }
	    break;

        case "house":
            if (ctx.state.checkedDoor) {
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
	this.States = {
	    // Player enters scene
	    None: 0,
	    // Monster visible outside
	    MonsterVisible: 1,
	    // Moving the camera to centre on the monster
	    CentreCamera: 2,
	    // Left tentacle visible
	    LeftTentacle: 3,
	    // Right tentacle visible
	    RightTentacle: 4,
	    // Closet doors fully open
	    DoorsOpen: 5
	};
	this.state = this.States.None;
    }

    initScene(ctx)
    {
	ctx.getThing("monster").setVisible(false);
	ctx.getThing("tent1").setVisible(false);
	ctx.getThing("tent2").setVisible(false);

	ctx.screen.enterCutscene();
	let dialog = ctx.showMessage("Am I safe in here???");
	let closedCB = dialog.onClosed(() => {
	    closedCB.remove();
	    this.fadeInScene(ctx);
	});

        ctx.screen.onCamera(ctx => {
	    if (this.state === this.States.MonsterVisible &&
		ctx.scene.cameraX > -0.35 && ctx.scene.cameraX < 0.35)
	    {
		this.changeState(ctx, this.States.CentreCamera);
	    }
	    if (this.state === this.States.None && 
		(ctx.scene.cameraX > 0.75 || ctx.scene.cameraX < -0.75))
	    {
		this.changeState(ctx, this.States.MonsterVisible);
            }
        });
    }

    leaveScene(ctx)
    {
        this.onCameraCallback.remove();
    }

    handleClicked(ctx) {
    }

    fadeInScene(ctx)
    {
	ctx.addUpdate(
	    Utils.delayUpdate(1.5),
	    dt => {
		// Opening the crack
		var sprite = ctx.getThing("crack").getSprite();
		var stop = ctx.getThing("darkright").getSprite();
		var thing = ctx.getThing("crack");

		//this.offset += dt;
		//sprite.x += 10*dt*(Math.sin(this.offset/2)**2);
		sprite.x += 8*dt;
		if (sprite.x > stop.x) {
		    sprite.visible = false;
		    ctx.screen.leaveCutscene();
		    return false;
		}
		return true;
	    },
	    dt => {
		var sprite1 = ctx.getThing("darkright").getSprite();
		var sprite2 = ctx.getThing("darkleft").getSprite();
		sprite1.alpha -= 0.30*dt;
		sprite2.alpha -= 0.30*dt;
		if (sprite1.alpha < 0) {
		    sprite1.visible = false;
		    sprite2.visible = false;
		    return false;
		}
		return true;
	    }
	);
    }

    changeState(ctx, state)
    {
	console.log("STATE: " + state);
	this.state = state;
	switch(state) {
	case this.States.MonsterVisible:
	    // Show the monster now
	    let monster = ctx.getThing("monster");
	    if (!monster.isVisible()) 
	    {
		let frame = 0;
		ctx.startTimer(() => {
		    frame = (frame+1) % 2;
		    monster.setState("" + frame);
		    ctx.redraw();
		    return true;
		}, 1000/5.0);
	    }
	    break;

	case this.States.CentreCamera:
	    // Slowly pan the camera to X=0
	    ctx.screen.enterCutscene();
	    ctx.addUpdate(dt => {
		let speed = 0.6;
		let newX = ctx.scene.cameraX;
		newX -= Math.sign(ctx.scene.cameraX)*speed*dt;
		if (newX * ctx.scene.cameraX <= 0) {
		    // Done panning
		    ctx.scene.setCameraPos(0);
		    this.changeState(ctx, this.States.LeftTentacle);
		    return false;
		}
		ctx.scene.setCameraPos(newX);
		return true;
	    });
	    break;

	case this.States.LeftTentacle:
	    ctx.startTimer(() => {
		ctx.getThing("tent1").setVisible(true);
		this.changeState(ctx, this.States.RightTentacle);
		return false;
	    }, 750);
	    break;

	case this.States.RightTentacle:
	    ctx.startTimer(() => {
		ctx.getThing("tent2").setVisible(true);
		this.changeState(ctx, this.States.DoorsOpen);
		return false;
	    }, 750);
	    break;

	case this.States.DoorsOpen:
	    ctx.startTimer(() => {
		let counter = 0;
		ctx.addUpdate(dt => {
		    let speed = 20;
		    ctx.getThing("doorleft").getSprite().x -= speed*dt;
		    ctx.getThing("doorright").getSprite().x += speed*dt;
		    ctx.getThing("tent1").getSprite().x -= speed*dt;
		    ctx.getThing("tent2").getSprite().x += speed*dt;
		    counter += speed*dt;
		    if (counter > 5) return false;		    
		});
		return false;
	    }, 750);
	    break;

	}
    }
}

class DarkRoadLogic
{
    initScene(ctx) {
    }

    enterScene(ctx) {
	ctx.showMessage("Sunset. How long was I down there?");
    }

    handleClicked(ctx) {
	switch(ctx.thing.name) {
	case "player":
	    ctx.showMessage("I'm glad I brought a light.");
	    break;

	case "cave":
	    ctx.showMessage("No. I don't want to go back down there.");
	    break;

	case "house":
	    ctx.changeScene("building", {cameraX: -1});
	    break;
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
	    Audio.play(Audio.Effects.Drip, 0.5);
	    return true;
	}, 5000);
        ctx.getThing("hole2").setState("empty");
        ctx.getThing("key").setVisible(!ctx.state.hasRedKey);
        ctx.getThing("shape").getSprite().x = -24;
    }

    handleClicked(ctx) 
    {
	switch(ctx.thing.name) 
	{
        case "ladder":
	    if (ctx.state.hasRedKey) {
		ctx.changeScene("darkroad", {cameraX: 1});
	    } else {
		ctx.changeScene("road", {cameraX: 1});
	    }
            break;

        case "key":
            ctx.getThing("key").setVisible(false);
            ctx.state.hasRedKey = true;
	    ctx.showMessage("A small key. Odd it was left here.");
            break;

        case "hole1":
            if (ctx.state.seenHole1) {
                ctx.showMessage("There is only darkness.");
                break;
            }
            ctx.state.seenHole1 = true;
            ctx.getThing("hole1").setVisible(false);
	    ctx.startTimer(() => {
		Audio.play(Audio.Effects.ShapeSound);
	    }, 250);
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
            ctx.addUpdate(
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
            );*/
            break;
	}
    }
}

class BuildingLogic
{
    constructor() {
	this.States = {
	    // Default state
	    None: 0,
	    // Monster waiting behind door. Triggered by checking closet
	    MonsterWaiting: 1,
	    // Front door is closed, player must retreat to closet
	    PlayerMustHide: 2
	};

	this.monsterState = this.States.None;
    }

    initScene(ctx)
    {
        ctx.getThing("door").setState("open");
        ctx.getThing("cdoor").setState("closed");
        ctx.getThing("light").setState("off");
	ctx.getThing("candle").invisibleToClicks = true;
	ctx.getThing("darkness").invisibleToClicks = true;
	ctx.getThing("closet").setState("dark");
	ctx.getThing("monster").setVisible(false);
	this.monsterState = this.States.MonsterWaiting;
        ctx.getThing("door").setState("closed");
    }

    handleClicked(ctx) 
    {
	switch(ctx.thing.name) 
	{
	case "door":
	    if (this.monsterState === this.States.MonsterWaiting) {
		let fps = 5;
		let frame = 0;
		ctx.getThing("door").setState("open");
		ctx.getThing("monster").setState("0");
		ctx.startTimer(() => {
		    if (this.monsterState === this.States.PlayerMustHide) {
			return false;
		    }
		    frame = (frame+1) % 2;
		    ctx.getThing("monster").setState("" + frame);
		    ctx.redraw();
		    return true;
		}, 1000.0/fps);

		ctx.startTimer(() => {
		    this.monsterState = this.States.PlayerMustHide;
		    ctx.getThing("door").setState("closed");
		    ctx.showMessage("WHAT IS THAT??!? I've got to hide!");
		}, 1000);

	    } else if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("No! I've got to hide!");

	    } else if (ctx.thing.state === "open") {
		ctx.thing.setState("closed");
		Audio.play(Audio.Effects.DoorClosing, 0.4);

	    } else {
		ctx.thing.setState("open");
		Audio.play(Audio.Effects.DoorOpening, 0.25);
	    }
	    break;

	case "cdoor":
	    if (ctx.thing.state === "open") {
		ctx.thing.setState("closed");
		//Audio.play(Audio.Effects.DoorClosing, 0.4);
	    } else {
		ctx.thing.setState("open");
		//Audio.play(Audio.Effects.DoorOpening, 0.25);
	    }
	    break;

	case "closet":
	    if (this.monsterState === this.States.PlayerMustHide) {
		ctx.changeScene("closet", {cameraX: 0});
	    } else if (ctx.thing.state === "dark") {
		ctx.showMessage("Even with the lamp it's too dark to see anything in there.");
		ctx.showMessage("...the blood... I need to find a light.");
	    } else {
		ctx.showMessage("It's filled with clothing and random junk. That's it. It's just a closet. Why the blood?");
		ctx.getThing("door").setState("closed");
		this.monsterState = this.State.MonsterWaiting;
	    }
	    break;

	case "clock":
	    if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("I need to find a place to hide!");
	    } else {
		ctx.showMessage("It stopped years ago.");
	    }
	    break;

	case "outside":
	    if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("I need to find a place to hide!");
	    } else {
		ctx.showMessage("I should look around first.");
	    }
	    break;

	case "bookshelf":
	    if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("I need to find a place to hide!");
	    } else {
		ctx.showMessage("Everything is covered in grit and dust. Does anybody still live here?");
	    }
	    break;

	case "clothes":
	    if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("I need to find a place to hide!");
	    } else {
		ctx.showMessage("Dirty sheets... this place is a mess.")
	    }
	    break;

	case "bloodarea":
	    if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("I need to find a place to hide!");
	    } else {
		ctx.showMessage("Blood... what happened here?");
	    }
	    break;

	case "light":
	    if (ctx.thing.state === "off") {
		ctx.thing.setState("on");
		ctx.getThing("darkness").setVisible(false);
		ctx.getThing("closet").setState("light");
		ctx.addUpdate(
                    Utils.delayUpdate(0.4),
		    (dt) => {
			let sprite = ctx.getThing("candle").getSprite();
			sprite.y += 20*dt;
			if (sprite.y > 0) {
			    ctx.getThing("candle").setVisible(false);
			    return false;
			}
			return true;
		    }
		);
	    } else if (this.monsterState === this.States.PlayerMustHide) {
		ctx.showMessage("I need to find a place to hide!");
	    } else {
		ctx.showMessage("...I'd prefer the lights stay on.");
	    }
	    break;
	}
    }
}

module.exports = {
    Logic: Logic,
    LogicContext: LogicContext,
    State: State
};
