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
/* Fader */
/*********/

function Fader(width, height, args)
{
    let dir = args.dir !== undefined ? args.dir : 1;
    let colour = args.colour !== undefined ? args.colour : "black";
    let txt = Utils.makeSolidColourTexture(colour, width, height);
    this.sprite = new PIXI.Sprite(txt);
    this.sprite.alpha = 1-dir;
    this.duration = args.duration !== undefined ? args.duration : 1;
    this.dir = dir;
}

Fader.prototype.start = function(stage)
{
    stage.addChild(this.sprite);
}

Fader.prototype.update = function(dt)
{
    let margin = 0.05;
    this.sprite.alpha += this.dir*dt/this.duration;
    if (this.dir > 0 && this.sprite.alpha >= 1-margin) {
	this.sprite.alpha = 1;
	this.sprite.parent.removeChild(this.sprite);
	return false;
    } else if (this.dir < 0 && this.sprite.alpha <= margin) {
	this.sprite.alpha = 0;
	this.sprite.parent.removeChild(this.sprite);
	return false;
    }
    return true;
}

class Transition
{
    /* Start the scene transition, returning a promise that resolves when
     * it's complete. */
    start() {}
}

/******************/
/* FadeTransition */
/******************/

class FadeTransition
{
    constructor(startScene, endSceneName, args) {
	this.startSCene = startScene;
	this.endSceneName = endSceneName;
	this.screen = startScene.screen;
	this.args = args || {};
    }

    start() {
	// Fade out, switch scenes, then fade back in
	var fadeout = new Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {
		dir: 1, 
		duration: this.args.duration || 1,
		colour: this.args.colour
	    }
	);
	var fadein = new Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {
		dir: -1, 
		duration: this.args.duration || 1, 
		colour: this.args.colour
	    }
	);
	let pauseTime = (
	    this.args.pauseTime !== undefined ? this.args.pauseTime : 0);
	//this.screen.stage.removeChild(fadeout.sprite);
	this.screen.pause();
	this.screen.enterCutscene();
	fadeout.start(this.screen.stage);

	return this.screen.updater(dt => {
	    if (!fadeout.update(dt)) 
	    {
		this.screen.setScene(this.endSceneName, this.args);
		fadein.start(this.screen.stage);
                return false;
            }
            return true
	}).then(result => {
	    return this.screen.updater(Utils.delayUpdate(pauseTime));
	}).then(result => {
	    this.screen.updater(dt => {
		if (!fadein.update(dt)) {
		    this.screen.resume();
		    this.screen.leaveCutscene();
		    return false;
		}
		return true;
	    })
	});
    }
}

/********************/
/* FadeInTransition */
/********************/

class FadeInTransition
{
    constructor(screen, sceneName, args) {
	this.screen = screen;
	this.sceneName = sceneName
	this.args = args || {};
    }

    start() {
	this.screen.setScene(this.sceneName, this.args);
	this.screen.enterCutscene();
	var fader = new Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {
		dir: -1, 
		duration: this.args.duration || 2, 
		colour: this.args.colour
	    }
	);
	fader.start(this.screen.stage);

	return this.screen.updater(dt => {
	    if (!fader.update(dt)) {
		this.screen.leaveCutscene();
		return false;
	    }
	    return true;
	});
    }
}

/*********************/
/* FadeOutTransition */
/*********************/

class FadeOutTransition
{
    constructor(screen, args) {
	this.screen = screen;
	this.args = args || {};
    }

    start(onComplete) 
    {
	var fader = new Fader(
	    this.screen.viewWidth,
	    this.screen.viewHeight,
	    {
		dir: 1, 
		duration: this.args.duration || 1, 
		colour: this.args.colour
	    }
	);
	fader.start(this.screen.stage);
	return this.screen.updater(dt => {
	    if (!fader.update(dt)) {
		if (onComplete) onComplete();
		return false;
	    }
	    return true;
	});
    }
}


module.exports = {
    FadeToScene: FadeTransition,
    FadeIn: FadeInTransition,
    FadeOut: FadeOutTransition,
    Fader: Fader
};
