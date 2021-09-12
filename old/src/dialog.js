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

var Events = require("./events");
var Utils = require("./utils");

// Object cache for holding a (PIXI) rendered texture, to be used as the dialog
// box background. Generating a texture takes a noticable amount of time to 
// do at runtime. So this is nice to cache globally to use across all 
// dialog instances. 
var CachedTexture = new (class {
    makeTexture(colour) {
	if (colour !== undefined && this.colour !== colour) {
	    this.texture = Utils.makeSolidColourTexture(colour, 10, 10);
	    this.colour = colour;
	}
	return this.texture;
    }
});

/**********/
/* Dialog */
/**********/

function Dialog(width, height, stage, options)
{
    this.container = new PIXI.Container();
    this.viewWidth = width;
    this.viewHeight = height;
    this.options = options;
    this.messages = [];
    this.stage = stage;

    var mgr = new Events.EventManager();
    this.onOpening = mgr.hook("opening");
    this.onClosed = mgr.hook("closed");
    this.onClosing = mgr.hook("closing");
    this.onRedraw = mgr.hook("redraw");
    this.onUpdate = mgr.hook("update");
    this.dispatch = mgr.dispatcher();

    this.state = "idle";

    let texture = CachedTexture.makeTexture(options.background);
    this.bg = new PIXI.Sprite(texture);
    this.container.addChild(this.bg);
}

Dialog.prototype.isShown = function()
{
    return this.state === "shown";
}

Dialog.prototype.showMessage = function(msg)
{
    if (this.state !== "idle") {
	// Already showing a message. Add it to the queue for later
	this.messages.push(msg);
	return;
    }

    var pad = this.viewHeight*0.02;
    var fontSize = this.viewHeight*0.05;
    var text = new PIXI.Text(msg, {
	fontSize: fontSize, 
	wordWrap: true,
	fontStyle: "italic",
	fill: this.options.fill,
	wordWrapWidth: this.viewWidth-2*pad
    });
    text.x = pad;
    text.y = pad;

    this.bg.scale.set(
	this.viewWidth/this.bg.texture.width, 
	(text.height+2*pad)/this.bg.texture.height);

    this.container.children = [];
    this.container.addChild(this.bg);
    this.container.addChild(text);

    //this.container.addChild(bg);
    //this.container.addChild(text);

    // Now position everything, a little offset from the bottom
    /*bg.y = this.viewHeight-bg.height-(this.viewHeight*0.03);
    text.x = pad;
    text.y = bg.y+pad;*/

    this.desty = this.viewHeight-this.bg.height-(this.viewHeight*0.03);
    this.container.y = this.viewHeight+5;
    this.show();
}

Dialog.prototype.show = function()
{
    if (this.state !== "idle") return;
    this.state = "showing";

    this.delay = 0;
    this.stage.addChild(this.container);
    // Have the dialog box slide into view from below
    this.dispatch("update", dt => {
	if (this.delay > 0) {
	    this.delay -= dt;
	    return true;
	}
	this.container.y -= 0.9*this.viewHeight*dt;
	if (this.container.y < this.desty) 
	{
	    this.container.y = this.desty;
	    this.state = "shown";
	    this.dispatch("redraw");
	    return false;
	}
	return true;
    });
    this.dispatch("opening");
}

Dialog.prototype.hide = function(delay)
{
    if (this.state !== "shown") return;
    this.state = "hiding";

    // Have the dialog box slide off screen
    this.dispatch("closing");
    this.dispatch("update", dt => {
	if (delay > 0) {
	    delay -= dt;
	    return true;
	}

	this.container.y += (0.75*this.viewHeight)*dt;
	if (this.container.y > this.viewHeight) 
	{
	    this.container.parent.removeChild(this.container);
	    this.state = "idle";
	    if (this.messages.length > 0) {
		// Show the next message
		this.showMessage(this.messages.shift());
	    } else {
		this.dispatch("closed");
	    }
	    this.dispatch("redraw");
	    return false;
	}
	return true;
    });
}

Dialog.prototype.handleResize = function(width, height)
{
    this.viewWidth = width;
    this.viewHeight = height;
    // TODO - handle resize when a message is displayed currently
}

/* Returns a promise that resolves once the dialog is closed */
Dialog.prototype.closed = function()
{
    return new Promise(
	(resolve, reject) => {
	    let closedEvent = this.onClosed(() => {
		closedEvent.remove();
		resolve();
	    });
	}, 
	err => {
	    console.log("Error closing dialog: " + err);
	}
    );
}

module.exports = Dialog;
