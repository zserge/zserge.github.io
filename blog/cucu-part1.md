title: cucu: a compiler you can understand (1/3)
description: Compilers is fun. Want to write your own one?
keywords: compiler, programming, C, smallC, easy, tiny, small, tutorial, lexer
date: 2012-10-23

cucu: a compiler you can understand (part&nbsp;1)
=================================================

Let talk about the compilers. Have you ever thought of writing your own one?

I will try to show you how simple it is. The first part will be pretty much
theoretical, so keep patience.

what we're going to achieve?
----------------------------

CUCU is a toy compiler for a toy language. I want it to be as close to ANSI C 
as possible, so that every valid CUCU program could be compiled with a C
compiler without any errors. Of course, the support of the whole ANSI C
standard is very difficult, so I picked a very small C language subset. 

For example, here's a valid CUCU code snippet:

	int cucu_strlen(char *s) {
		int i = 0;
		while (s[i]) {
			i = i + 1;
		}
		return i;
	}

grammar
-------

We're about to define a grammar for our language. It's an important step, 
because everything in our compiler design depends on it.

So, let's go from top to bottom. Our source file contains a **program**.
What is a program? We know it's a list of **variable declarations**, **function
declarations** and **function definitions**, e.g:

	int func(char *s, int len); /* function declaration */
	int i;                      /* variable declaration */

	int func(char *s, int len) { /* function definition */
		...
	}

Let's try to write it down in [EBNF][1] form (it's absolutely ok, if you don't
know what EBNF is, it's really intuitive):

	<program> ::= { <var-decl> | <func-decl> | <func-def> } ;

This notation says: "a program is a repeating sequence of variable declarations,
function declarations and function definitions. But what is all those
declarations and definitions? Ok, let's go deeper:

	<var-decl> ::= <type> <ident> ";"
	<func-decl> ::= <type> <ident> "(" <func-args> ")" ";"
	<func-def> ::= <type> <ident> "(" <func-args> ")" <func-body>
	<func-args> ::= { <type> <ident> "," }
	<type> ::= "int" | "char *"

So, variable declaration is simple: it's a type name followed by the identifier,
and followed by a semicolon, like we usually do in C, e.g.:

	int i;
	char *s;

Function declaration is a bit more complicated. It's a "type + identifier", 
and an optional list of function arguments `<func-args>` inside the braces.

Function arguments list, in it's turn, is a sequence of comma-separated 
"type + identifier", like:

	char *s, int from, int to

_Actually, trailing comma in CUCU is still allowed, but not required. It will
just simplify our parser code._

The supported data types are only `int` and `char *`. Identifier is a sequence
of letters, digits and an underscore symbol.

The only thing left is `<func-body>`. But let's talk about **statements** and 
**expressions** first.

*Statement* is a smallest standalone element of the language. Here are valid 
statements in out language:

	/* These are simple statements */
	i = 2 + 3; /* assignment statement */
	my_func(i); /* function call statement */
	return i; /* return statement */

	/* These are compound statements */
	if (x > 0) { .. } else { .. }
	while (x > 0) { .. }

*Expression* is a smaller part of the statement. As opposed to statements,
expressions always return a value.  Usually, it's just the arithmetic. For
example in the statement `func(x[2], i + j)` the expressions are `x[2]` and
`i+j`.

So, looking back at `<func-body>`. It's just a valid statement (which is
usually a block statement).

Here's what we have:

	<func-body> ::= <statement>
	<statement> ::= "{" { <statement> } "}"                /* block statement */
	                | [<type>] <ident> [ "=" <expr> ] ";"  /* assignment */
	                | "return" <expr> ";"
	                | "if" "(" <expr> ")" <statement> [ "else" <statement> ]
	                | "while" "(" <expr> ")" <statement>
	                | <expr> ";"

Here are possible expressions in CUCU language:

	<expr> ::= <bitwise-expr> 
	           | <bitwise-expr> = <expr>
	<bitwise-expr> ::= <eq-expr>
	                   | <bitwise-expr> & <eq-expr>
	                   | <bitwise-expr> | <eq-expr>
	<eq-expr> ::= <rel-expr>
	              | <eq-expr> == <rel-expr>
	              | <eq-expr> != <rel-expr>
	<rel-expr> ::= <shift-expr>
	               | <rel-expr> < <shift-expr>
	<shift-expr> ::= <add-expr>
	                 | <shift-expr> << <add-expr>
	                 | <shift-expr> >> <add-expr>
	<add-expr> ::= <postfix-expr>
	               | <add-expr> + <postfix-expr>
	               | <add-expr> - <postfix-expr>
	<postfix-expr> ::= <prim-expr>
	                   | <postfix-expr> [ <expr> ]
	                   | <postfix-expr> ( <expr> { "," <expr> } )
	<prim-expr> := <number> | <ident> | <string> | "(" <expr> ")"

