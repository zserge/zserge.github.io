title: Partcl - a tiny command language
description: Tcl intepreter in six hundred lines of code, customizable, extendable, covered with tests
keywords: Tcl, command language, shell, scripting, embedded, mcu, antirez, picol, lil
date: 2016-08-11
---

# {{ title }}

Minimalist interpreters have always attracted me. First of all, they are a good
fit for embedded systems whenever you need a custom domain-specific language.

If one needs a scripting language for a microcontroller - there is not so many
choices. Instead there are lots of constraints, like the size of the compiled
binary code, RAM usage and memory management. Of course the language itself is
important, too.

[Lua][lua], a very stable, pragmatic and minimal language. It is easy to learn
and to extend. But the compiled code size would be around 200KB, so it barely
fits even on the most powerful ST ARMs. Also, Lua uses garbage collector, which
might not be good for realtime systems. Still, Lua is a perfect choice if you
can afford it. Apart from the original interpreter there's also a good
implementation for microcontrollers called [eLua][elua].

JavaScript. I still can't take it seriously and it feels more like a modern IoT
hype rather than a serious alternative to Lua. There are many implementations
([Espruino][espruino], [duktape][duktape], [v7][v7], [TinyJS][tinyjs],
[MuJS][mujs], [JerryScript][jerryscript]), but most of them are not stable
enough and the minimal binary size easily grows over 200KB, RAM usage is high
and garbage collection is slow. But might be good for hobbyists, though.

[Forth][forth]. Well, this is totally the opposite. Very minimal and simple,
one can create his own implementation over the weekends. Memory usage is close
to zero and code size is a couple of kilobytes. The performance should rock,
too, if you implement it properly. But the language itself quickly becomes
unreadable, as well as its concatenative nature is far from what people expect
to see in traditional programming languages. Absolutely worth trying, but
unlikely to be practical. I'm afraid the same applies for various Lisps.

Another once-so-popular scripting language is Tcl, and let's have a closer look
at it.

## Tcl

An extendable language, born out of frustration with having to build custom
command languages again and again, is in fact very simple.

A script is a sequence of commands, like "turn led on", here "turn" is the
command name, "led" and "on" are just words passed as parameters to the
command.

There is no data types other than a string. Square brackets inside the
strings are interpolated, e.g. the expression inside the brackets is evaluated
and its result if put into the original string. For example, in `puts [add 1
2]` the square brackets part gets substituted by `3` and then `puts 3` is
executed.

This approach is definitely slow, but it is what makes Tcl interpreters so
simple. All the language does is string substitution. The only place where no
substitution happens is braces. That's why the following is just a 5-word
command, and not a special language syntax:

```
if {$x > 0} {
	puts "Positive"
} else {
	puts "Negative"
}
```

The command is `if`, the second word is `$x > 0` (which is substituted by `if`
internally), the third word is `{puts Positive}`, then `else`, then `{puts
Negative}`. `If` substitutes the second word and evaluates the third or the fifth
one depending on the result. Loops, procedures etc - everything is just a
command operating with strings.

## Existing interpreters

The most powerful one is `tclsh`, and it probably comes with your OS. It's too
big for microcontrollers, but it has a large standard library of commands and
has lots of documentation.

There is also [lil][lil], the Little Interpreted Language. In fact, I got a
chance to use it on a MIPS controller once, it was a pleasant experience, the
source code is easy to understand. I met the performance bottleneck very
quickly, but I've rewritten some critical procedures as C commands, so it's not
a big problem. Too bad the author have removed Git repos and his site looks
broken now.

Finally, there's [picol][picol] made by Antirez (the guy who created Redis and
JimTcl). It's worth reading - only 600 lines of amazingly simple code.

## Partcl
 
Inspired by these projects, I decided to build [my own Tcl interpreter][partcl] over the
weekend. My goals were:

* Extreme minimalism. It should fit on an MCU with 16K of NAND.
* It should be easy to extend by writing your own commands in C.
* All parts should be isolated and should be easy to replace/customize.
* Default implementation should prefer size of performance.
* Lexer should tell when the end of the command is met so that we could read
	user input byte by byte and execute command only when it's fully read.
* All parts of the interpreter should be covered with tests.

It took Antirez three hours to finish his Picol, it took me 3 days to finish my
project. Apparently, I'm not that smart. Still, I'm very satisfied with the
results - I ran my TCL interpreter on a STM32F051 microcontroller and firmware
size was only 10KB!

Although `partcl` is a toy language, you might want to give it a try in your
next project, so let me explain how it works.

## Lexer

Any symbol can be part of the word, except for the following special symbols:

* Whitespace symbols: space and tab, used to delimit words
* Command terminators: newline, semicolon or EOF
* Grouping or substitution: square brackets, dollar sign, quotes, braces

Partcl lexer has special helper functions for these char classes:

```
static int tcl_is_space(char c);
static int tcl_is_end(char c);
static int tcl_is_special(char c, int q);
```

`tcl_is_special` behaves differently depending on the quoting mode (`q`
parameter) because semicolon, braces and new line lose their special meaning
and become regular printable characters inside the quoted strings.

The whole lexer is implemented in a single function:

```
int tcl_next(const char *s, size_t n, const char **from, const char **to, int *q);
```

