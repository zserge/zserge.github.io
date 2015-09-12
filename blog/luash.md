title: "lua-sh: calling shell commands as functions"
description: Subprocess interface for Lua, inspired by Python 'sh' module
date: 2015-09-03
---

# {{ title }}

[Lua] is one of my favourite languages. It's tiny, it's fast, it has simple
grammar and is very easy to learn.

I also often write shell scripts - from simple one-liners, to bigger ones
containing business logic and binding together smaller app components. In fact,
this blog is powered by a few shell scripts to generate list of posts, rss xml
etc.

I had an experience in the past when Bash script became hard to maintain. Then
we moved to Lua, and it was a big relief. Logic became transparent, code became
more readable. However, we had to wrap shell command invocations into
hand-written functions to make them look nice.

So I made a [library] that brings the joy of shell scripting into Lua.

## luash

Inspired by [Python's sh module], I took the same idea.

Every shell command can be invoked as a Lua function. For example, calling `echo hello world` in Lua would be `echo('Hello', 'world')`.

To achieve this I added a handler function for the missing table items in the
globals table. So if the script called a non-existent command (which is likely
to be a shell command wrapper) - my handler function started looking for the
requested shell command and returned an appropriate wrapper function.

``` lua
-- get global metatable
local mt = getmetatable(_G)
if mt == nil then
  mt = {}
  setmetatable(_G, mt)
end

-- set hook for undefined variables
mt.__index = function(t, cmd)
	return command(cmd)
end
```

Then I had to implement the function `command(cmd)` to return a function, which
being invoked would run the actual command with all the arguments.

``` lua
local function command(cmd)
	return function(...)
		-- it could be like this, if we didn't care about intercepting I/O
		os.execute(cmd, ...)
	end
end

...

local date = command('date')
date('--date=2015-09-03', '+%s')
```

At this point, we shall think about the commands chains (pipelines). Lua by
nature is single-threaded and has blocking I/O. Which means you can either read
or write at a time, and you can not do both simultaneously.

So to implement a pipeline the output of the previous command should be
buffered somewhere, and input should be sent using `io.write` function.  Or the
input should be pre-written into some file, and sent to the command using shell
'<' redirection, then the output could be read using `io.read('*a')` function.
Both ways seem to be equally good and help to avoid deadlocks.

Here's much more details about potential pitfalls with [popen read/write].

Finally, the return value of the `command()` function should be a table, and
this table should be accepted by the outer `command()` function (the next one
in a pipeline). I decided to pass only command output, exit code and signal
inside this "command result" table.

And that's all we have underneath the Lua sh module. You can see the [full
implementation of this module] to learn more. It's really tiny, less than 100
lines of sparse code.

## usage

First, require the Lua sh module:

``` lua
local sh = require('sh')
```

At this point global table hook is already set up, you can start running your
shell commands:

``` lua
print('User:', whoami())
print('Current directory:', pwd())
```

Here's how chaining looks like:

``` lua
--
-- Bash equivalents:
--
-- $ ls /bin | wc -l
-- $ ls /usr/bin | wc -l
-- $ (ls /bin; ls /usr/bin) | wc -l
--
print('Files in /bin:', wc(ls('/bin'), '-l'))
print('Files in /usr/bin:', wc(ls('/usr/bin'), '-l'))
print('files in both /usr/bin and /bin:', wc(ls('/usr/bin'), ls('/bin'), '-l'))
```

Also, since command output is buffered, you can store it and reuse as many
times as needed. I personally find Lua syntax even more readable in this case:

``` lua
--
-- Bash equivalents:
--
-- $ s1=$(echo hello world | sed 's/world/Lua/g')
-- $ s2=$(echo "$s1" | tr '[[:lower:]]' '[[:upper:]]')
--
local s1 = sed(echo('hello', 'world'), 's/world/Lua/g')
local s2 = tr(s1, '[[:lower:]]', '[[:upper:]]')
print('sed:',    s1)
print('sed+tr:', s2)
```

You can provide stdin to the commands as a string passing a table with
`__input` key:

``` lua
s = 'Hello World'
tr({__input=s}, '[[:lower:]]', '[[:upper:]]')
```

Finally, commands that don't fit the Lua syntax (like `google-chrome` or `somecommand.bin`). Since we already have a function `command(cmd)` that returns a command wrapper - we can use it, since it's exported by the module:

``` lua
local sh = require('sh')
local chrome = sh.command('google-chrome')
chrome()
```

As a bonus, you can pre-define some command line arguments as well:

``` lua
local sh = require('sh')
local dockerbusybox = sh.command('docker', 'run', 'busybox')
dockerbusybox('echo', 'hello')
```

This is helpful for multi-command binaries, like `git`, `docker`, `ip` or
`busybox`.

Another syntax sugar is named options. You may pass a table instead of variadic arguments, then table keys will be interpreted as option names. Single-letter keys will be used as short options (`o` becomes `-o`), longer keys will be used a long options (`output` becomes `--output`).

``` lua
-- $(seq --separator="," -w 0 10)
seq({
	separator = ',',
	w = true,
}, 0, 10)
```

## summary

The library is super tiny, much more lightweight comparing to Python's sh. And
of course it lacks lots of functionality that Python's sh has:

* Stderr redirection (now stderr messages are printed to lua stderr). This can
	be done via another file I think, but I don't want to mess with shell a lot.
	I hope `<` operator works in most shells, while `>&2 x > y` might not.
* Subcommands as attributes (like `git.branch()`). I don't think this feature
	is needed at all. One can define it easily with sh.command().
* Glob expansion. Again, I don't see how this can be helpful, assuming that Lua
	passes commands via shell anyway, which does glob expansion already. E.g.
	`ls(/tmp/*')` already works.
* No special API for "baking", all is done via the same single `command()` API
	function.
* No "with" contexts (because Lua doesn't have `with` keyword).
* No iterative output. This might be interesting to implement, so one could do
	`for line in tail('-f', 'somefile') do ... done`
* No callbacks to handle stdout/stderr. For most cases I think output can be
	processes after it's fully read.
* No interactive callbacks (like expect for some output, send some input). This
	is because I/O is not suitable for interactive usage in Lua.
* No way to control buffer sizes (again, because we read full output at once).
* No way to set environment variable. Because Lua has no API for that.
* No way to attach tty. Because Lua has no API for that.

This means the library can still be improved. I haven't tried it on Windows,
but I think it should work with minor modifications. Special mode for loops
might be added. Stderr redirection might be added after I ensure that it works
in all modern shells (bash, zsh, busybox, ash, mksh, windows cmd.exe etc).

But the library can already be used for most of the scripting needs. I hope it would help someone, and I'm glad to share it under MIT license.

Please, report any [issues on github] and [pull requests are welcome]!

[Lua]: http://www.lua.org/
[library]: https://github.com/zserge/luash
[Python's sh module]: https://amoffat.github.io/sh/
[full implementation of this module]: https://github.com/zserge/luash/blob/master/sh.lua
[popen read/write]: http://lua-users.org/lists/lua-l/2007-10/msg00189.html
[issues on github]: https://github.com/zserge/luash/issues
[pull requests are welcome]: https://github.com/zserge/luash/pulls