That's it. Did you notice the recursion in the expression notation?  Basically,
the notation above shows us the precedence of the operators from bottom to top:
parens and square brackets are evaluated first, and assignment goes the last.

For example, according to this grammar an expression `8>>1+1`
will be evaluated to 2 (like in `8>>(1+1)`), not to 5 (like in `(8>>1)+1`),
because `>>` has lower precedence than `+`.

lexer
-----

Now we are done with grammar, and are ready to start. The first thing to do is
a lexer. Our compiler takes a stream of bytes as an input, and lexer allows to
split that stream into smaller tokens, that can be processed later. It gives us
some level of abstraction and simplifies out parser.

For example, a sequence of bytes "int i = 2+31;" will be split into tokens:

	int
	i
	=
	2
	+
	31
	;

_In normal grown-up lexers every lexeme (token) has a type and a value, so 
instead of the list above we will get a list of pairs: `<TYPE:int>,<ID:i>,
<ASSIGN:=>,<NUM:2>,<PLUS:+>,<NUM:31>,<SEMI:;>`. We are going to detect lexeme
type by its value, which is not academical at all!_

The major problem with the lexer is that once a byte is read from the stream -
it can not be "un-read". And what if we've read a byte that can not be added to
the current token? Where should we store it until the current token is
processed?

Almost every lexer need to read ahead. Our grammar is simple enough, so all we 
need to have is a single byte buffer - `nextc`. It stores a byte, that was read
from the stream, but has not yet been pushed to the token string.

Also, I need to warn you - I use global variables a lot in CUCU code. I know
it's a bad style, but if I pass all values as function arguments the compiler
would loose it's simplicity.

The whole lexer is just a single function `readtok()`. The algorithm is simple:

* skip leading spaces
* try to read an identifier (a sequence of letters, digits and `_`)
* if it's not an identifier - try to read a sequence of special operators, like 
	`&, |, <, >, =, !`.
* if it's not an operator - try to read a string literal "...." or '....'
* if failed - maybe it's a comment, like `/* ... */`?
* if failed again - just read a single byte. It might be another single-byte
	token, like "(" or "[".

Here's the whole CUCU sources we've got so far:

	#include <stdio.h> /* for vpritnf */
	#include <stdarg.h> /* for va_list */
	#include <stdlib.h> /* for exit() */
	#include <ctype.h> /* for isspace, isalpha... */

	#define MAXTOKSZ 256
	static FILE *f; /* input file */
	static char tok[MAXTOKSZ];
	static int tokpos;
	static int nextc;

	void readchr() {
		if (tokpos == MAXTOKSZ - 1) {
			tok[tokpos] = '\0';
			fprintf(stderr, "token too long: %s\n", tok);
			exit(EXIT_FAILURE);
		}
		tok[tokpos++] = nextc;
		nextc = fgetc(f);
	}

	void readtok() {
		for (;;) {
			while (isspace(nextc)) {
				nextc = fgetc(f);
			}
			tokpos = 0;
			while(isalnum(nextc) || nextc == '_') {
				readchr();
			}
			if (tokpos == 0) {
				while (nextc == '<' || nextc == '=' || nextc == '>'
						|| nextc == '!' || nextc == '&' || nextc == '|') {
					readchr();
				}
			}
			if (tokpos == 0) {
				if (nextc == '\'' || nextc == '"') {
					char c = nextc;
					readchr();
					while (nextc != c) {
						readchr();
					}
					readchr();
				} else if (nextc == '/') {
					readchr();
					if (nextc == '*') {
						nextc = fgetc(f);
						while (nextc != '/') {
							while (nextc != '*') {
								nextc = fgetc(f);
							}
							nextc = fgetc(f);
						}
						nextc = fgetc(f);
					}
				} else if (nextc != EOF) {
					readchr();
				}
			}
			break;
		}
		tok[tokpos] = '\0';
	}

	int main() {
		f = stdin;
		nextc = fgetc(f);

		for (;;) {
			readtok();
			printf("TOKEN: %s\n", tok);
			if (tok[0] == '\0') break;
		}
		return 0;
	}

If we put a C file as the compiler input - it will print us a list of tokens, 
one per line.

Ok, have a cup of coffee, and let's [go further &rarr;][2]

_You can check [part3](/blog/cucu-part3.html) to know how the story ended._



[1]: http://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_Form
[2]: /blog/cucu-part2.html

