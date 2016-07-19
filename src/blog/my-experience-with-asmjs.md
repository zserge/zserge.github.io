title: My experience with asm.js
description: Rewriting parts of the app in C to improve performance
keywords: javascript, asm.js, webassembly
date: 2016-07-18
---

# {{ title }}

It all started with [Glitch](http://naivesound.com/glitch), a tiny algorithmic
music composer. I spent lots of time deciding whether I should choose a native
approach (e.g. C++, Qt, RtAudio) or an HTML5 way. After all I decided to give
HTML5 a try - there is JavaScript which I still like, WebAudio that runs
everywhere, UI that can be ported to desktop thanks to
[Electron](http://electron.atom.io/), and I've heard browsers are really good
at performance these days.

My first disappointment was that `eval` was way too slow (and obviously
insecure). So I wrote my own [algebraic expression evaluator](https://github.com/naivesound/expr-js). The speed was good, so I wrote the rest of Glitch (UI, tiny sound processing library) in JavaScript.

It worked really well, until I started writing multi-part polyphonic songs.
Then my browser choked.

If that was Java world, I would rewrite critical parts in C and used JNI. In Go
I would use CGo. In Lua I would write a C module. I've heard that JavaScript
has something similar, too.

## asm.js

Asm.js is annotated JavaScript. It's perfectly valid JavaScript code that runs
in every browser without any special hacks. However, it annotates every
arithmetic operation with data types, so some browsers can optimize it a lot.

Yet nobody really writes asm.js manually because it becomes too bloated, most
people use Emscripten to translate their C code into asm.js. We've all seen
those Quake or Doom or Linux in a browser. That's the result of Emscripten
translation.

Installing Emscripten was easy, it's just a tarball on Linux and Mac:
http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html

But it was much harder to figure out how to compile my C library to asm.js and
how to use it.

## tutorial

Most of the documentation around asm.js is about how to port pure C app
(including the main function) to JS. However, I needed to port a library.

Glitch would be too big for an example, so let's assume our library deals with
Fibonacci numbers - calculates the next fibonacci number and uses Binet's
equation to calculate n-th number:

```c
#include <math.h>

struct fib {
	int now;
	int next;
};

int fib_next(struct fib *f) {
	int tmp = f->now + f->next;
	f->now = f->next;
	return f->next = tmp;
}

static double PHI = 1.6180339887;
int fib_binet(int n) {
	return round((pow(PHI, n) - pow(1 - PHI, n))/sqrt(5));
}
```

Natually, the first thing to try is to run `emcc fib.c` (emcc is Emscripten
compiler). It produces `a.out.js`, a 5000 LOC file with some libc functions
implemented in JavaScript (malloc, memset, abort etc).

But if we try to find `fib` string there - no results will be given. It did not
include any of our functions to the resulting module.

We must specify exported symbols manually, using the following pleasant syntax
(note the underscores):

```
emcc fib.c -o fib.js -s EXPORTED_FUNCTIONS="['_fib_next','_fib_binet']"
```

Ok, this actually produces code for our functions as well:

```
function _fib_next($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $tmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $f;
 $1 = $0;
 $2 = HEAP32[$1>>2]|0;
 $3 = $0;
 $4 = ((($3)) + 4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (($2) + ($5))|0;
 $tmp = $6;
 $7 = $0;
 $8 = ((($7)) + 4|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = $0;
 HEAP32[$10>>2] = $9;
 $11 = $tmp;
 $12 = $0;
 $13 = ((($12)) + 4|0);
 HEAP32[$13>>2] = $11;
 STACKTOP = sp;return ($11|0);
}
```

At this point we can try calling Binet approximation from JavaScript (I'm using
Node.js here, but asm.js code runs in the browser, too):

```
var fib = require('./fib.js');

for (var i = 0; i < 20; i++) {
  console.log(fib.ccall('fib_binet', 'number', ['number'], [i]));
}
```

ccall() takes function name (without underscore this time), returned value (can
be either number or string, pointers are same as numbers), array of parameter
types, array of actual parameter values.

There is also cwrap() that wraps asm.js code into a function:

```
var binet = fib.cwrap('fib_binet', 'number', ['number']);
for (var i = 0; i < 20; i++) {
  console.log(binet(i));
}
```

## struct fib

While in C the following code would be common - `struct fib f = {1,1};
fib_next(&f);`, in asm.js it would be not so easy to write. One can use malloc
and free to allocate memory, and maybe even initialize struct fields somehow,
but for my structs I ended up writing constructors and descructors:

```
struct fib *fib_create() {
	struct fib *f = malloc(sizeof(*f));
	if (f != NULL) {
		f->now = f->next = 1;
	}
	return f;
}
void fib_destroy(struct fib *f) {
	free(f);
}
```

After compilation the following code should be working:

```
var fib = require('./fib.js');

var create = fib.cwrap('fib_create', 'number', []);
var destroy = fib.cwrap('fib_destroy', 'null', ['number']);
var next = fib.cwrap('fib_next', 'number', ['number']);
var binet = fib.cwrap('fib_binet', 'number', ['number']);

var f = create();
for (var i = 0; i < 20; i++) {
  console.log(binet(i+3), next(f));
}
destroy(f);
```

## optimizations

The size of the compiled asm.js is ~200KB, which sounds too big for a simple
library. Let's pass the `-O3` flag to the compiler and enable all the
optimizations.

At this point the code is likely to be reduced a lot (~60KB), but... it is also
likely to stop working in browsers.

The reason is memory initialization. In debug builds (`-O0` or `O1`) the memory
is initialized with javascript arrays. But in release builds (`-O2` or `-O3`)
initial memory contents are stored in a separate file, which gets injected
using XHR.

It's an asynchronous process, so your global variables and constants have
invalid values at the beginnging. You can register a function to be called when memory is initialized:

```
Module['onRuntimeInitialized'] = function() {
	// Start using asm.js code here
};
```

Another catch is web workers. They have no access to window.location, so memory initializer can't guess the URL to the memory contents (it only knows the file name, but no host name or port). But you can always specify it explicitly:

```
Module['memoryInitializerPrefixURL'] = 'http://example.com/';
```

And one last thing, if you're using Webpack - build times are likely to be
increased a lot, so maybe try including asm.js code directly with a script tag.

## summary

Asm.js is a great way to improve performance in the modern browsers. Glitch
became really fast in Firefox, and got a noticeable boost in Chrome (which does
not even support asm.js!). That is explained by the fact that asm.js is a much
simpler JavaScript subset, so Chrome's JIT can optimize it better.

A further step would be to add WebAssembly support, but my Emscripten was
crashing when I tried to compile it. WebAssembly will be a binary format of
asm.js, smaller and faster. It is also known to be supported in Chrome and
Firefox, as well as in Electron. Oh, the future...

