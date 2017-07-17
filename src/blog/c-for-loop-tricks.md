title: Syntactic sugar in C - (ab)using "for" loops
description: C metaprogramming with loops and commas, pretending that it's a good idea
keywords: for loop, c99, c11, comma operator, macros, preprocessor, DSL, domain specific language
date: 2017-07-17
---
# {{ title }}

The `for` loop is one of the most powerful constructions in the C language.

It consists of three different parts. The first one is initialization,
performed exactly once at the beginning of the loop. The second one is the
conditional part, called every time before the loop body. The last one is the
increment part, executed on every iteration right after the loop body. Such a
loop combines both, linear code and branching in a very customizable manner,
which we will explore below. We will be focusing on C99 standard, because it
allows declaring local variables right inside the initialization part of the
loop.

All these facts are well-known to every C developer, but before we get any
further - let's talk about another language feature, the comma operator. It
is often mislooked by the developers and there is a [number][comma-q1]
[of][comma-q2] [questions][comma-q3] on Stack Overflow asking about why comma
exists and how it works in C.

## Comma vs semicolon

Commas are used to separate expressions, just as semicolons separate
statements. If two expressions are separated by a comma - they will be
evaluated from left to right, but only the result of the latter will be
returned:

```c
printf("hello\n"), printf("world\n"); // Both words will be printed one after another:
int i = (2+3, 4+5);  // i == 9
int j = (printf("hello!\n"), 5); // j == 5, and hello will be printed
```

Keep in mind, that comma is an operator (like plus or minus) and it should
return a value. That's why the last expression in the comma list should be of
the right type:

```c
void f() {}
int g() { return 42; }
...
int i = (f(), g()); // works fine, because g() returns int.
int j = (g(), f()); // compilation error, because f() returns void, but int is expected
g(), f();           // works fine, because no value is expected
```

Commas can most often be found inside the loops. You may be familiar with the
following iteration approach:

```c
/* Loosely based on OpenBSD source code */
char* strcpy(char *to, const char *from) {
  char *save = to;
  for (; (*to = *from) != '\0'; ++from, ++to);
  return save;
}
```

Here both pointers are incremented in one step, which makes the loop syntax
more compact. It’s a common technique, often used for simultaneous iteration
over two arrays (or with two related pointers).

## Simple custom loop

Now, let’s say we want to customize a for-loop by adding some "hooks". One
"hook" action is performed before the loop, another after the loop, and the
third action is performed after each iteration. It can be done with the
following macro:

```c
void loop_prologue() { printf("starting loop\n"); }
void loop_epilogue() { printf("terminating loop\n"); }
void loop_iter() { printf("iteration\n"); }
#define loop(cond) \
  for (loop_prologue(); (cond) || (loop_epilogue(), 0); loop_iter())

// You can use it as a regular loop with or without the braces
loop(some_condition) {
  ...
}
```

It may look unusual, but it's a valid loop - initialization part may not
include any variables at all, and increment part may not do any of the
increments.

The only non-trivial part here is the conditional part. Like in most
programming languages, logical OR operator evaluates the left-hand side first.
Then, if the returned value is zero - it evaluates the right-hand side. In our
case the loop condition is checked first, and if the condition is false - we
should break out of the loop. In this case OR operator calls the epilogue part
and returns a zero constant, which is used to terminate the actual loop.

## Domain-specific language

A much more practical use case is constructing DSLs. One example could be
defining an HTML layout in C and then converting it that into a string as the
code is executed. One possible implementation could be this simple macro: 

```c
#define print_tag(tag)                                                         \
       for (int _break = (tag_prologue(tag), 1); _break;                       \
         _break = 0, tag_epilogue(tag)) 

void tag_prologue(char *tag) { printf("<%s>\n", tag); }
void tag_epilogue(char *tag) { printf("</%s>\n", tag); }

#define html print_tag("html")
#define body print_tag("body")
#define p print_tag("p")

void print_html() {
  html {
    body {
      p printf("hello\n");
      p {
        printf("world\n");
      }
    }
  }
  printf("\n");
}
```

We have introduced a special local variable, `_break` that terminates the loop
exactly after one iteration. That's why our braced blocks behave like linear
code, and not like a loop.

As you can see, every block has a its own custom initialization and
deinitialization parts. These parts could be used to create DSLs that handle
resources, such as semaphores, files or memory:

```
synchronized(&some_mutex) {
  // do something
}
with_file(f, "somefile.txt") {
  // file should be closed automatically
  fread(f, ....);
}
```

The actual implementations are left as an excercise to the reader.

## Nuklear

Similar DSL syntax can be used to simplify APIs of a GUI framework, such as
[nuklear][nuklear]. Currently to create layouts in Nuklear you have to write
the code like this:

```c
nk_layout_row_begin(&ctx, NK_STATIC, 30, 2);
{
  nk_layout_row_push(&ctx, 50);
  nk_label(&ctx, "Volume:", NK_TEXT_LEFT);
  nk_layout_row_push(&ctx, 110);
  nk_slider_float(&ctx, 0, &value, 1.0f, 0.1f);
}
nk_layout_row_end(&ctx);
```

