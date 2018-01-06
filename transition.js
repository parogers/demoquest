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
    let txt = Utils.makeSolidColourTexture("black", width, height);
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
    this.sprite.alpha += this.dir*dt/this.duration;
    if (this.dir > 0 && this.sprite.alpha >= 1) {
	this.sprite.alpha = 1;
	this.sprite.parent.removeChild(this.sprite);
	return false;
    } else if (this.dir < 0 && this.sprite.alpha <= 0) {
	this.sprite.alpha = 0;
	this.sprite.parent.removeChild(this.sprite);
	return false;
    }
    return true;
}

/******************/
/* FadeTransition */
/******************/

class FadeTransition
{
    constructor(startScene) {
	this.startSCene = startScene;
	this.screen = startScene.screen;
    }

    start(endScene, args) {
	// Fade out, switch scenes, then fade back in
	var fadeout = new Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {dir: 1, duration: 1});
	var fadein = new Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {dir: -1, duration: 1});
	//this.screen.stage.removeChild(fadeout.sprite);
	this.screen.pause();
	this.screen.enterCutscene();
	fadeout.start(this.screen.stage);
        this.screen.addUpdate(
            dt => {
	        if (!fadeout.update(dt)) 
	        {
		    this.screen.setScene(endScene, args);
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

/********************/
/* FadeInTransition */
/********************/

class FadeInTransition
{
    constructor(screen) {
	this.screen = screen;
    }

    start(sceneName, args) {
	// Slow fade into the starting scene
	this.screen.setScene(sceneName, args);
	this.screen.pause();
	var fader = new Fader(
	    this.screen.viewWidth, 
	    this.screen.viewHeight,
	    {dir: -1, duration: 2});
	fader.start(this.screen.stage);
	this.screen.addUpdate(dt => {
	    if (!fader.update(dt)) {
		this.screen.resume();
		return false;
	    }
	    return true;
	});
    }
}


module.exports = {
    FadeTransition: FadeTransition,
    FadeInTransition: FadeInTransition,
    Fader: Fader
};
