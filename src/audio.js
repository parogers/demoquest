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

var enabled = true;

module.exports = {};

module.exports.Effects = {
    Crow: "media/effects/crow.mp3",
    Drip: "media/effects/water-drop.mp3",
    ShapeSound: "media/effects/ufo.mp3",
    ShapeSound2: "media/effects/ufo2.mp3",
    DoorOpening: "media/effects/door-opening.mp3",
    DoorClosing: "media/effects/door-closing.mp3",
    Crickets: "media/effects/crickets.mp3",
    Crickets2: "media/effects/crickets2.mp3",
    Cupboard: "media/effects/soft-click.mp3",
    Switch: "media/effects/soft-click.mp3",
    Monster: "media/effects/creepy-snake.mp3",
    Bang: "media/effects/bang.mp3",
    Purring: "media/effects/purring.mp3",
    PurringFast: "media/effects/purring2.mp3"
};

module.exports.play = function(res, vol)
{
    if (enabled) {
	if (!sounds[res]) throw Error("Invalid sound: " + res);
        if (vol !== undefined) sounds[res].volume = vol;
	try {
	    sounds[res].play();
	} catch(e) {
	    console.log('failed to play: ' + e);
	}
	return sounds[res];
    }
    return null;
}

module.exports.setEnabled = function(b)
{
    enabled = b;
    for (let name of sounds) {
	if (sounds[name].play && sounds[name].pause) {
	    sounds[name].pause();
	}
    }
}

module.exports.load = function(sources, opts)
{
    sounds.whenLoaded = opts.whenLoaded || null;
    sounds.onFailed = opts.onFailed || null;
    sounds.onProgress = opts.onProgress || null;
    sounds.load(sources);
}
