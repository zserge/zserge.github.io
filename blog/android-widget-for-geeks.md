title: textizer: hack your android widgets
description: Never thought of writing your own android widget?
keywords: android, home screen, widget, text, minimalism, weather, clock, DIY, hack
date: 2012-08-25

# {{ title }}

I like the idea of Android home screen widgets. I like to visualize
information, to get it quickly and perform common tasks in a single tap.
Even though Android market is flooded with useful and not-so-useful widgets of
any type and price, I was looking for a _geeky_ way to make my own widgets.

why?
----

Normally, I need either very simple widgets (like clock, calendar, weather,
battery level) or very specific ones (say, a calendar that draws a date in red
if it's a holiday in my country). And I want to have a single app to deal with
all those widgets.

Next, I'd like to share my widget settings with others and backup widgets 
in a simple way - in other words, I want my widget settings to be stored in a
file. Preferably, a [plain text file][plaintext].

Finally, for my very custom widgets I'd like to customize everything: colors,
fonts, layout etc. So, I'll need some kind of a programming language and maybe a
simple markup language to do that.

In other words, all I need is a "DIY widget for geeks". And all I have for now
is an early prototype with bugs and limited functionality. I'll describe it
below and you will be able to try it out by yourself. 

how it works?
-------------

You install a single app. Then you add a widget and give it a name. This name is
a name of the widget's configuration file (widget script).

Then you open that script with any text editor right on your phone/tablet, or
on the PC if you don't like on-screen keyboards (don't forget to copy the file
back to the device after you've modified it). It's just a text file, so that
should be easy.

The configuration language must be simple yet powerful. I was thinking of using 
embeddable languages, and my final choice is - [Scheme][scheme]. I use
[Peter Norvig's toy interpreter][jscheme] written in Java. Even though it's
very old, and the code is not the state-of-the-art, I still like it, because:

* it's very minimalistic
* it's easy to learn (simple syntax, the number of standard procedures is very 
	small), easy to extend, easy to integrate with Java
* it's very lightweight - added about 40kB to my APK size
* it's somewhat slow, but this is not critical for widgets - they are not
	frequently updated.
* finally, it's a nice chance to learn Scheme by myself, as I have never used
	it before :)

To sum up, you write a Scheme script that tells how your widget looks like and
how it works - and that's all you do to set up a widget.

first steps
-----------

If you still want to try Textizer at your own risk - let's start with
downloading an [*.apk][apk] and install it on the device. Then add a new
textizer widget to your home screen - for example, 'Textizer 1x1'. You'll see a
window asking you for a new widget name.

In this example we'll make a simple calendar widget showing current date, so
let's name a widget - 'calendar'. After you press 'Ok' button, a new scheme
script will be created at the
`<sdcard>/Android/data/trikita.textizer/files/calendar.scm`.

If you have a text editor on your device - you can directly open that file,
otherwise - use any text editor on your PC (in this case you'll have to copy
scripts to and from the device manually using `adb push/pull`, AirDroid, your
android file manager capabilities etc).

Here's the initial contents of the calendar.scm file:

	; auto-generated template for 'calendar' widget
	(grid 1 1 "80333333" 60)
	(cell '(1 1 1 1) "calendar")

`(grid ...)` and `(cell ...)` are the functions to create a grid-based layout.
In the example above we've created a 1x1 grid with the background color
"#80333333" (semi-transparent gray) and update interval of 60 seconds. Inside
the grid we've created a single 1x1 cell at the top left corner (with
coordinates x=1, y=1) and with text "calendar" on it. If you change the text
(and copy the file back to the device if you did editing on the PC) you'll see
the widget has changed, too.

grid-based layout
-----------------

Grid-based layout is easy to implement, easy to understand and it should work
for most cases. You can take a widget as a regular grid of the given
width and height. For example, here's a grid of size 4x2:

	+--+--+--+--+
	|  |  |  |  |
	+--+--+--+--+
	|  |  |  |  |
	+--+--+--+--+

Every logical cell inside a grid can take several grid cells, for example in
the picture below you can see 3 logical cells (named A, B and C) - in the
widget script their positions will be described as'(1 2 1 1), '(2 1 2 2) and '(4
1 1 1):

	+  +--+--+--+
	   |     |C |
	+--+  B  +--+
	| A|     |   
	+--+--+--+  +

The first two numbers in the cell rectangle are coordinates of the logical cell
in a grid, and the last two numbers are width and height.

