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
function MouseAdapter(outside, src)
{
    this.src = src;
    // Various attached callbacks
    this.onClickHandler = null;
    this.onDragHandler = null;
    this.onDragStartHandler = null;
    this.onDragStopHandler = null;
    // Whether the mouse button is currently being pressed
    this.pressing = false;
    // We track the number of mousemove events
    this.movements = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;

    var mouse = this;

    outside.addEventListener("mousemove", function(event) {
	// If the mouse just started moving, issue a drag start event
	if (mouse.movements === 0 && mouse.onDragStartHandler) {
	    mouse.onDragStartHandler(event.clientX, event.clientY);
	}
	mouse.movements++;

	if (mouse.pressing && mouse.onDragHandler) {
	    // The drag coordinates are always given relative to where the
	    // user starting dragging.
	    mouse.onDragHandler(
		event.clientX-mouse.dragStartX, 
		event.clientY-mouse.dragStartY);
	}
    });

    src.addEventListener("mousedown", function(event) {
	mouse.pressing = true;
	mouse.movements = 0;
	mouse.dragStartX = event.clientX;
	mouse.dragStartY = event.clientY;
    });

    outside.addEventListener("mouseup", function(event) {
	var rect = src.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	// If the mouse didn't move at all, it's a click event. Otherwise we
	// were dragging and should issue a drag stop event.
	if (mouse.movements === 0) {
	    if (mouse.onClickHandler) {
		mouse.onClickHandler(x, y);
	    }
	} else if (mouse.onDragStopHandler) {
	    mouse.onDragStopHandler(x, y);
	}
	mouse.pressing = false;
    });
}

MouseAdapter.prototype.onClick = function(handler) {
    this.onClickHandler = handler;
    return this;
}

MouseAdapter.prototype.onDrag = function(handler) {
    this.onDragHandler = handler;
    return this;
}

MouseAdapter.prototype.onDragStart = function(handler) {
    this.onDragStartHandler = handler;
    return this;
}

MouseAdapter.prototype.onDragStop = function(handler) {
    this.onDragStopHandler = handler;
    return this;
}

/****************/
/* TouchAdapter */
/****************/

function TouchAdapter()
{
}
