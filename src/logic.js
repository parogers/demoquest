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
var Events = require("./events");
var Transition = require("./transition");

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
	this.hasCandle = false;
	this.hasWatch = false;
	this.hasLetter = false;
    }
}

/*********/
/* Logic */
/*********/

class GameLogic
{
    constructor() {
	// Scene specific logic stored by name
        this.gameState = new State();
	this.sceneLogic = {
	    "intro" : new IntroLogic(this.gameState),
	    "ride" : new RideLogic(this.gameState),
	    "road" : new RoadLogic(this.gameState),
	    "closet" : new ClosetLogic(this.gameState),
	    "building" : new BuildingLogic(this.gameState),
	    "cave" : new CaveLogic(this.gameState),
	    "darkroad" : new DarkRoadLogic(this.gameState),
	    "ending" : new EndingLogic(this.gameState)
	};
    }

    getSceneLogic(name) { return this.sceneLogic[name]; }

    startGame(screen) {
	//let trans = new Transition.FadeIn(screen, "closet", {cameraX: 0});
	//let trans = new Transition.FadeIn(screen, "building", {cameraX: -1});
	let trans = new Transition.FadeIn(screen, "intro", {cameraX: 0.12});
	trans.start();
    }
}

/****************/
/* LogicContext */
/****************/

