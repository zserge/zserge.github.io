title: AAML - another android markup language
description: writing android XMLs is easy now
date: 2013-04-02

# <% title %>

Sometimes I do android apps development. I use terminal, tmux and vim - no
Eclipse, no IntelliJ Idea or other IDEs.

What I don't like in android development is XMLs. It's a lot of typing, and I
don't like to type a lot. So, here's my attempt to make it easier for those
who use minimal tools for android development. Maybe it would work for Eclipse,
too.

Goals
-----

* Simple syntax: minimal punctuation, no closing tags
* Should suit for most XMLs: layouts, values, strings etc.
* Should have macros support to extend language and to define variables
* Should work on Linux, Macs and probably Windows

Example
-------

A piece of code paints a thousand words.

Here's AAML markup you edit manually:

	:LinearLayout layout fill, padding 0dp 16dp, orientation vertical
			:EditText
					layout fill wrap
					hint @string/to
			:EditText
					layout fill wrap
					hint @string/subject
			:EditText
					layout fill 0dp 1
					gravity top
					hint @string/message
			:Button#btn_send
					layout 100dp wrap
					gravity right
					text @string/send

And here's what you get after converting it to XML:

	<?xml version="1.0" encoding="utf-8"?>
	<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
			android:layout_width="fill_parent"
			android:layout_height="fill_parent"
			android:paddingTop="0"
			android:paddingBottom="0"
			android:paddingLeft="16dp"
			android:paddingRight="16dp"
			android:orientation="vertical">
			<EditText
					android:layout_width="fill_parent"
					android:layout_height="wrap_content"
					android:hint="@string/to" />
			<EditText
					android:layout_width="fill_parent"
					android:layout_height="wrap_content"
					android:hint="@string/subject" />
			<EditText
					android:layout_width="fill_parent"
					android:layout_height="0dp"
					android:layout_weight="1"
					android:gravity="top"
					android:hint="@string/message" />
			<Button
					android:id="@+id/btn_send"
					android:layout_width="100dp"
					android:layout_height="wrap_content"
					android:gravity="right"
					android:text="@string/send" />
	</LinearLayout>

Sounds easy, right?

Implementation
--------------

I've picked Python 3 to write AAML converter (though with python2 it seems to
be working, too). Basically, AAML has three parts: reader, processor and writer.

Reader is simple: everything that starts with a colon is a new element.
Indentation level allows to nest elements.  Next, element attributes are comma
separated and comma is automatically inserted after the end-of-line.  Normally
the first word in the element is tag name, you should not use newline or comma
to separate it form the element attributes. That's the whole syntax of AAML.

Writer is simple, too. It just pretty-prints all elements.

Processor expands aliases and macros.

Alias is a single word that is substituted by another word. Useful for defining variables.

Macro is a bit more complex. It has a name and a list of arguments. When
expanded, first all arguments are expanded (if they are aliases), then a
suitable macro is looked up in the environment and processed.

Here's how it looks like. To define a macro use `def` tag (yeah, `def` is a
keyword, you can't make an XML element called `def`). Then you write macro name
and a number of arguments it supports. Macros can be overloaded, but no support
for variable number of parameters so far. Then you write macro body. You can
refer to macro parameters as positional arguments, e.g. `$1`, `$2` etc.
Here's an example of some layout macros:

	# Aliases
	:def fill fill_parent
	:def wrap match_parent
	:def match wrap
	# Macros
	:def layout:3 layout_width $1, layout_height $2, layout_weight $3
	:def layout:2 layout_width $1, layout_height $2
	:def layout:1 layout $1 $1

	:TextView
		layout fill
	:TextView
		layout fill match
	:TextView
		layout fill match 1

There are two more things to mention. Comments are allowed, but should take a
separate line and start with `#`. Also, as you use android:id frequently, you
can use syntax sugar like `TextView#my_text` to define a new id `my_text` (as
an alternative to `TextView id "@+id/my_text"`).

Usage
-----

You can get the sources at
[https://bitbucket.org/zserge/aaml](https://bitbucket.org/zserge/aaml).
You need Python to run it. No other dependencies required. If you use Vim there
is also a tiny syntax highlighting script included (see `aaml.vim`).

You can process either files or directories, like:

	# Read from stdin and write to stdout
	$ aaml - -
	# Convert one file
	$ aaml my_layout.aaml my_layout.xml
	# Convert all *.aaml files from directory aaml to *.xml files 
	# in the directory res
	$ aaml aaml res

You can always use `custom_rules.xml` to build XMLs from aaml files
automatically with `ant debug` or `ant release`:

	<?xml version="1.0" encoding="UTF-8"?>
	<project>
		<target name="-pre-build">
			<exec executable="aaml">
				<arg value="aaml"/>
				<arg value="res"/>
			</exec>
		</target>
	</project>

No need to say that it's pretty much unstable yet and has issues. So, you are
welcome to report them.

Volunteers needed to add more syntax highlighting modules for Sublime Text,
Emacs and other popular editors, to suggest standard macros for android
development and to do testing.

AAML is free software and distributed under MIT license.

Posted on <% date %> <% rss %>

<% disqus %>