Noticed the semicolon before the braces? Although it creates an illusion of
nesting, it doesn't look right to me. But the following macro could simplify
the syntax:

```
#define nk_layout_row(ctx, a, b, c) \
  for (int _break = (nk_layout_row_begin(ctx, a, b, c), 1); _break; \
       _break = 0, nk_layout_row_end(ctx))

// usage:
nk_layout_row(&ctx, NK_STATIC, 30, 2) {
  nk_layout_row_push(&ctx, 50);
  nk_label(&ctx, "Volume:", NK_TEXT_LEFT);
  nk_layout_row_push(&ctx, 110);
  nk_slider_float(&ctx, 0, &value, 1.0f, 0.1f);
}
```

## Benchmarks

C developers like to benchmark their code. To do a poor-man benchmark one has
to measure time before the loop, perform the loop, measure time again and print
the time difference. This operation can be wrapped into a convenient macro
using the for-loop:

```c
#define BENCH_CLOCK() ((float)clock() * 1000000000L / CLOCKS_PER_SEC)

#define BENCH(_name, _iter)                                       \
  for (long _start_ns = BENCH_CLOCK(), _i = (_iter);              \
       _i > 0 ||                                                  \
         (printf("BENCH: %30s: %f ns/op\n",                       \
                 _name, (BENCH_CLOCK() - _start_ns) / _iter), 0); \
      _i--)
...
BENCH("foo_func()", 1000000L) {
  foo_func();
}
// Output:
BENCH:                      foo_func(): 46.247002 ns/op
```

Nothing prevents you from writing more complex benchmark loops, e.g. like Go
benchmarks, where a single iteration time is measured first, based on its
duration the total number of iterations is estimated, and the final results are
reported in ns/us/ms depending on the value. It will require a few more local
variables and maybe a custom reporting function, but it still fits into the
for-loop structure.

## Loops with an "else" clause?!

Finally, let’s try to make a more complicated loop, inspired by this wonderful
[metaprogramming][metaprogramming] article. A loop will have a body with an
optional else branch, that should be executed only once and only if the initial
loop condition was false:

```c
try_loop(item = get_next_item_from_list()) {
  // process item
} else {
  // list is empty
}

// Dangling else should not be a problem
if (...)
  try_loop(item = get_next_item_from_list())
    process_item(item);
  else // this "else" belongs to the loop, not to the "if" statement above
    ...
```

To handle "else" clause we obviously need a macro ending with an "if"
statement. Also, we will need an outer for-loop to handle all the loop logic.
At a high level it could roughly be described like this:

```
# Loop initialization
prologue = true # flag to handle prologues on the first iteration
initial_cond = cond = evaluate_loop_condition()

while true:

  # Loop condition
  if prologue:
    if initial_cond:
      then_prologue()
    else:
      else_prologue()
  else:
    if cond == false: # condition is false, evaludate epilogues
      if initial_cond:
        then_epilogue()
      else:
        else_epilogue()
      break

  # Loop body
  if initial_cond:
    # loop body here, with an optional else branch

  # Loop iteration
  then_iter()
  prologue = 0
  cond = evaluate_loop_condition()
```

Looks like a lot of if/else branches. But we can’t put if-else statements
inside the for-loop declaration. Or can we? We still have a ternary operator,
or as an alternative we could use logical AND/OR operators.

After transforming the above algorithm into ternary expressions we get the
following macro:

```c
#define try_loop(cond)                                                         \
  for (int _prologue = 1, _cond = cond, _branch = _cond;                       \
       (_prologue                                                              \
      ? (((_branch ? then_prologue() : else_prologue()), 1))                   \
      : (_cond || ((_branch ? then_epilogue() : else_epilogue()), 0)));        \
       then_iter(), _prologue = 0, _cond = cond)                               \
    if (_branch)
```

It may look complex, but if you only need certain prologues/epilogues instead
of all of them - it becomes much simpler.

## Summary

There are many ways to customize the behavior of a for-loop in C, and it’s
tempting to abuse the macros for that. But every developer knows that macros
are evil, especially if not used properly. They always have plenty of
limitations. One possible pitfall With the macros listed above is that they
don’t handle `break` statement well (it will skip the epilogue). HTML layout macros
will puzzle you, if you decide to put a `continue` into a block expecting it to
continue some outer loop. It is likely to get fixed with gotos and labels (like
in the [original article][metaprogramming], but that would create yet another
constraint - two macros on the same line would not work.

On the other hand, I believe that well-thought loop macros could simplify the
code and sometimes even make it more readable. A good example is `<sys/queue.h>`
header that has macros for iterating over lists and queues.

So despite of all the danger hidden in the C macros, they are still a fun topic
to explore, because meta-programming is never boring.

[cello]: http://libcello.org/
[comma-q1]: https://stackoverflow.com/questions/52550/what-does-the-comma-operator-do
[comma-q2]: https://stackoverflow.com/questions/17902992/what-is-the-proper-use-of-the-comma-operator
[comma-q3]: https://stackoverflow.com/questions/1737634/c-comma-operator
[metaprogramming]: https://www.chiark.greenend.org.uk/~sgtatham/mp
[nuklear]: https://github.com/vurtun/nuklear
