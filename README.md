# <img src="/resources/icon.png"> Pinwheel MUD Engine

[![Grapevine](https://img.shields.io/badge/Grapevine-MUD%20Chat%20Network-brightgreen.svg)](https://grapevine.haus/)
[![MUD Coders Slack](https://slack.mudcoders.com/badge.svg)](https://slack.mudcoders.com/)
[![Ranvier MUD Engine](https://img.shields.io/badge/Ranvier-MUD%20engine-brightgreen.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAABmFBMVEUAAABhj1hdnlpro2ZonWNmmGBonmNon2Nrk2timl1lpV9poGVemFpkmV9roWZpo2NppWljnV90oXBupWlmmGFxpG1fo1toomRjpWBqomZlm2Bjl15ZnlJilF9rnGZsnWljpF5jolwA/wBiql9loWBnn2JjqF9tnGhon2P///9MjUZnnmJooGNqoGVRkEuvzK1poGRqnmVbl1ZKjERsoWdim11nn2Jon2JZllPC2MCwza1poWRpomVmn2FqoWZjnF1hm1xknF9ZlVNhmlyhw57T49FfmVlqn2VroGaJs4Vsomfm7+VmnmFOjkjC2L9fmVpJi0P7/fv2+fVcl1aixJ9toWddmFd0p3BVk0+MtohGikD3+vdromeBrn1tomlOj0mmxqNemFhrnmdrnmVSkUxChztnoWJ5qnV0p2+81Lq30bVmnGBPj0plnmDX5dVrnWZBhjrl7+Vgmltal1VRkUxXlFG81Lmyzq9SjkzF2sNallRWkVBQkEpqnmRnmGLO4MxonmS00LK+1r1HikF/rXrl7uTD2cG/172FLp/IAAAAKHRSTlMAN1q99JrI8hN148d31av1EeREYZqFOHyp7d1sJVu9RKckAWCr84XiPeLpZAAAAPRJREFUGNNjYIABaXEGDCAvJSmLJiQjkayhkSYnhiwmmp2UmxKfGGMmIgATEhbU1s3RS8iMizL14ueBiPHphgYbx+ZpakaHWPh6uHODBX20/U0sNcHA29PIXAcsyK4RkAUSCQIRbs7sUEGtck3NwowIP01NVydHuKCVpmZZQWpkoIuRgwGyYGWJaXq4sb2dBlxQX1OzTU+3KExXQwMqqAoWtNTT1gADiGBtQ3OTpmZ7DVRQAyyoYl7V0qpZrwUW1LFmg3hJWb3aolG/1ExDw8CGhRPmeSW1uopiE6AyW1YOpGBSVMjXMTRkZkQLUSFeLiYGfAAA+U4ze0Sgs5YAAAAASUVORK5CYII=)](https://github.com/RanvierMUD/ranviermud)
[![standard-readme](https://img.shields.io/badge/readme%20style-standard-DF1464.svg?style=popout-square)](https://github.com/RichardLitt/standard-readme)

[![@andrewzigler](https://img.shields.io/twitter/follow/andrewzigler.svg?label=@andrewzigler&style=social)](https://twitter.com/andrewzigler)
[![MIT License](https://img.shields.io/badge/license-MIT-DF1464.svg?style=popout-square)](https://github.com/azigler/pinwheel/blob/master/LICENSE)
[![](http://hits.dwyl.io/azigler/pinwheel.svg)](#)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-DF1464.svg?style=popout-square)](https://github.com/azigler/pinwheel/blob/master/CONTRIBUTING.md)
[![](https://img.shields.io/badge/powered%20by-Node.js-brightgreen.svg?style=popout-square)](https://nodejs.org/en/about/)

> A highly opinionated fork of the [Ranvier](https://github.com/shawncplus/ranviermud) MUD engine.

**Current Version: `0.5.0`**

Pinwheel is a *new* [MUD](https://www.andrewzigler.com/blog/2018/06/27/the-case-for-muds-in-modern-times/) engine built entirely in ES6 (JavaScript). It doesn't require a database and can be online for players within moments of downloading. Originally based on [Shawn Biddle](http://shawnbiddle.com)'s [Ranvier](http://ranviermud.com/), Pinwheel is a rewrite of the engine and its bundles into a highly opinionated format. The engine makes decisions about world persistence and core features so you can focus on building your world and community.

Pinwheel is an experimental game engine that aims to fuse MUD and browser gameplay. To get an idea of what version `1.0.0` of Pinwheel will entail, check out our [Roadmap](#chart_with_upwards_trend-roadmap).

:pencil2: Latest devlog post: [Initial Release of Pinwheel - January 26, 2019](https://www.andrewzigler.com/blog/2019/01/26/initial-release-of-pinwheel/)

## :book: Table of Contents

- [Install](#floppy_disk-install)
- [Usage](#rocket-usage)
  - [Package Scripts](#nut_and_bolt-package-scripts)
  - [JSON Configuration](#zap-json-configuration)
- [Features](#round_pushpin-features)
- [Example Game *(Snakelines)*](#snake-example-game-snakelines)
- [Roadmap](#chart_with_upwards_trend-roadmap)
- [Maintainer](#horse_racing-maintainer)
- [Contributing](#inbox_tray-contributing)
- [License](#bookmark_tabs-license)

## :floppy_disk: Install

[![](https://media.giphy.com/media/1etm4ODOpz5MUF4Kx2/giphy.gif)](#) [![](https://i.imgur.com/4PHUzHx.png)](#)

Pinwheel requires [Node v8.9.4](https://nodejs.org/en/blog/release/v8.9.4/) or greater.

To install, run the following commands from your terminal:

```shell
git clone https://github.com/azigler/pinwheel/
cd pinwheel
npm install
npm run
```

Pinwheel can get up and running immediately, but it's recommended to configure your game via the [`pinwheel.json`](https://github.com/azigler/pinwheel/blob/master/pinwheel.json) file. For more information, see the [Usage](#rocket-usage) section.

## :rocket: Usage

Pinwheel has several built-in scripts that you can use with `npm run`. To launch the server, use `npm run start`. To launch the server quicker and without logging to a file (useful for development), use `npm run dev`.

This repository comes with a default account and administrator character, or you can make your own with the included aspects. To access the default account, use the following credentials:

```
username: Admin
password: pinwheel
```

### :nut_and_bolt: Package Scripts
- `start`: launches the server
- `dev`: launches the server without logging to a file, connecting to [Grapevine](https://grapevine.haus/), or running the `default` [gulp task](https://github.com/azigler/pinwheel/blob/master/gulpfile.js) (useful for development)
- `istanbul`: uses [Istanbul](https://istanbul.js.org/) to test coverage with [Chai](https://www.chaijs.com/)
- `test`: runs the `default` [gulp task](https://github.com/azigler/pinwheel/blob/master/gulpfile.js) and fires the `istanbul` script
- `build-docs`: uses [JSDoc](http://usejsdoc.org/) to build documentation in `docs/jsdoc/` from `src/`
- `bundle-install`: installs npm packages for all bundles
- `postinstall`: *automatically fires `bundle-install` after `npm install`*
- `clean-areas`: deletes the files in `data/area/` (useful for rapid testing)
- `clean-bugs`: deletes the files in `data/bug/` (useful for rapid testing)
- `clean-logs`: deletes the files in `data/log/` (useful for rapid testing)
- `clean-all`: fires all of the cleaning scripts (`clean-logs`, `clean-bugs`, `clean-areas`, and `clean-all`)

Many elements of Pinwheel can be configured via the [`pinwheel.json`](https://github.com/azigler/pinwheel/blob/master/pinwheel.json) file.

### :zap: JSON Configuration
*(in alphabetical order)*
- `allowMultiplay`: whether accounts can have multiple characters logged in at once *(default: `true`)*
- `aspects`: array of [`Aspect`](https://github.com/azigler/pinwheel/blob/master/src/Aspect.js) names *(default: `["archetype", "species", "trait"]`)*
- `bundles`: array of bundle names to include at runtime *(default: all bundles in this repository)*
- `creation`: object with properties whose values indicate default [`Aspect`](https://github.com/azigler/pinwheel/blob/master/src/Aspect.js) options available at character creation *(default: `{"archetype": ["tester"], "species": ["administrator"], "trait": ["immortal"]}`)*
- `currency`: name of default currency *(default: `"cowries"`)*
- `debugArea`: name of area where combat debugging will output *(default: `"start"`)*
- `entityTick`: time between entity update ticks, in miliseconds *(default: `500`)*
- `grapevine`: false if disabled, or object with [your game's authentication details](https://grapevine.haus/register/new) for [Grapevine](https://grapevine.haus/) *(example: `{"clientId": "YOUR-CLIENT-ID", "clientSecret": "YOUR-CLIENT-SECRET"}`), (default: `false`)*
- `introEvent`: initial `input-event` shown on connection *(default: `"intro"`)*
- `logLevel`: configures logging to file, either `"verbose"` or `"none"` *(default: `"verbose"`)*
- `maxCharacters`: number of active characters allowed on an account *(default: `3`)*
- `maxFailedLoginAttempts`: number of failed login attempts allowed before being kicked *(default: `3`)*
- `maxIdleMinutes`: number of minutes a character can idle before being kicked, 0 if disabled *(default: `0`)*
- `maxNameLength`: maximum name length for an account or character *(default: `20`)*
- `maxPlayerInventory`: maximum number of items that can be carried by a player *(default: `16`)*
- `meta`: *(example: `{"author": "John Doe", "gameName": "Pinwheel", "twitterHandle": "@johndoe"}`), (default: `false`)*
- `minNameLength`: minimum name length for an account or character *(default: `3`)*
- `minPasswordLength`: minimum character length for an account password *(default: `6`)*
- `motd`: filename in `data/motd/` to show on `intro` event *(default: `"pinwheel"`)*
- `moveCommand`: default command used to navigate a character *(default: `"move"`)*
- `playerTick`: time between player update ticks, in milliseconds *(default: `500`)*
- `reportBugsToAdmins`: whether to notify valid online users of reported bugs, typos, and suggestions *(default: `true`)*
- `skillLag`: default lag after skill use, in milliseconds *(default: `1000`)*
- `startingRoom`: entity reference for room in which all characters start after creation *(default: `"start:spawn"`)*
- `startingTraits`: number of traits that can be chosen at character creation *(default: `1`)*
- `telnetPort`: port for Telnet server *(default: `4000`)*
- `web`: object with information for web server *(example: `"web": {"header": {"description": "Powered by Pinwheel, a JavaScript MUD engine.", "faviconUrl": "/path/to/favicon.ico", "googleId": "YOUR-GOOGLE-ANALYTICS-TRACKING-ID", "image": "https://full.weburl.to/image.jpg"}, "https": {"fullchain": "/full/path/to/fullchain.pem", "port": 443, "key": "/full/path/to/privkey.pem"}, "port": 80}`), (default: `{"header": false, "https": false, "port": 80}`)*
- `webSocketPort`: port for [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) server *(default: `4001`)*

## :round_pushpin: Features

- Full game state persistence across sessions (areas, NPCs, players, and items)
- [Diku](http://mud.wikia.com/wiki/DikuMUD)-esque commands
- Customization of players and NPCs with species, archetypes, and traits
- Usage of human-readable YAML for game data in bundles
- Entity-based scripting with few differences between NPCs and players
- Turn-based combat with abilities, spells, and disciplines
- Usage-based improvement of skills with branching skill trees
- Communication channels and player parties
- Compatibility with the [Grapevine MUD Chat Network](https://grapevine.haus/)
- Player accounts
- Telnet and [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) support
- Data storage in JSON files, no database required
- Web server bound to state (for a website and/or API)

## :snake: Example Game *(Snakelines)*

A dedicated development server for Pinwheel can be found at [https://mud.andrewzigler.com](https://mud.andrewzigler.com), called *Snakelines*. This game is the most up-to-date version of Pinwheel that's available and has many experimental features not yet commited to the repository. For now, the best way to access it is by connecting your favorite telnet client to `mud.andrewzigler.com`, `port 4000`.

This server is an easy way to try out the engine without downloading it, and the environment is intended as a sandbox. During the development of Pinwheel, *[Snakelines](https://mud.andrewzigler.com)* will serve as a catalyst for engine's opinions. Even though it's being used to showcase the features of the engine, *Snakelines* is also a game being developed in earnest. The development of *Snakelines* is in its infancy and drives many of the decisions behind this project. *Snakelines* is based on worldbuilding materials that have been crafted for nearly a decade and applied in various mediums.

## :chart_with_upwards_trend: Roadmap

- [x] Refactor [Ranvier](http://ranviermud.com/) into Pinwheel
- [x] Reduce the differences between player characters and NPCs
- [x] Convert class system into aspects, allowing fine-tuned customization of players and NPCs alike with stackable components (e.g., species, archetypes, and traits)
- [x] Rewrite foundation for new combat system
- [ ] Add configurable time, seasons, and weather
- [ ] Implement [hot reloading](http://mud.wikia.com/wiki/Copyover_Recover) of bundles and core
- [ ] Enable [online creation (OLC)](http://mud.wikia.com/wiki/Online_Creation) of bundle content
- [ ] Create customizable player organizations
- [ ] Redesign quests into [dynamic events](https://wiki.guildwars2.com/wiki/Dynamic_event)
- [ ] Add crafting, resources, and a basic economy
- [ ] Expand emoting complexity with syntax for referencing the world
- [ ] Build an API with [Express](https://expressjs.com/) for the engine and game state, allowing extensibility beyond the original platform (e.g., apps, widgets, and third-party clients)
- [ ] Expand the web server to allow for gameplay, building, and administration in the browser
- [ ] Convert to [NPM package](https://docs.npmjs.com/about-packages-and-modules)

## :horse_racing: Maintainer

Pinwheel is maintained by [Andrew Zigler](https://www.andrewzigler.com/), a member of the [MUD Coders Guild](https://mudcoders.com/). Andrew can be reached on Twitter ([@andrewzigler](https://twitter.com/andrewzigler)) or Slack ([@Zig](https://mudcoders.slack.com/)).

## :inbox_tray: Contributing
Feedback and contributions are encouraged! After reading our [Code of Conduct](https://github.com/azigler/pinwheel/blob/master/CODE_OF_CONDUCT.md), use the [*Bug Report*](https://github.com/azigler/pinwheel/issues/new?assignees=&labels=&template=bug-report.md&title=) or [*Feature Request*](https://github.com/azigler/pinwheel/issues/new?assignees=&labels=&template=feature-request.md&title=) issue templates to discuss any bugs or potential contributions to Pinwheel. For more information, please read our [Contributing Guide](https://github.com/azigler/pinwheel/blob/master/CONTRIBUTING.md).

## :bookmark_tabs: License

Copyright © 2018-2019 [Andrew Zigler](https://www.andrewzigler.com)

Copyright © 2012 [Shawn Biddle](http://shawnbiddle.com)

[MIT License](https://github.com/azigler/pinwheel/blob/master/LICENSE)

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
