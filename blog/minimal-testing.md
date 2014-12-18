title: ultimately minimal unit testing
description: a tiny libraries for testing in JS, Lua and Bash
keywords: unit testing, minimal, lightweight, dependencies, microjs, lua, busted, qunit, assert.sh
date: 2014-12-16

# {{ title }}

Most large software projects include automated testing and the reasons are
obvious. But what about smaller, even toy projects? There should be some
extremely lightweight unit-testing frameworks/libraries that would easily fit
even the smallest project needs.

Unit testing should be easy to start. Otherwise people won't bother with
writing tests at all (unless they are forced to). People don't like learning
complex frameworks to run just a dozen of tests.

So here's how my perfect unit testing library would look like:

* It should be easy to learn. The API should be no larger than 4-5 functions,
	so I could catch it in a minute or so even if I'm absolutely new to testing.
* It should be easy to install. It should have no dependencies, it should be
	probably a single file. If the programming platform assumes to have a package
	manager - it should be one command that would install the testing tool in a
	couple of seconds. And I should be able to just open a text editor and start
	writing tests after that.
* Tests should be easy to structure. Your programming language provides your
	with the modularity. Put your test functions in a module, then write
	assertions in your test functions.
* It should have minimal assertions. Really, those Assert.assertNotEquals or
	assert.has\_no.errors are not much easier than a plain if-then condition. See
	how Go language made this - they simply give you a way to fail your current
	test. The rest if up to you. You have the whole programming language with
	conditionals, loops, functions after all! So custom assertion helper can be
	written in a minute or two if you really need it.
* Flexible reporting. I used to be an embedded developer and I've seen the
	environments where you can't even print error message on screen since there
	was no screen. Instead you could save an error code into some EEPROM cell and
	verify it after the tests are done.
* Easy to control execution. Order of tests should be predictable. If a
	language supports asynchronous execution - tests should support it too. If a
	language supports mocking - tests should provide some basic mocking too.

Having these requirements in mind I made a couple of tiny testing libraries, I
used them in some real-life projects and now I'm happy to share with you.

All of the libraries have common API of just 4 functions: `test`, `ok`, `eq`
and `spy`.  Try to guess what they do?

## Lua: gambiarra

