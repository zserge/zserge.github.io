title: mucks: now with the dvtm flavor!
description: mucks - a tiny session manager for tmux, screen and dvtm
date: 2014-06-07

# {{ title }}

Somehow refactoring turned info rewriting from scratch... So, meet the new
shiny [mucks app](https://bitbucket.org/zserge/mucks) written in AWK language
(instead of UNIX Shell).

I played with quotes in tmux "send-keys" command, and it turned out that
different shells treat quotes in the "read" command very differently, and I found
no easy way to overcome it.

That's how AWK came to the rescue. A more mature, yet much simpler language
made my code cleaner and shorter.

Users would not notice it, since the configuration file syntax remains the
same.

## Previously on "Mucks"

For those who missed the [first part](http://zserge.com/blog/mucks.html) - the
session configuration file is normally called `.mucksrc` and stays in the
directory you call mucks from (e.g. `cd myproject && mucks`).

File has two parts: header and layout declaration.

Header may declare some session-wide variables, e.g.:

* `mux: <tmux|screen|dvtm>` - the default muxer. If not specified - it will be
	takes from the `$MUCKS` variable or defaulted to "tmux" if that is empty,
	too.
* `name: <string>` - any string to use as the terminal title (warning: tmux may override it if `set-titles` option is set).
* `dir: <path>` - project working directory used by default for all panes. May contain "~" or be a relative path.
* `pre: <command>` - shell command to be executed before launching the muxer. Executed once on mucks start.
* `prewnd: <command>` - Similar, but executed inside every window pane.

Below the pane layout is described. Section names are panes and content in
between is just typed into the pane, e.g. this will open vim and type "hello"
in it:

	[vim]
	vim
	ihello^M

## Hooks

Since mucks is targeted to many popular muxers - I decided to leave the
unification of them up to you. I believe people don't often use two different
muxers on the same project.

Anyway, now you can insert **any** internal muxer commands anywhere in the
layout. Only those that match the current muxer will be executed. For example:

	[vim]
	vim
	- tmux split-window -v
	- screen -X split

This will execute `split-window` command if run with MUCKS=tmux and `split`
command if run with MUCKS=screen

A special case for the hook is a shell hook starting with "sh". That's
extremely helpful for controlling ncurses apps and I think I beat the
Tmuxinator here (last time I checked it - it could not change the colorscheme of my vim):

	[vim]
	vim
	- sh sleep 0.2
	:colorscheme less

Here the `colorscheme` command will be executed 200ms after the vim has
started and it works fine. But if you type it immediately - most like it will
not be interpreted by vim at all.

## DVTM

I think that [DVTM](http://www.brain-dump.org/projects/dvtm/) is a very nice app. Even
though I prefer tmux - I really like the simplicity of the DVTM and the look.

With a tiny modification it can be controlled with mucks as well! You will need
to enable "send" command in your config.h so you could send actual commands to
the named pipe when the DVTM is in the background:

	--- config.h	2014-07-07 17:33:44.777186966 +0300
	+++ config.def.h	2014-07-07 16:44:34.265263378 +0300
	@@ -147,7 +147,6 @@
	 
	 static Cmd commands[] = {
		{ "create", { create,	{ NULL } } },
	-	{ "send", { send,	{ NULL } } },
	 };
	 
	 /* gets executed when dvtm is started */

Also, you should use it in pair with
[abduco](http://www.brain-dump.org/projects/abduco/) (which a believe you already do
if you picked DVTM).

So here's how these three great muxers look when controlled by mucks with the same environment:

	dir: /tmp

	[vim]
	vim
	- sh sleep 0.1
	iint main() { printf("Hello!\n"); }
																		 
	[foo]

	[bash]
	man 3 printf

`MUCKS=tmux mucks`:

![Tmux](/images/mucks3.png)

`MUCKS=screen mucks`:

![Screen](/images/mucks4.png)

`MUCKS=dvtm mucks`:

![DVTM](/images/mucks5.png)

So, what's your favourite terminal multiplexor?





