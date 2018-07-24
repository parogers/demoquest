/* demoquest - An adventure game demo with parallax scrolling
 * Copyright (C) 2017  Peter Rogers (peter.rogers@gmail.com)
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
 * 
 * See LICENSE.txt for the full text of the license.
 */

// The PIXI renderer
var renderer = null;
// The containing element
var container = null;
// The preferred aspect ratio for sizing the render view
var aspectRatio = 1;

module.exports = {};

/* Configures the renderer (via PIXI) and adds the view to the given HTML
 * element. The renderer width/height will conform to the given aspect 
 * ratio. */
module.exports.configure = function(div, options)
{
    let aspect = options.aspect || 1;
    let forceCanvas = (options.forceCanvas == true);

    // Set pixel scaling to be "nearest neighbour" which makes textures 
    // render nice and blocky.
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    // Disable the ticker since we don't use it (rendering happens as needed)
    PIXI.ticker.shared.autoStart = false;
    PIXI.ticker.shared.stop();

    let rect = div.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        throw Error("Invalid size for renderer: " + 
                    rect.width + ", " + rect.height);
    }

    // Maintain the aspect ratio when sizing the render view
    let width = Math.round(rect.height*aspect);
    let height = rect.height;

    if (width > rect.width) {
        width = rect.width;
        height = Math.round(rect.height/aspect);
    }

    let renderArgs = {
        width: width,
        height: height,
        //antialias: true,
        // Required to prevent flickering in Chrome on Android (others too?)
        preserveDrawingBuffer: true,
        //clearBeforeRender: true
    }

    if (forceCanvas) {
	// Canvas rendering seems to work better on mobile than webgl
	renderer = new PIXI.CanvasRenderer(renderArgs);
    } else {
	// Preferably use webgl, fallback to canvas rendering
	renderer = PIXI.autoDetectRenderer(renderArgs);
    }
    renderer.plugins.interaction.destroy();

    div.innerHTML = "";
    div.appendChild(renderer.view);
    container = div;
    aspectRatio = aspect;
}

module.exports.getContainer = function() {
    return container;
}

module.exports.getRenderer = function() {
    return renderer;
}

/* Resize the renderer to fit the parent container */
module.exports.resize = function() 
{
    let rect = container.getBoundingClientRect();
    // Maintain the aspect ratio when resizing the render view
    let width = Math.round(rect.height*aspectRatio);
    let height = rect.height;

    if (width > rect.width) {
        width = rect.width;
        height = Math.round(rect.width/aspectRatio);
    }

    renderer.resize(width, height);
    //container.innerHTML = "";
    //container.appendChild(renderer.view);
}