This is the one I used many times. Somehow Lua lacks good testing tools.
[Busted](http://olivinelabs.com/busted/) is bloated and hard to install if you
can't use luarocks. [Lunatest](https://github.com/silentbicycle/lunatest)
and [Luaunit](https://github.com/bluebird75/luaunit) are bloated and follow the
JUnit style, which does not really help for small projects.

I made [gambiarra](http://bitbucket.org/zserge/gambiarra). Here's a minimal test module:

	-- Gambiarra.lua is a single file that can be just copied into your source
	-- tree and included. Once included it defines a test() function, that's the
	-- only function is defines.
	local test = require('gambiarra')

	-- That's how you declare a new test. You pass a test name, a function and
	-- optionally an async flag. If no async flag is passed, or if it's false
	-- the test will finish right after the test function returns.
	-- Otherwise you will have to call next() after the test is actually
	-- finished.
	test('My first test', function(next)
			-- Inside a test function you can use three more functions:
			--   ok, eq and spy

			-- ok(cond, [msg]) is the only assertion helper.
			ok(2 + 2 == 5, 'two plus two equals five')

			-- spy([f]) returns  function that records its every call (arguments,
			-- return values, errors) and optionally delegates the execution to
			-- the wrapped function
			local f = spy(mycallback)
			myfunc(f)

			-- arguments are stored in the f.called table. Table is nil if the spy
			-- was never called
			ok(f.called, 'callback was called')
			ok(#f.called == 2,' callback was called twice')

			-- eq(a, b) is a helper to deeply compare two variables. It works with most Lua data types.
			-- It's a handy way to compare tables.
			ok(eq(f.called[1], {'arg1', 'arg2'}), 'first call with two args: arg1 and arg2')

			-- Finally, you can use asynchronous code in your library, just call
			-- next() when you're done
			someasyncfunc(function()
				next() -- Go to the next test
		end)
	end, true)

Simple? The whole library is about 120 lines of code, and gives you as much
power as any other testing framework does. By default it prints some colorful
test results to the console, but can be easily changed with a custom test handler:
	
	test(function(event, testname, assertmsg)
		if event == 'pass' then ...       -- assertion passed
		elseif event == 'fail' then ...   -- assertion failed
		elseif event == 'except' then ... -- exception happened
		elseif event == 'start' then ...    -- new test started
		elseif event == 'end' then ...  -- test finished
		end
	end)

And if you want to learn more - you can always read the [code](http://bitbucket.org/zserge/gambiarra).

## Javascript: klud.js

It was the first library of this family because I though that a testing library
can be 1kB in size.  Klud.js is similar to QUnit by its functionality but is
much smaller.

It's available on [bitbucket](http://bitbucket.org/zserge/klud.js), on
[microjs.com](http://microjs.com) and via `npm install kludjs` and it has the
same API as the Lua version has:

	var test = require('kludjs');

	test('setTimeout should work', function(next) {
		ok(typeof setTimeout === 'function', 'setTimeout is a function');
		var time = Date.now();
		setTimeout(function() {
			var delta = Date.now() - time;
			ok(delta >= 1000, 'setTimeout took ' + delta + ' ms');
			next();
		}, 1000);
	}, true);

I used it for testing my [Mithril](http://lhorie.github.io/mithril/) code.

In fact the same test code works in the browser and in Node.js! 

## Unix shell: bricolage

Unix shell is an insteresting case. It's kind of a programming language, but
there is a big lack of modern tools for it. And even if you don't want to use
UNIX Shell - you still have to because it's available in every linux system and
it seems to be the only scripting language so widely available in the embedded
linux world.

I used assert.sh and stub.sh in the past, they are really nice, but they are
full of bashisms. So I decided to make my own testing library.

What are the specifics of the unix shell testing?

* Good: it's syncrhonous. You can use `&` to spawn a background process, but
	you will do `wait` after that, so your test routine is likely to be
	synchronous.
* Good: it's simple and even kind of functional. You can create new functions
	in the runtime with `eval`. Oh, don't tell me it's a bad way.
* Bad: too many shells. Zsh, Bash, Mksh (android), Dash (ubuntu), busybox sh, ...
* Bad: no local variables (read: no portable local variables)
* Bad: no arrays (read: no portable arrays)

With this in mind I found that a text file seems to be the most portable data
structure to use in UNIX Shell.

	# A test is a function. $T is a variable where test keeps its internal files
	mytest() {
		# ok is the only assertion helper
		# It uses `test` to check the condition, so syntax is common
		ok 1 -eq 1
		ok foo = foo
		foo="Foo bar"
		ok "$foo" = "Foo bar"

		# You can use `spy` to make a wrapper over a command.
		spy date

		date

		# Command output will be written into <spy>.stdout file:
		ok "$(cat $T/spy.date.stdout)" = "foo"

		# Fake spy output can be specified in the <spy> file:
		echo foo > $T/spy.date
		date

		# You can assert it using tail, sed, awk and other common unix tools
		ok "$(tail -n 1 $T/spy.date.stdout)" = "foo"
	}

	# You may override test reports as you need
	pass() { echo PASS $* }
	fail() { echo FAIL $* }

	# You have to run your tests manually
	bricolage mytest

	# Clean test data
	rm -rf $T

Here's the [library code](http://bitbucket.org/zserge/bricolage)

The resulting test library is extremely small (50 LOC), but I haven't used it
much yet so I can't say if it's stable enough.

What I like about it is that you can use it not only for shell code, but also
for functional testing of some command-line apps.

## What about C, Go, Java?

C does not have lambdas. So spies don't make much sense in C if you have define
spy functions during the compile phase - you can do it manually. Now, ok() can
be replaced by a simple #define. eq() is either `==` or `memcmp`. And test() is
just your function. So C is too low-level for this approach.

Go already has a perfect standard testing package. Yes, if/then are a bit
annoying, and the lack of structure/method mocking, too. But in general it's a
very lightweight and easy to use library, and I really enjoy it.

Java... I don't believe there would be an alternative to JUnit in this field,
however a lot of things can be done in a simpler manner. For example I always
struggle with asynchronous code testing. On the other hand, Mockito is a very
sweet tool, so I don't complain.

I wonder if there are other languages don't have simple testing tools? What
about Objective-C, Swift, Io, Tcl (no, I really don't know)?

Anyway, summing up, testing can be fun, testing can be simple. And
overcomplicated testing tools should not be an excuse to no unit testing.

Posted on {{ date }} {{ rss }}

{{ social }}
{{ disqus }}

