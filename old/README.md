# Demoquest

A simple point-and-click adventure game demo. It's written in javascript
using the PIXI.js library for graphics. It currently builds as a mobile app
via Cordova.

This is somewhat a work in progress, though it was always only ever intended
as a game demo for me to explore some different coding techniques.

# Screenshots

<img src="https://github.com/parogers/demoquest/raw/master/screenshots/screenshot1.png" style="width: 200px; height: auto; border: solid 1px">

<img src="https://github.com/parogers/demoquest/raw/master/screenshots/screenshot2.png" style="width: 200px; height: auto; border: solid 1px">

<img src="https://github.com/parogers/demoquest/raw/master/screenshots/screenshot3.png" style="width: 200px; height: auto; border: solid 1px">

# About the code

I wanted to write a simple game that wasn't based on a persistant render
loop. (ie endlessly calling requestAnimationFrame) Rather, I wanted
render requests to be triggered via event callbacks. This model fits nicely
with adventure games where the scenery is mostly static and the player spends much of their time looking, thinking and reading. (as opposed to the sort of quick engagements you'd find in an action game)

# License

The source is released under GPLv3. See LICENSE for more details. The graphics and audio are released under the [CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/) license.

