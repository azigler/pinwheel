#  Pinwheel MUD Engine <img src="/resources/icon.png">

[![Gossip](https://img.shields.io/badge/Gossip-%20MUD%20chat%20network-brightgreen.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABaFBMVEUA/wAA/QAA+gAA/AAA/gAAzAAAfQAAewAAugAAnAAADgAAAwAABAAAAQAAAgAAAAAALAAAWgAAWAAAWQAAKQAAkQAAigAApgAAoQAABQAAqgAAowAAmQAAlQAANAAAYAAArgAA0AAAqAAApwAA3AAAdwAAsQAAiAAABgAAjwAACgAAuAAAngAADwAAygAAogAACwAAuwAAywAABwAAuQAAkgAANgAAdQAAxgAA1wAAjAAASgAAoAAAeAAA+AAA+wAAtwAAtQAAjQAAzQAAkwAAlAAAQAAAzgAAzwAAeQAAQgAAGQAAdgAAegAAPgAA8QAAkAAA9wAACAAAPwAA8AAATQAAhAAAfgAAvgAAwQAAiwAAiQAAmAAA4QAARAAA6AAAUQAA3QAARgAAOwAAdAAAgwAAlwAA1gAANwAAIAAASwAAMAAALQAAOgAA7QAAHAAApQAAswAA8wAArwAAXAAAVwAAmwAAqQA4fgs+AAAAAWJLR0QPGLoA2QAAAAd0SU1FB+IMHhMpFkyc6hcAAAIrSURBVEjHrZb9WxJBEMd32SmsY3ZFEkIrCUoTMSskCsuXJM3Ckt6j97JXrezVf7/ZW1DPB3bvnsfvb3fMh9l5uZlljMciSDAGhw7Hw6tPMDhy1AutRDzmAxhS0jOAVAEFjQK/HAiA/cmBPUodcwKDIPiOBE+jtAIoMwx2xflxO4AyO7QDMKoSH3YB8gTrnAc0cNIK4KmRZE6czucLhUJ++AyQs7M2ABOjZMLHzkk/oaOcHsatQHECBEBpMiGl9PC8jnrKCly4SMcmQPr1u6QBa9BYzukUDRZ1fSVO6yNVegOoLlevAFytzXjKB64RANd7AxLTs3PA58vZ9uOC9nDDBpQoYlhsW7hj0ADfBTwDTNmAuraYUGgcqHl9pJuWoHGptgz81spteoF3GquLuqEa1rT6nccrRYnq7j3TfGv2wvWREafCoZppGsBR6WlGDVea9MIC2RzjlPr75OHBQwOM29v70eMnT8WzVjr9vNJaXXYG7U+MF+aLe/nKmVbzxVGidAvNvX6jXIVrvyvAHoALF6CwHmtqvX1XXuC8OdtyAu9X1qvV6vqHj7VP0Iw3Piu0A3pwaC3pSosvEgPn7QqYkfqVCgdsIwwg/QlAAA2EzfAevn3n5OEHugDE1NBWhvTzF/v9568X/K+uQAk6k/Kft39zdAMS237h9CzeDgXIrc70ZplAxD0L11koAuoYCqCVldIaSPbvs3cuRaUOCoi82CNeHaJeTqJef/4Dm8+LBivwHSsAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTgtMTItMzFUMDE6NDE6MjItMDY6MDCLHuXBAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE4LTEyLTMxVDAxOjQxOjIyLTA2OjAw+kNdfQAAAABJRU5ErkJggg==)](https://gossip.haus/)
[![MUD Coders Slack](https://slack.mudcoders.com/badge.svg)](https://slack.mudcoders.com/)
[![Ranvier MUD Engine](https://img.shields.io/badge/Ranvier-MUD%20engine-brightgreen.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAABS2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+IEmuOgAAAARnQU1BAACxjwv8YQUAAAABc1JHQgCuzhzpAAABmFBMVEUAAABhj1hdnlpro2ZonWNmmGBonmNon2Nrk2timl1lpV9poGVemFpkmV9roWZpo2NppWljnV90oXBupWlmmGFxpG1fo1toomRjpWBqomZlm2Bjl15ZnlJilF9rnGZsnWljpF5jolwA/wBiql9loWBnn2JjqF9tnGhon2P///9MjUZnnmJooGNqoGVRkEuvzK1poGRqnmVbl1ZKjERsoWdim11nn2Jon2JZllPC2MCwza1poWRpomVmn2FqoWZjnF1hm1xknF9ZlVNhmlyhw57T49FfmVlqn2VroGaJs4Vsomfm7+VmnmFOjkjC2L9fmVpJi0P7/fv2+fVcl1aixJ9toWddmFd0p3BVk0+MtohGikD3+vdromeBrn1tomlOj0mmxqNemFhrnmdrnmVSkUxChztnoWJ5qnV0p2+81Lq30bVmnGBPj0plnmDX5dVrnWZBhjrl7+Vgmltal1VRkUxXlFG81Lmyzq9SjkzF2sNallRWkVBQkEpqnmRnmGLO4MxonmS00LK+1r1HikF/rXrl7uTD2cG/172FLp/IAAAAKHRSTlMAN1q99JrI8hN148d31av1EeREYZqFOHyp7d1sJVu9RKckAWCr84XiPeLpZAAAAPRJREFUGNNjYIABaXEGDCAvJSmLJiQjkayhkSYnhiwmmp2UmxKfGGMmIgATEhbU1s3RS8iMizL14ueBiPHphgYbx+ZpakaHWPh6uHODBX20/U0sNcHA29PIXAcsyK4RkAUSCQIRbs7sUEGtck3NwowIP01NVydHuKCVpmZZQWpkoIuRgwGyYGWJaXq4sb2dBlxQX1OzTU+3KExXQwMqqAoWtNTT1gADiGBtQ3OTpmZ7DVRQAyyoYl7V0qpZrwUW1LFmg3hJWb3aolG/1ExDw8CGhRPmeSW1uopiE6AyW1YOpGBSVMjXMTRkZkQLUSFeLiYGfAAA+U4ze0Sgs5YAAAAASUVORK5CYII=)](https://github.com/RanvierMUD/ranviermud)
[![standard-readme](https://img.shields.io/badge/readme%20style-standard-DF1464.svg?style=popout-square)](https://github.com/RichardLitt/standard-readme)

[![MIT License](https://img.shields.io/badge/license-MIT-DF1464.svg?style=popout-square)](https://github.com/azigler/pinwheel/blob/master/LICENSE)
[![](http://hits.dwyl.io/azigler/pinwheel.svg)](#)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-DF1464.svg?style=popout-square)](https://github.com/azigler/pinwheel/issues)
[![](https://img.shields.io/badge/powered%20by-Node.js-brightgreen.svg?style=popout-square)](https://nodejs.org/en/about/)

> A highly opinionated fork of the [Ranvier](https://github.com/shawncplus/ranviermud) MUD engine.

Pinwheel is a *new* [MUD](https://www.andrewzigler.com/blog/2018/06/27/the-case-for-muds-in-modern-times/) engine built entirely in JavaScript. It doesn't require a database and can be ready for players within minutes of downloading.

Originally based on [Shawn Biddle](http://shawnbiddle.com)'s [Ranvier](http://ranviermud.com/), Pinwheel is a full rewrite of the engine and its bundles.

## :house_with_garden: Example Game

Coming soon...

## :floppy_disk: Install

Coming soon...

## :rocket: Usage

Coming soon...

## :horse_racing: Maintainer

[![@andrewzigler](https://img.shields.io/twitter/follow/andrewzigler.svg?label=@andrewzigler&style=social)](https://twitter.com/andrewzigler)

Coming soon...

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
