title: The most simple JSON parser in C for small systems
keywords: json, parse, c, unix, embedded, KISS, minimal, memory allocation
description: a fast and small JSON tokenizer and parser (sort of)
---

JSMN
====

jsmn (pronounced like 'jasmine') is a minimalistic JSON parser in C.  It can be
easily integrated into the resource-limited projects or embedded systems.

You can find more information about JSON format at [json.org][1].

Library sources are available at [bitbucket.org/zserge/jsmn][2].

Philosophy
----------

Usually JSON parsers convert JSON string to internal object representation.
But if you are using C it becomes tricky as there is no hash tables, no reflection etc.
That's why most JSON parsers written in C try to reinvent the wheel, 
and either invent custom JSON-like objects, custom hash maps, or use callbacks
like SAX parsers do.

jsmn is missing all that functionality, but instead is designed to be
**robust** (it should work fine even with erroneous data), **fast** (it parses
data on the fly and is re-entrant), **portable** (no superfluous dependencies
or non-standard C extensions). And of course, **simplicity** is a key feature.

Features
--------

* simple
* highly portable (tested on x86/amd64, ARM, AVR)
* compatible with C89
* no dependencies (even libc!)
* no dynamic memory allocation
* extremely small code footprint - it's just about 200 LOC
* API has only 2 functions
* incremental single-pass parsing
* library code is covered with tests

Design
------

jsmn splits JSON string into **tokens**. Let's consider a JSON string:

	'{ "name" : "Jack", "age" : 27 }'

jsmn will split it into the following tokens:

* Object: `{ "name" : "Jack", "age" : 27}` (the whole object)
* Strings: `"name"`, `"Jack"`, `"age"` (keys and some values)
* Number: `27`

The key moment is that jsmn tokens **do not hold any data**, 
but just point to the token boundaries in JSON string instead. 
In the example above jsmn creates tokens like: 

* Object [0..31]
* String [3..7], String [12..16], String [20..23]
* Number [27..29].

Every jsmn token has a type which is one of the following:

* Object - a container of key-value pairs, e.g.:
	`{ "foo":"bar", "x":0.3 }`
* Array - a sequence of values, e.g.:
	`[ 1, 2, 3 ]`
* String - a quoted sequence of chars, e.g.: `"foo"`
* Primitive - a number, a boolean (`true`, `false`) or `null`

Besides start/end positions, jsmn tokens for complex types (like arrays
or objects) also contain a number of child items, so you can easily follow
object hierarchy.

This approach provides enough information for parsing any JSON data and makes
it possible to use zero-copy techniques.

Install
-------

To clone the repository you should have mercurial installed. Just run:

	$ hg clone http://bitbucket.org/zserge/jsmn jsmn

Repository layout is simple: jsmn.c and jsmn.h are library files; demo.c is an
example of how to use jsmn (it is also used in unit tests); test.sh is a test
script. You will also find README, LICENSE and Makefile files inside.

To build the library, run `make`. It is also recommended to run `make test`.
Let me know, if some tests fail.

If build was successful, you should get a `libjsmn.a` library.
The header file you should include is called `"jsmn.h"`.

API
---

Token types are described by `jsmntype_t`:

	typedef enum {
		JSMN_PRIMITIVE = 0,
		JSMN_OBJECT = 1,
		JSMN_ARRAY = 2,
		JSMN_STRING = 3
	} jsmntype_t;

**Note:** Unlike JSON data types, primitive tokens are not divided into
numbers, booleans and null, because one can easily tell the type using the
first character:

* <code>'t', 'f'</code> - boolean 
* <code>'n'</code> - null
* <code>'-', '0'..'9'</code> - number

Token is an object of `jsmntok_t` type:

	typedef struct {
		jsmntype_t type; /* Token type */
		int start;       /* Token start position */
		int end;         /* Token end position */
		int size;        /* Number of child (nested) tokens */
	} jsmntok_t;

**Note:** string tokens point to the first character after
the opening quote and the previous symbol before final quote. This was made 
to simplify string extraction from JSON data.

All job is done by `jsmn_parser` object. You can initialize a new parser using:

	jsmn_parser parser;
	
	jsmn_init(&parser);

This will initialize (or reset) the parser.

Later, you can use `jsmn_parse()` function to process JSON string with the 
parser:

	jsmntok_t tokens[256];
	const char *js;
	int r;

	js = ...;
	r = jsmn_parse(&parser, js, tokens, 256);

A non-negative return value of `jsmn_parse` is the number of tokens actually
used by the parser.

Passing NULL instead of the tokens array would not store parsing results, but
instead the function will return the value of tokens needed to parse the given
string. This can be useful if you don't know yet how many tokens to allocate.

If something goes wrong, you will get a negative error returned by
`jsmn_parse()`. Return value will be one of these:

* `JSMN_ERROR_INVAL` - bad token, JSON string is corrupted
* `JSMN_ERROR_NOMEM` - not enough tokens, JSON string is too large
* `JSMN_ERROR_PART` - JSON string is too short, expecting more JSON data

If you get `JSON_ERROR_NOMEM`, you should re-allocate more tokens and call
`jsmn_parse` once again. If you read JSON data from the stream, you can
periodically call `jsmn_parse` and check if return value is not 
`JSON_ERROR_PART` - this will indicate the end of the JSON data.

jsmn stores the offsets inside parser structure, not pointers.
It means you can use realloc() to get more tokens, or reallocated your
`js` string when more data arrives.

Non-strict mode
---------------

By default jsmn is working in a non-strict mode. It allows you to use it for 
other useful formats that JSON. In non-struct mode jsmn accepts:

* non-quoted primitive values other than true/false/null/numbers
* only primitive values without a root object

It means the following text will be valid for jsmn:

	server: example.com
	post: 80
	message: "hello world"

Looks like a config file, right? 
And this is how you can use jsmn to parse JavaScript code:

	{
		server: "example.com",
		post: 80,
		message: "hello world"
	}

To switch to strict mode you should define `JSMN_STRICT` preprocessor variable.

Parent links
------------

In the [benchmark][3] jsmn have shown pretty good results for small objects
(~4KB).  But for large objects it was terribly slow. This can be fixed by
storing links to the parent nodes. You will loose about 4 bytes per token, but
speed will be much higher (by the way, after this little hack jsmn seems to be
**the fastest** parser in that benchmark).

To enable parent links you should define `JSMN_PARENT_LINKS` before compiling
jsmn. 

Links
-----

There are several posts about jsmn around the web:

* [A comparison and microbenchmark of JSON parsers][3] (in Russian)
* [jsmn example, or parsing JSON with C][4]
* [Hacker News post][5]
* [Stack Overflow answer on parsing JSON with ANSI C][6]

Other info
----------

This software is distributed under [MIT license][10]
 so feel free to integrate it in your commercial products.

[1]: http://www.json.org/
[2]: https://bitbucket.org/zserge/jsmn/wiki/Home
[3]: http://lionet.livejournal.com/118853.html
[4]: http://alisdair.mcdiarmid.org/2012/08/14/jsmn-example.html
[5]: http://news.ycombinator.com/item?id=4386834
[6]: http://stackoverflow.com/questions/10674575/parse-json-in-ansi-c
[10]: http://www.opensource.org/licenses/mit-license.php