function LogicContext(args)
{
    this.screen = null;
    this.scene = null;
    this.thing = null;
    if (args) {
        this.screen = args.screen;
        this.scene = args.scene;
        this.thing = args.thing;

	if (!this.screen) throw Error("LogicContext must include screen");
	if (!this.scene) throw Error("LogicContext must include scene");
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

LogicContext.prototype.addUpdate = function()
{
    return this.screen.addUpdate.apply(this.screen, arguments);
}

LogicContext.prototype.redraw = function()
{
    this.screen.redraw();
}

LogicContext.prototype.changeScene = function(name, args)
{
    if (this.screen.scene) {
	let trans = new Transition.FadeToScene(this.scene, name, args);
	trans.start();
    }
}

/*************/
/* BaseLogic */
/*************/

class BaseLogic 
{
    constructor(state) {
	this.timers = new Events.TimerList();
	this.gameState = state;
    }

    destroy() {
	this.timers.destroy();
	this.timers = null;
    }

    initScene(screen, scene) {
	this.ctx = new LogicContext({
            screen: screen,
            scene: scene
	});
    }

    uninitScene() {
	this.ctx = null;
    }

    enterScene() {
    }

    leaveScene() {
    }

    pause() {
	this.timers.pause();
    }

    resume() {
	this.timers.resume();
    }

    handleClicked(thing) {
    }
}

/***************/
/* Scene Logic */
/***************/

class CricketNoise
{
    constructor() {
	this.current = null;
	this.timeoutEvent = null;
	this.times = 0;
    }

    play(delay) {
	// Schedule the first chirp
	if (!this.current) {
	    this._scheduleNext(delay);
	}
    }

    stop() {
	if (this.current !== null) {
	    // Fully stop the sound playing again. Note calling 'pause' here
	    // then 'play' again later doubles the playback speed. (BUG)
	    try {
		this.current.soundNode.stop(0);
	    } catch(e) {
		console.log('failure while stopping sound playback');
	    }
	    this.current = null;
	}
	if (this.timeoutEvent !== null) {
	    console.log("CLEAR TIMEOUT");
	    clearTimeout(this.timeoutEvent);
	    this.timeoutEvent = null;
	}
    }

    isStopped() { return this.current === null; }

    /* Schedules the next cricket chirp to happen after a given delay */
    _scheduleNext(delay) {
	this.timeoutEvent = setTimeout(() => {
	    let snd = Audio.play(Audio.Effects.Crickets, 0.1);
	    snd.soundNode.onended = () => {
		if (this.isStopped()) {
		    return;
		}
		// Schedule the next chirp to happen either immediately (with
		// a longer chirp-chain meaning a decreasing probability of
		// that happening), or after a period of silence determined 
		// by the length of the (now finished) chirp chain.
		this.times++;
		if (Math.random() < Math.pow(1/this.times, 0.9)) {
		    delay = 1;
		} else {
		    delay = (1000+500*Math.random())*this.times;
		    this.times = 0;
		}
		this._scheduleNext(delay);
	    };
	    this.current = snd;
	}, delay);
    }
}

/* Logic classes for the various scenes in the game */
class IntroLogic extends BaseLogic
{
    constructor(state) {
	super(state);
    }

    initScene(screen, scene) {
	super.initScene(screen, scene);
	this.ctx.getThing("door").setState("closed");
	this.ctx.getThing("cupboard").setState("closed");
    }

    enterScene() {
	this.crickets = new CricketNoise();
	this.crickets.play(1000);

	this.ctx.screen.enterCutscene();

	// Opening sequence
	this.timers.wait(3500).then(result => {
	    let dialog = this.ctx.showMessage(
		"It's getting late. I should prepare to leave.");
	    return dialog.closed();

	}).then(result => {
	    return this.ctx.screen.updater(dt => {
		let newx = this.ctx.scene.cameraX - 0.55*dt;
		this.ctx.scene.setCameraPos(newx);
		if (this.ctx.scene.cameraX <= -1) {
		    return false;
		}
		return true;
	    });

	}).then(result => {
	    this.ctx.screen.leaveCutscene();
	    let dialog = this.ctx.showMessage(
		"Alright. I must collect my things.");
	    return dialog.closed();
	});
    }

    leaveScene() {
	this.timers.clear();
	this.crickets.stop();
	this.crickets = null;
    }

    handleClicked(thing) {
	let dialog = null;
	switch(thing.name) 
	{
	case "candle":
	    this.ctx.showMessage("A candle for evening work. I won't need it.");
	    dialog = this.ctx.showMessage("Or maybe I will. I better take it.");
	    dialog.closed().then(() => {
		thing.setVisible(false);
		this.gameState.hasCandle = true;
	    });

	    break;

	case "suitcase":
	    this.ctx.showMessage("Packed belongings for the journey. Do I have everything?");
	    break;

	case "letter":
	    dialog = this.ctx.showMessage("A letter from my grandfather. It doesn't say very much, but I know I need to see him. I'll take it.");
	    dialog.closed().then(() => {
		thing.setVisible(false);
		this.gameState.hasLetter = true;
	    });
	    break;

	case "pocketwatch":
	    dialog = this.ctx.showMessage("My grandfather's pocket watch. It came with the letter. I'll take it.");
	    dialog.closed().then(() => {
		thing.setVisible(false);
		this.gameState.hasWatch = true;
	    });
	    break;

	case "cupboard":
	    if (thing.state === "open") 
		thing.setState("closed");
	    else
		thing.setState("open");

	    Audio.play(Audio.Effects.Cupboard, 0.4);
	    break;

	case "door":
	    if (thing.state === "open") {
		thing.setState("closed");
		Audio.play(Audio.Effects.DoorClosing, 0.4);
	    } else {
		thing.setState("open");
		Audio.play(Audio.Effects.DoorOpening, 0.25);
	    }
	    break;

	case "outside":
	    this.ctx.changeScene("road");
	    break;
	}
    }
}

class RideLogic extends BaseLogic
{
    constructor(state) {
	super(state);
    }

    initScene(screen, scene) {
	super.initScene(screen, scene);

	let frame = 0;
	let fps = 10;
	this.timers.start(() => {
	    frame = (frame+1) % 4;
	    this.ctx.getThing("horse").setState("" + frame);
	    this.ctx.redraw();
	    return true;
	}, 1000/fps);
    }
}

class RoadLogic extends BaseLogic
{
    constructor(state) {
	super(state);
    }

    initScene(screen, scene) {
	super.initScene(screen, scene);

	this.ctx.getThing("bush1").setVisible(!this.gameState.bush1Moved);
	this.ctx.getThing("bush2").setVisible(!this.gameState.bush2Moved);
        this.updateCrow();
    }

    enterScene() {
        this.onCameraCallback = this.ctx.screen.onCamera(() => {
            this.updateCrow();
        });
    }

    leaveScene()
    {
        this.onCameraCallback.remove();
    }

    updateCrow()
    {
        if (this.ctx.scene.cameraX > -0.1) {
            this.crowFacing = "right";
        } else if (this.ctx.scene.cameraX < -0.2) {
            this.crowFacing = "left";
        }
        this.ctx.getThing("crow").setState(this.crowFacing);
    }

    handleClicked(thing) {
	switch(thing.name) 
	{
	case "player":
	    this.ctx.showMessage("It's been a long road here.");
	    break;

	case "bush1":
	    this.gameState.bush1Moved = true;
	    thing.setVisible(false);
	    if (this.gameState.bush2Moved) {
		this.ctx.showMessage("There's a cave behind these bushes!")
	    } else {
		this.ctx.showMessage("I've cleared away some brush. There's something behind it!")
	    }
	    break;

	case "bush2":
	    this.gameState.bush2Moved = true;
	    thing.setVisible(false);
	    if (this.gameState.bush1Moved) {
		this.ctx.showMessage("There's a cave behind these bushes!")
	    } else {
		this.ctx.showMessage("I've cleared away some brush. There's something behind it!")
	    }
	    break;

	case "cave":
	    if (!this.gameState.bush1Moved || !this.gameState.bush2Moved) {
		this.ctx.showMessage("I must clear the way first.");
	    } else {
		this.ctx.changeScene("cave");
	    }
	    break;

        case "house":
            if (this.gameState.checkedDoor) {
                this.ctx.showMessage("Maybe I can find a key, or another way in.");
            } else {
                this.ctx.showMessage("There's no answer and the door's locked.");
                this.gameState.checkedDoor = true;
            }
            break;

        case "crow":
            this.ctx.showMessage("A crow is watching.");
            break;
	}
    }
}

class ClosetLogic extends BaseLogic
{
    constructor(state) {
	super(state);
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
	    DoorsOpen: 5,
	    // Scene is fading out
	    FadeOut: 6
	};
	this.state = this.States.None;
    }

    initScene(screen, scene)
    {
	super.initScene(screen, scene);

	this.ctx.getThing("monster").setVisible(false);
	this.ctx.getThing("tent1").setVisible(false);
	this.ctx.getThing("tent2").setVisible(false);

	this.ctx.screen.enterCutscene();
	let dialog = this.ctx.showMessage("Am I safe in here???");
	dialog.closed().then(result => {
	    return this.timers.wait(1500);

	}).then(result => {
	    return this.ctx.screen.updater(dt => {
		// Opening the crack
		var sprite = this.ctx.getThing("crack").getSprite();
		var stop = this.ctx.getThing("darkright").getSprite();
		var thing = this.ctx.getThing("crack");

		//this.offset += dt;
		//sprite.x += 10*dt*(Math.sin(this.offset/2)**2);
		sprite.x += 8*dt;
		if (sprite.x > stop.x) {
		    sprite.visible = false;
		    this.ctx.screen.leaveCutscene();
		    return false;
		}
		return true;
	    });

	}).then(result => {
	    this.ctx.screen.updater(dt => {
		// Player's eyes adjusting to the darkness
		var sprite1 = this.ctx.getThing("darkright").getSprite();
		var sprite2 = this.ctx.getThing("darkleft").getSprite();
		sprite1.alpha -= 0.30*dt;
		sprite2.alpha -= 0.30*dt;
		if (sprite1.alpha < 0) {
		    sprite1.visible = false;
		    sprite2.visible = false;
		    return false;
		}
		return true;
	    })
	});

	this.breathingTimer = this.timers.start(() => {
	    Audio.play(Audio.Effects.PurringFast, 0.4);
	    return true;
	}, 2200);

        this.onCameraCallback = this.ctx.screen.onCamera(() => {
	    if (this.state === this.States.MonsterVisible &&
		this.ctx.scene.cameraX < 0.55)
	    {
		this.breathingTimer.cancel();
		this.changeState(this.States.CentreCamera);
	    }
	    if (this.state === this.States.None && 
		this.ctx.scene.cameraX > 0.75)
	    {
		this.changeState(this.States.MonsterVisible);
            }
        });
    }

    leaveScene()
    {
        this.onCameraCallback.remove();
    }

    handleClicked(thing) {
    }

    changeState(state)
    {
	this.state = state;
	switch(state) {
	case this.States.MonsterVisible:
	    // Show the monster now
	    let monster = this.ctx.getThing("monster");
	    if (!monster.isVisible()) 
	    {
		let frame = 0;
		this.timers.start(() => {
		    frame = (frame+1) % 2;
		    monster.setState("" + frame);
		    this.ctx.redraw();
		    return true;
		}, 1000/5.0);
	    }
	    break;

	case this.States.CentreCamera:
	    // Slowly pan the camera to X=0
	    this.ctx.screen.enterCutscene();
	    this.ctx.addUpdate(dt => {
		let speed = 0.6;
		let newX = this.ctx.scene.cameraX;
		newX -= Math.sign(this.ctx.scene.cameraX)*speed*dt;
		if (newX * this.ctx.scene.cameraX <= 0) {
		    // Done panning
		    this.ctx.scene.setCameraPos(0);
		    this.changeState(this.States.LeftTentacle);
		    return false;
		}
		this.ctx.scene.setCameraPos(newX);
		return true;
	    });
	    break;

	case this.States.LeftTentacle:
	    this.timers.start(() => {
		this.ctx.getThing("tent1").setVisible(true);
		this.changeState(this.States.RightTentacle);
		Audio.play(Audio.Effects.Bang, 0.7);
		return false;
	    }, 750);
	    break;

	case this.States.RightTentacle:
	    this.timers.start(() => {
		this.ctx.getThing("tent2").setVisible(true);
		this.changeState(this.States.DoorsOpen);
		Audio.play(Audio.Effects.Bang, 0.7);
		this.timers.start(() => {
		    Audio.play(Audio.Effects.ShapeSound2, 0.7);
		}, 500);
		return false;
	    }, 750);
	    break;

	case this.States.DoorsOpen:
	    this.timers.start(() => {
		let counter = 0;
		this.ctx.addUpdate(dt => {
		    let speed = 20;
		    this.ctx.getThing("doorleft").getSprite().x -= speed*dt;
		    this.ctx.getThing("doorright").getSprite().x += speed*dt;
		    this.ctx.getThing("tent1").getSprite().x -= speed*dt;
		    this.ctx.getThing("tent2").getSprite().x += speed*dt;
		    counter += speed*dt;
		    if (counter > 5) {
			this.changeState(this.States.FadeOut);
			return false;
		    }
		});
		return false;
	    }, 750);
	    break;

	case this.States.FadeOut:
	    let trans = new Transition.FadeToScene(
		this.ctx.scene, "ending", 
		{
		    colour: "white",
		    pauseTime: 1.5
		});
	    trans.start();
	    break;
	}
    }
}

class DarkRoadLogic extends BaseLogic
{
    enterScene() {
	super.enterScene();
	this.ctx.showMessage("Sunset. How long was I down there?");
	this.crickets = new CricketNoise();
	this.crickets.play(1000);
    }

    leaveScene() {
	this.crickets.stop();
	this.crickets = null;
    }

    handleClicked(thing) {
	switch(thing.name) {
	case "player":
	    this.ctx.showMessage("I'm glad I brought a light.");
	    break;

	case "cave":
	    this.ctx.showMessage("No. I don't want to go back down there.");
	    break;

	case "house":
	    this.ctx.changeScene("building", {cameraX: -1});
	    break;
	}
    }
}

class CaveLogic extends BaseLogic
{
    constructor(state) {
	super(state);
    }

    initScene(screen, scene)
    {
	super.initScene(screen, scene);

	this.timers.start(() => {
	    Audio.play(Audio.Effects.Drip, 0.5);
	    return true;
	}, 4500);
        this.ctx.getThing("hole2").setState("empty");
        this.ctx.getThing("key").setVisible(!this.gameState.hasRedKey);
        this.ctx.getThing("shape").getSprite().x = -24;
    }

    handleClicked(thing) 
    {
	switch(thing.name) 
	{
        case "ladder":
	    if (this.gameState.hasRedKey) {
		this.ctx.changeScene("darkroad", {cameraX: 1});
	    } else {
		this.ctx.changeScene("road", {cameraX: 1});
	    }
            break;

        case "key":
            this.ctx.getThing("key").setVisible(false);
            this.gameState.hasRedKey = true;
	    this.ctx.showMessage("A small key. Odd it was left here.");
            break;

        case "hole1":
            if (this.gameState.seenHole1) {
                this.ctx.showMessage("There is only darkness.");
                break;
            }
            this.gameState.seenHole1 = true;
            this.ctx.getThing("hole1").setVisible(false);
	    this.timers.start(() => {
		Audio.play(Audio.Effects.ShapeSound);
	    }, 250);
            this.ctx.addUpdate(dt => {
                let sprite = this.ctx.getThing("shape").getSprite();
                sprite.x += 40*dt;
                if (sprite.x > 16) {
                    this.ctx.getThing("hole1").setVisible(true);
                    this.ctx.showMessage("AHHH! What even was that?");
                    return false;
                }
                return true;
            });
            break;

        case "hole2":
            //if (this.ctx.state.seenHole2) {
            this.ctx.showMessage("There is only darkness.");
            break;
	}
    }
}

class BuildingLogic extends BaseLogic
{
    constructor(state) {
	super(state);
	this.States = {
	    // Default state when the player enters the scene
	    None: 0,
	    // Monster waiting behind door. Triggered by checking closet
	    MonsterWaiting: 1,
	    // Front door is closed, player must retreat to closet
	    PlayerMustHide: 2
	};
	this.state = this.States.None;
    }

    initScene(screen, scene)
    {
	super.initScene(screen, scene);

        this.ctx.getThing("door").setState("open");
        this.ctx.getThing("cdoor").setState("closed");
        this.ctx.getThing("light").setState("off");
	this.ctx.getThing("candle").invisibleToClicks = true;
	this.ctx.getThing("darkness").invisibleToClicks = true;
	this.ctx.getThing("closet").setState("dark");
	this.ctx.getThing("monster").setVisible(false);
    }

/*    changeState(state) {
	this.state = state;
	switch(state) 
	{
	case this.States.MonsterWaiting:
	    break;

	case this.States.PlayerMustHide:
	    break;
	}
    }*/

    handleClicked(thing) 
    {
	switch(thing.name) 
	{
	case "door":
	    if (this.state === this.States.MonsterWaiting) {
		let fps = 5;
		let frame = 0;
		this.ctx.getThing("door").setState("open");
		this.ctx.getThing("monster").setState("0");
		this.timers.start(() => {
		    if (this.state === this.States.PlayerMustHide) {
			return false;
		    }
		    frame = (frame+1) % 2;
		    this.ctx.getThing("monster").setState("" + frame);
		    this.ctx.redraw();
		    return true;
		}, 1000.0/fps);

		this.breathingTimer.cancel();
		Audio.play(Audio.Effects.Monster);

		this.timers.start(() => {
		    this.state = this.States.PlayerMustHide;
		    this.ctx.getThing("door").setState("closed");
		    this.ctx.showMessage("WHAT IS THAT??!? I've got to hide!");
		}, 1000);

	    } else if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("No! I've got to hide!");

	    } else if (thing.state === "open") {
		thing.setState("closed");
		Audio.play(Audio.Effects.DoorClosing, 0.4);

	    } else {
		thing.setState("open");
		Audio.play(Audio.Effects.DoorOpening, 0.25);
	    }
	    break;

	case "cdoor":
	    if (thing.state === "open") {
		thing.setState("closed");
		//Audio.play(Audio.Effects.DoorClosing, 0.4);
	    } else {
		thing.setState("open");
		//Audio.play(Audio.Effects.DoorOpening, 0.25);
	    }
	    break;

	case "closet":
	    if (this.state === this.States.PlayerMustHide) {
		this.ctx.changeScene("closet", {cameraX: 0});
	    } else if (thing.state === "dark") {
		this.ctx.showMessage("Even with the lamp it's too dark to see anything in there.");
		this.ctx.showMessage("...the blood... I need to find a light.");
	    } else {
		this.ctx.getThing("door").setState("closed");
		let dialog = this.ctx.showMessage("It's filled with clothing and random junk. That's it. It's just a closet. Something is wrong...");
		if (this.state !== this.States.MonsterWaiting) {
		    dialog.closed().then(() => {
			this.breathingTimer = this.timers.start(() => {
			    Audio.play(Audio.Effects.Purring, 0.3);
			    return true;
			}, 2500, true);
		    });
		    this.state = this.States.MonsterWaiting;
		}
	    }
	    break;

	case "clock":
	    if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("I need to find a place to hide!");
	    } else {
		this.ctx.showMessage("It stopped years ago.");
	    }
	    break;

	case "outside":
	    if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("I need to find a place to hide!");
	    } else {
		this.ctx.showMessage("I should look around first.");
	    }
	    break;

	case "bookshelf":
	    if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("I need to find a place to hide!");
	    } else {
		this.ctx.showMessage("Everything is covered in grit and dust. Does anybody still live here?");
	    }
	    break;

	case "clothes":
	    if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("I need to find a place to hide!");
	    } else {
		this.ctx.showMessage("Dirty sheets... this place is a mess.")
	    }
	    break;

	case "bloodarea":
	    if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("I need to find a place to hide!");
	    } else {
		this.ctx.showMessage("Blood... what happened here?");
	    }
	    break;

	case "light":
	    if (thing.state === "off") {
		thing.setState("on");
		this.ctx.getThing("darkness").setVisible(false);
		this.ctx.getThing("closet").setState("light");
		this.timers.wait(400).then(result => {
		    return this.ctx.screen.updater(dt => {
			let sprite = this.ctx.getThing("candle").getSprite();
			sprite.y += 20*dt;
			if (sprite.y > 0) {
			    this.ctx.getThing("candle").setVisible(false);
			    return false;
			}
			return true;
		    });
		});
	    } else if (this.state === this.States.PlayerMustHide) {
		this.ctx.showMessage("I need to find a place to hide!");
	    } else {
		this.ctx.showMessage("...I'd prefer the lights stay on.");
	    }
	    break;
	}
    }
}

class EndingLogic extends BaseLogic
{
    constructor(state) {
	super(state);
    }

    enterScene() {
	super.enterScene();

	this.timers.start(() => {
	    this.ctx.showMessage("That's the demo. Thanks for playing!");
	}, 5000);
    }
}

module.exports = {
    GameLogic: GameLogic,
    State: State
};
