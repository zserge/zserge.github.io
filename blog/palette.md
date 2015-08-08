title: How Palette was made
description: clean minimal color scheme picker for traditional palettes: material, flatui, ios, wp7, solarized, tango
keywords: color scheme, color picker, without flash, clipboard, html5, palette, material design, flat ui
date: 2015-08-06

# {{ title }}

[Palette][link] is an open source lightweight color picker for the most famous
color schemes, like Material Design, Flat UI, iOS, Windows Phone etc.

Despite being color blind, I like apps and websites with the right selection of
colors. And sometimes when starting a new project it's easier to pick a color
palette from the existing ones. Or, if you want to meet the guidelines for the
certain platform - you'd better use the colors they offer.

I used [flatuicolors.com](http://flatuicolors.com) for the excellent Flat UI
palette, I used [materialcolors.com](http://materialcolors.com) for picking
Android colors, I used Tango and Solarized when I configured by terminal and
tmux colors. However, I won't be using those websites anymore.

## adobe flash in 2015

Most color picker websites allow you to click on the color and they will copy
the color code to the clipboard. Convenient? Yes. But in 2015 there is [no
universal way to implement clipboard API in the browsers][1]. Flash is the only
solution. Which means you end up with [Zeroclipboard][2] covering each of the color tiles.

It's super ugly. It's super slow. It's [disabled in Firefox by default][3].

## a pragmatic solution

Ok, let's build another color picker website with the pragmatic approach.

Let's put several really good palettes in one place. Only well-known palettes
that are described in some guidelines. For your own custom palettes why not use
[Adobe Kuler][4], which ironically doesn't use Adobe Flash anymore?

Of course, it should be responsive and touchscreen-friendly.

Now, if it's possible to copy data to clipboard automatically - do that. If not
- help user to copy it manually with Ctrl+C. After all, how long it takes you
to press Ctrl+C? I bet it's faster than the animation shown after the color
selection at [flatuicolors.com](http://flatuicolors.com).

And if there is no JavaScript available (yes, lots of people use NoScript) -
just show the color codes and let people either enable JS, or copy the colors
manually.

## markup

The current sources are available at
[http://github.com/zserge/palette](http://github.com/zserge/palette).

I defined all the palettes in `_data.json` and rendered the color tiles in
`index.jade`. I used [harp][5] to build the web page. After the compilation is
done - the static web page will be filled with colorful divs grouped into
the palettes.

Navigation is done by good old anchors, so it works without javascript. Each
palette has a unique anchor, and header navigation menu just contains links to
those anchors.

[Flex boxes][6] made it possible to fill the full screen with the tiles from
one palette and to center/stretch elements without much pain, as it normally
happens with div/float.

## javascript

No jQuery for this project. We target on the latest browsers and using
techniques from [youmightnotneedjquery.com](http://youmightnotneedjquery.com)
is a quick way to make your website lightweight.

When user clicks on the tile - we try to select the color element's text. So
the only thing left to the user after he clicks on the color - is to press
Ctrl+C. Selecting text of the element is easy:

	var range = document.createRange();
	range.selectNode(el);
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);

This works in Firefox, Chrome, and people say it works in IE10.

However, recent Chrome 43 [added the support of the HTML5 Clipboard API][7], so
why not use that?

	// Try to copy color value using HTML5 API
	try {
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
		// If succeeded - show some animation
		el.parentNode.classList.add('clicked');
		setTimeout(function() {
			el.parentNode.classList.remove('clicked');
		}, 100);
	} catch(e) {}

We try to copy the current selection (the one we got after the previous snippet
of code) into the system clipboard. If the browser supports it - we go further,
and do a small animation to give user some feedback that the color was copied.

If not - we fall into the exception handler and leave the text selection as it
was letting the user to press Ctrl+C.

Clipboard API works in recent Chrome and Chrome for Android. Also people
mention it works in Opera, I haven't tested it.

## palette app

So, meet the palette app: [0xrgb.com][link].

You can use it in modern browsers, without flash, even without javascript.

And if you find any issues or have any suggestions - please report an [issue on
github][8].

Posted on {{ date }} {{ rss }}

{{ social }}
{{ disqus }}

[link]: http://0xrgb.com
[1]: http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
[2]: http://zeroclipboard.org
[3]: https://threatpost.com/mozilla-disables-flash-in-firefox/113763
[4]: https://color.adobe.com
[5]: http://harpjs.com/
[6]: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
[7]: https://developers.google.com/web/updates/2015/04/cut-and-copy-commands
[8]: https://github.com/zserge/palette/issues
