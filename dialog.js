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

    var mgr = new EventManager();
    this.onClosed = mgr.hook("closed");
    this.onRedraw = mgr.hook("redraw");
    this.onUpdate = mgr.hook("update");
    this.dispatch = mgr.dispatcher();

    this.state = "idle";

    // Render a solid colour
    var texture = makeSolidColourTexture(this.options.background, 10, 10);
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

    /*var lightbox = new PIXI.Sprite(texture);
    lightbox.alpha = 0.65;
    this.container.addChild(lightbox);*/

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

    this.delay = 0.2;
    this.stage.addChild(this.container);
    // Have the dialog box slide into view from below
    this.dispatch("update", (
	function(dt) {
	    if (this.delay > 0) {
		this.delay -= dt;
		return true;
	    }
	    this.container.y -= this.viewHeight*dt;
	    if (this.container.y < this.desty) 
	    {
		this.container.y = this.desty;
		this.state = "shown";
		return false;
	    }
	    return true;
	}
    ).bind(this));
}

Dialog.prototype.hide = function(delay)
{
    if (this.state !== "shown") return;
    this.state = "hiding";

    // Have the dialog box slide off screen
    this.dispatch("update", (
	function(dt) {
	    this.container.y += (1.2*this.viewHeight)*dt;
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
		return false;
	    }
	    return true;
	}
    ).bind(this));
}

Dialog.prototype.handleResize = function(width, height)
{
    this.viewWidth = width;
    this.viewHeight = height;
    // TODO - handle resize when a message is displayed currently
}
