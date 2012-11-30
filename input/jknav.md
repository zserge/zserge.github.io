title: jknav for Chrome and Firefox
keywords: jk, hjkl, vi-like, firefox, chrome, extension, vimperator, vimium

-----

jknav
=====

jknav is a simple vi-link j/k navigation and link hinting extension for Chrome
and Firefox.

I have to apologize to real javascript developers for my ugly code. 
Any advice from experienced developers in this area is appreciated ;)

why not use Vimperator/Vimium?
------------------------------

I really like that extensions, they are powerful and behave much like Vim.  On
the other hand, I'm used to native hotkeys, like Ctrl-D to add to bookmarks
(not scroll half-page down) etc. I'm quiet happy with the default hotkeys,
except for j/k, which is much nicer than arrow-up/arrow-down. Also, link
hinting saves time for me and makes web surfing possible without using mouse at
all.

That's why I wrote my own tiny extrension for this limited purpose.

usage
-----

Extension sources are hosted on [bitbucket](https://bitbucket.org/zserge/jknav).
Also, one can get there prebuilt
[*.xpi](https://bitbucket.org/zserge/jknav/downloads/jknav.xpi) and
[*.crx](https://bitbucket.org/zserge/jknav/downloads/jknav.crx) packages.

Installation can be tricky, so for Chrome you should open "Extensions" page
(from Menu-Tools), then drag-n-drop the *.crx file from the file manager.

Firefox users should open Tools-Addons window, then pick "Install Add-on From
File..." option in the dropdown menu. Restart is required for extension to
load.

After the plugin is installed, use 'j' and 'k' to scroll page down and up.

Use 'f' to highlight links, then type a number corresponding to the link you
want to follow. If your number is too short (e.g. there is link '2', '21', '22', ...
and you want to follow the link '2') - press ENTER to confirm your choice.

other info
----------

As I have very limited experience in javascript I must warn you that this software
have tons of bugs. The good news is that it's open-source and distributed under
MIT license, so feel free to modify it if you need.
