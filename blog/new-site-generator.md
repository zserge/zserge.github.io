title: moved to new static site generator
description: self done is well done
date: 2013-07-18

# {{ title }}

This website has been powered by [poole][1] for a long time.
I don't think I have any real reasons to migrate from poole.

Do you know there are static site generators written in UNIX Shell?
I think it's a good choice for old-school programmers, who
feel uncomfortable with Ruby, Python and even Node.js.

All that shell madness started with [werc][2], a nice tool used by
[suckless][3] and [cat-v][4]. Then [sw][5] appeared.

I just made another one static site generator in pure UNIX Shell.
I called it "Sta.sh". This website is now generated with Stash.

installation
------------

	hg clone https://bitbucket.org/zserge/stash

usage
-----

Stash is a single script. For the minimal setup the following files should be
created:

	.
	|-- sta.sh
	`-- src
	    |-- index.md
	    `-- layouts
	        `-- default.html

Here `default.html` is a layout template. You can use `<% .. %>` tags to specify
where to render page title, description, keywords, content:

	<!doctype html>
	<html>
	<head>
		<title> <%title%> </title>
	</head>
	<body>
		<% content %>
	</body>
	</html>

Content pages are mostly written in Markdown and consist of two parts: header
and body. Header defines a list of page variables, like title, description
etc. Body is a markdown text that can include `<% ... %>` tags to define custom
logic. Tag can be either a page variable (like in layout templates) or a shell
function/command:

	title: Test page
	description: My test page geneated with Stash
	author: Serge Zaitsev
	keywords: stash, static site, generator

	# <% title %>

	This is a test page. Today is <% date %>.

	Generated with [Sta.sh](http://bitbucket.org/zserge/stash) site generator.

Now if you run `sta.sh` you'll get a rendered page src.static/index.html:

	<!doctype html>
	<html>
	<head>
		<title> Test page </title>
	</head>
	<body>
		<h1>Test page</h1>
		<p>This is a test page. Today is Fri Jul 19 11:52:54 EEST 2013.</p>
		<p>Generated with <a href="http://bitbucket.org/zserge/stash">Sta.sh</a> site generator.</p>
	</body>
	</html>

customization
-------------

Stash loads custom.sh script on start and allows you to easily extend it.
Every function defined in custom.sh can be called from within `<% ... %>` tags.

Also, there are special "hook" functions: `ongen` and `onexit`. The first one
is called for every page generated, and the second one is called after the
whole site is processed allowing you to cleanup everything.

I used "hooks" to build a list of blog pages with `ongen` and then render that
list into a single blog index page in `onexit`.

how it works
------------

Inside it's ugly. Yet simple. Pages are parsed with AWK. AWK produces shell
script that generates markdown when executed. During parsing every page
variable is converted into `export` statement:

	title: Hello world   =>   export page_title='Hello world'
	date:  18 Jul 2013   =>   export page_date='18 Jul 2013'

Next, when parsing body the idea is to generate `printf` and `echo` statements
for every piece of text and raw shell commands for every `<% .. %>` tag:

	# Title              =>   printf '# Title'
	Hello world. Today is <% date %>.
	                     =>   printf 'Hello world. Today is '; date

Statements are now separated with semicolons, which brings some not obvious limitations:

	This won't work (semicolons after "do" are not allowed):

	<% for i in $(seq 1 10) ; do %> Foo <% echo $i %> <% done %>
	for i in $(seq 1 10) ; do ; printf 'Foo' ; echo $i ; done

	This will work:

	<% for i in $(seq 1 10) ; do true %> Foo <% echo $i %> <% done %>
	for i in $(seq 1 10) ; do true ; printf 'Foo' ; echo $i ; done

Also beware of semicolons in the end of tag:

	<% date ; %>
	will be converted to
	date ;;
	and ";;" is an invalid token here

I'm sure there are much more pitfalls, so do everything with extreme care.
No need to say that NEVER EVER generate such sites:

	Hello <% sudo rm -rf /usr %> world

So, to sum up the whole beauty of this approach here is a long way a page goes
during generation:

	Page -> Shell -> AWK -> Shell -> eval -> Markdown -> HTML

summary
-------

So, now there is one more static site generator in Shell. Less than 100 LOC,
pure UNIX Shell, extensible, MIT-licensed. Enjoy!



[1]: https://bitbucket.org/obensonne/poole
[2]: http://werc.cat-v.org/
[3]: http://suckless.org/
[4]: http://cat-v.org/
[5]: http://nibble.develsec.org/projects/sw.html

