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

/****************/
/* MouseAdapter */
/****************/

/* Converts standard mouse events (mousedown/up/move) into a more convenient
 * interface:
 *
 *  - click - The standard click event is fired if a mousedown and mouseup
 *    are fired on the same element, even if there is movement between events
 *  - dragStart - The user has started dragging the mouse
 *  - drag - Fired for every mouse movement while dragging. The x, y offset
 *    from the start of the dragging action is passed into the callback.
 *  - dragStop - The dragging action is finished.
*/
function MouseAdapter(src)
{
    this.src = src;
    // Whether the mouse button is currently being pressed
    this.pressing = false;
    // We track the number of mousemove events
    this.movements = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Setup some event handlers for dispatching below
    var mgr = new EventManager();
    this.onClick = mgr.hook("click");
    this.onDrag = mgr.hook("drag");
    this.onDragStart = mgr.hook("dragStart");
    this.onDragStop = mgr.hook("dragStop");

    // Attach the mousedown event to the render area, so the player has to 
    // click on the element (eg render area) to start dragging, or to 
    // interact with an object.
    src.addEventListener("mousedown", (
	function(event) {
	    this.pressing = true;
	    this.movements = 0;
	}
    ).bind(this));

    // However we attach the mousemove event to the whole window, so the player
    // can drag outside the render area and still pan around.
    window.addEventListener("mousemove", (
	function(event) {
	    if (!this.pressing) return;

	    // If the mouse just started moving, issue a drag start event
	    if (this.movements === 0) {
		var rect = this.src.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;
		mgr.dispatch("dragStart", new GameEvent({x: x, y: y}));

		this.dragStartX = event.clientX;
		this.dragStartY = event.clientY;

	    } else {
		// The drag coordinates are always given relative to where the
		// user starting dragging.
		var evt = new GameEvent({
		    dx: event.clientX-this.dragStartX, 
		    dy: event.clientY-this.dragStartY});
		mgr.dispatch("drag", evt);
	    }
	    this.movements++;
	}
    ).bind(this));

    // Attach the mouseup event to the window, so we can pickup on the event
    // even if the player has dragged out of the render area.
    window.addEventListener("mouseup", (
	function(event) {
	    var rect = this.src.getBoundingClientRect();
	    var x = event.clientX - rect.left;
	    var y = event.clientY - rect.top;
	    // If the mouse didn't move at all, it's a click event. Otherwise we
	    // were dragging and should issue a drag stop event. Also note we 
	    // make sure the mouse cursor is within the area before issuing
	    // the click event. (ie you can't click things that are out of view
	    var evt = new GameEvent({x: x, y: y});
	    if (this.movements === 0 && x >= 0 && y >= 0 && 
		x <= rect.right && y <= rect.bottom) {
		mgr.dispatch("click", evt);
	    } else {
		// Pass in the drag start position (relative to the view area)
		var rect = this.src.getBoundingClientRect();
		evt.dragStartX = this.dragStartX - rect.left;
		evt.dragStartY = this.dragStartY - rect.top;
		mgr.dispatch("dragStop", evt);
	    }
	    this.pressing = false;
	}
    ).bind(this));
}

function GameEvent(options)
{
    for (var key in options) {
	this[key] = options[key];
    }
}

/****************/
/* TouchAdapter */
/****************/

function TouchAdapter()
{
}
