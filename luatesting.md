title: luatesting - micro-pico-tiny framework for Lua unit testing

Luatesting
==========

luatesting was born in sin, because the reason to create is was a 
[NIH](http://en.wikipedia.org/wiki/Not_invented_here) principle
(Not Invented Here).

Philosophy
----------

Yes, I know about [xUnit](http://en.wikipedia.org/wiki/XUnit). 
But I don't like it. 
It is good for huge enterprise-level apps. But I don't write 
enterprise apps.
It is good for object-oriented languages. But Lua is not that
object-oriented.

Have you heard about Go language [testing](http://golang.org/pkg/testing/)
package? That's what I kept in mind when writing luatesting.

Code
----

The code repository is stored on 
[bitbucket](https://bitbucket.org/zserge/luatesting/)

API is simple - there is just one function: `testing.run()`

You should use it like:

	MyTestCase = {}
	function MyTestCase.test_some_stuff(t)
		....
	end
	function MyTestCase.test_other_stuff(t)
		....
	end

	local testing = require("luatesting")
	testing.run()

When `testing.run()` is called - all your global tables are scanned, and
all methods containing the word "test" in the name are called.

Sounds easy?

How to test
-----------

That was how to organize your test cases. Now let's see how to test a
single case. 

Every test case gets a single parameter - an object, called `t`.

There is no `assertEquals()` and friends, just a single object to report
you test state. The `t` object has two methods:

* `t.Error(msg)` - print a message, mark this test as failed, but continue
	running this test. There can be several errors in a single test
* `t.Fail(msg)` - print a message, mark test as failed and terminate it

If nothing was done to the `t` object - the test is passed successfully.

Here's an example of a test case:

	ParserTest = {
		p = parser_create()
	}

	function ParserTest:test_single_number(t)
		n = self.p:parse("123")
		if n ~= 123 then 
			t.Error("Failed to parse 123") 
		end

		n = self.p:parse("0.123")
		if n ~= 0.123 then 
			t.Error("Failed to parse 0.123") 
		end
	end

	function ParserTest: test_array(t)
		a = self.p:parse("[ item1, item2, item3 ]")
		if #a ~= 3 then
			-- We fail here, because there is no reason to continue
			t.Fail("Array length is not 3")
		end

		if a[0] ~= "item1" or a[1] ~= "item2" or a[2] ~= "item3" then
			t.Error("Array contents are wrong")
		end
	end

	testing = require("luatesting")
	testing.run()

Here's good output:

	OK:	test_single_number
	OK:	test_array

If something goes wrong you will see messages like this:
	ERR:	Failed to parse 123
	ERR:	Failed to parse 0.123
	FAIL: Error length is not 3

Other info
----------

My experience with Lua is VERY little, so if it's not enough Lua-esque - 
let me know how to improve it. Thanks!