`tcl_next` function finds the next token in the string `s`. `from` and `to` are
set to point to the token start/end, `q` denotes the quoting mode and is
changed if double quote is met. It's very efficient because it doesn't allocate
any memory and it doesn't mutate the original string (making it possible to
store scripts in ROM).

A special macro `tcl_each(s, len, skip_error)` can be used to iterate over all
the tokens in the string. If `skip_error` is false - the loop ends when the
string ends, otherwise the loop breaks on syntax errors such as unexpected EOF.
This allows to validate the input string without evaluating it and detect when
a full command has been read.

A good use case is reading commands from the serial port byte by byte. You can
accumulate data in a buffer without executing it until the lexer reports the
end of command. Then you can execute the command and reset the buffer.

Lexer allocates no memory, it even doesn't use any of the libc functions. It
also has 100% test coverage.

## Data types

Picol uses `char *` as the only data type. LIL uses a special structure that
keeps numeric values separately from string values and yet another data type
for lists. The first approach is very simple, the second one is more efficient,
but takes precious memory space.

Partcl has a special `tcl_value_t` type and a number of functions to work with
it.  By default it's just a char pointer, but one can rewrite ~100 lines to
optimize it for his needs (e.g. use a pool of strings, or handle lists
separately). In other words, we have an abstract type and the implementation
may vary.

Here's a full list of operations done with Partcl values:

```
/* Raw string values */
tcl_value_t *tcl_alloc(const char *s, size_t len);
tcl_value_t *tcl_dup(tcl_value_t *v);
tcl_value_t *tcl_append(tcl_value_t *v, tcl_value_t *tail);
int tcl_length(tcl_value_t *v);
void tcl_free(tcl_value_t *v);

/* Helpers to access raw string or numeric value */
int tcl_int(tcl_value_t *v);
const char *tcl_string(tcl_value_t *v);

/* List values */
tcl_value_t *tcl_list_alloc();
tcl_value_t *tcl_list_append(tcl_value_t *v, tcl_value_t *tail);
tcl_value_t *tcl_list_at(tcl_value_t *v, int index);
int tcl_list_length(tcl_value_t *v);
void tcl_list_free(tcl_value_t *v);
```

The default implementation uses malloc/free and keeps lists as raw strings with
the items quoted. Despite the simplicity, it may break if you put some badly
escaped strings into a list. So probably avoid using unpaired braces in
strings if you use the default list implementation. Or rewrite it using proper
linked lists.

## Environments

Tcl interpreter uses a stack of environments where variables are stored.
Environment is handled by 3 functions and it can be customized if need (e.g. to
use hash maps to speed up variable lookup):

```
static struct tcl_env *tcl_env_alloc(struct tcl_env *parent);
static struct tcl_var *tcl_env_var(struct tcl_env *env, tcl_value_t *name);
static struct tcl_env *tcl_env_free(struct tcl_env *env);
```

Environments have links from child to parent, making it possible to implement
`upeval` and other commands.

## Commands

The default set of commands includes "subst", "set", "while", "if", "proc",
"return", "break" and "continue". There is also "puts" which can be disabled if
your target system has no stdout. Also there are some mathematical operations
taken from Picol that can be optionally disabled if you're going to use Partcl
as a command shell and not as a programming language.

A typical command is just a C function of the following look:

```
static int tcl_cmd_puts(struct tcl *tcl, tcl_value_t *args, void *arg) {
	tcl_value_t *text = tcl_list_at(args, 1);
	puts(tcl_string(text));
	return FNORMAL;
}
```

It takes an interpreter object, a list of arguments and an optional pointer to
some context. Some commands have fixed arity, then interpreter controls it. For
zero arity the command must control it internally, which makes it possible to
use variadic arguments.

## What's next?

It was a fun to write a real Tcl interpreter. It was even more fun to actually
use it on a real MCU. Good test coverage and no memory leaks (according to
valgrind) make it a good candidate for low-end scripting.

The whole interpreter is just a single file with no other dependencies than
libc (for `<strings.h>` and malloc/free).

I'm not sure what to do next with it, but here are some ideas:

- Run some benchmarks to see how fast is the lexer and the interpterer.
- Make an alternative implementation for `tcl_value_t` that uses real lists and
	caches numbers.
- Make a library of commands for lists, hash maps, strings, for loops etc.

If you find it interesting - feel free to contribute or report issues at
https://github.com/zserge/partcl


[lua]: https://www.lua.org/
[elua]: http://www.eluaproject.net/
[espruino]: http://www.espruino.com/
[duktape]: http://duktape.org/
[v7]: https://github.com/cesanta/v7/
[tinyjs]: https://github.com/snoozbuster/tiny-js
[mujs]: http://mujs.com/
[jerryscript]: http://jerryscript.net/
[forth]: https://en.wikipedia.org/wiki/Forth_%28programming_language%29
[picolisp]: http://picolisp.com/wiki/?home
[micropascal]: https://en.wikipedia.org/wiki/Pic_Micro_Pascal
[micropython]: https://micropython.org/
[lil]: http://runtimeterror.com/tech/lil/
[picol]: http://antirez.com/picol/picol.c.txt
[partcl]: https://github.com/zserge/partcl