This layout can be produced by a script like:

	(grid 4 2 "black" 60)
	(cell '(1 2 1 1) "A")
	(cell '(2 1 2 2) "B")
	(cell '(4 1 1 1) "C")

Every logical cell has its own content, font style, alignment etc. For now the
only things common for the whole grid (the whole widget) are background color
and update interval.

The sample script above is pretty much useless as it displays just static plain
text content. How can we make cell content dynamic?

cell providers
--------------

Every cell has a provider. A provider can be a string (we've seen above), a
function or a lambda (an unnamed function). Provider function is being executed
every time the widget is updated. Provider function sets cell style and returns
a text to be written inside the cell.

Before going to the textizer internals, I'd like to remind you the basics of
Scheme syntax. To call a function instead of `func(arg1, arg2, arg3) you are to
write `(func arg1 arg2 arg3)`. Normally, arguments are evaluated before passing
to the function. If you want something not to be evaluated - use a quote
symbol, for example:
	
	(write (+ 1 2))     ; will print "3"
	(write '(+ 1 2))    ; will print "(+ 1 2)"

So, the second argument of the `(cell '(x y w h) ...)` function is a content
provider. If it's a name of the function - quote it. Otherwise it will be
evaluated only once (when the cell is created), but not every time the widget
is updated. You can pass an arbitrary number of arguments to the provider
function - just write them one after another after the provider name.

Here's a sample usage of a simple clock provider:

	(cell '(1 1 1 1) 'clock "HH:mm")

Here we assign a clock provider with the format string of "HH:mm" to the cell.

We can create our own providers easily. Here's the sources of our calendar
widget script:

	(grid 1 4 "#ff333745" 60)

	(define (string-upcase s)
		(list->string (map char-upcase (string->list s))))

	(cell '(1 1 1 1) 
		(lambda ()
			(style '(color "#fff6f792") '(font "sans" 18))
			(string-upcase (clock "MMM"))))
			
	(cell '(1 2 1 2) 
		(lambda ()
			(style '(color "#fff6f792") '(font "bold" 36))
			(clock "dd")))
					
	(cell '(1 4 1 1)
		(lambda ()
			(style '(color "#fff6f792") '(font "bold" 18))
			(string-upcase (clock "EEE"))))

And the result is:

![Widget 1x1](/images/textizer-calendar-1x1.png)

Here's an example of another widget created with textizer (converting time to
text and pretty-printing is done purely in Scheme):

![Widget 0x1](/images/textizer-widget-4x1.png)

Here's a list of functions you can use to customize your textizer widgets:

* `(grid width height color interval)` - creates a grid layout
* `(cell rect provider provider-args ...)` - defines a new cell inside a grid. 
	`rect` is a list of 4 numbers - `(x y width height)`.
* `(clock format)` - returns a string representing current time according to the
	`format` string. `format` is the same as in [SimpleDateFormat][datefmt] class
	documentation.
* `(style '(param value) ...)` - defines new painting style. `param` can be one
	of:
	* `'(color color-string)` - defines font color.
	* `'(font name size)` - defines font style and size. `name` is one of "sans",
		"serif", "mono" or "bold".
	* `'(align horiz-align vert-align)` - defines an alignment. Can be "left",
		"right", "top", "bottom" or "center".

As it's just a proof-of-concept the customization is very limited. In future I
think of extending it.

is there any future for textizer?
---------------------------------

Textizer is still in its early stage. What's to be implemented
next?

* more providers (battery, wifi, gps...)
* add actions to the grid, e.g. what to do when the widget is tapped
* add more style options, like padding, drawing primitives (e.g. lines), custom
	font support
* add support for global variables, that are stored between provider function
	calls (there is a chance that the application will be stopped and re-started
	between the widget updates)
* add support for networking to fetch provider content from web services
* create more examples and maybe a repository with useful widget scripts

So, what do you think? Is there any sense in such a widget for geeks?

P.S. Textizer is open source, free and with no ads. The sources are [hosted on
bitbucket][sources].



[plaintext]: http://c2.com/cgi/wiki?PowerOfPlainText
[scheme]: http://en.wikipedia.org/wiki/Scheme_(programming_language)
[jscheme]: http://norvig.com/jscheme.html
[apk]: https://bitbucket.org/zserge/textizer/downloads
[sources]: https://bitbucket.org/zserge/textizer/
[datefmt]: http://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
