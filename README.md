# viewee.js

ViewEE is a software to view PCB layouts in various formats. Currently supported are Cadsoft Eagle `.brd`
, Kicad `.kicad_pcb` and gEDA `.pcb` formats.

![BrowserStack](https://www.browserstack.com/automate/badge.svg?badge_key=UFVzZlZaQkI4ZmwxYVBGTVNxcnpLd0NJU1EwNkoxbld6eVJlbXY4TW1PRT0tLWZZS1pUdVR4VG92aHRzcmJieHlCaWc9PQ==--c1c9b90dfe3a738f88e42f912f255e8f0f9e3511)

[More information](http://cuwire.io/viewee/)

### Issues

Parser and renderer are not ideal. Some problems can be fixed (pad, via shapes),
some — not (I don't have an access to the eagle font). At current stage you will
definitely face problem with thru hole pad shapes, arcs, rotated elements and text.
Eagle parser have best quality, Kicad renders ok and gEDA pcb parser is quite basic.

### Limitations

Currently only 2layer boards are supported.

### Reference rendering in version 0.2.0, [current version](http://cuwire.io/viewee/preview/) is much better.

![eagle rendering](http://cuwire.io/images/cuwire-viewee-quicklook-0.2.0-eagle.png)

![kicad rendering](http://cuwire.io/images/cuwire-viewee-quicklook-0.2.0-kicad.png)

### Mac OS X QuickLook plugin

You can install preview version of ViewEE for Mac OS X by downloading QuickLook plugin
from [releases page](https://github.com/cuwire/viewee.js/releases).

Download, unarchive, copy `.qlgenerator` file to the `~/Library/QuickLook/` folder.

#### Video

<div class="videoWrapper ViewEE-QuickLook">
    <!-- Copy & Pasted from YouTube -->
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/ihnCz3UOc7Y" frameborder="0" allowfullscreen></iframe>
</div>

### Library

Also you can use a javascript parser and renderer on your own page. Here is [an example](/viewee/preview/) and [repository](https://github.com/cuwire/viewee.js).

## Thanks

Huge thanks to people who created the original version
for [Eagle board viewer](https://github.com/presseverykey/everywhere-eagle-viewer)
and inspired me to [fix some bugs](https://github.com/presseverykey/everywhere-eagle-viewer/issues/3) and create derived software.

Rendering test with [BrowserStack](https://browserstack.com)
