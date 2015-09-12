title: Tiny virtual machine for Forth language
keywords: virtual machine, vm, forth, interpreter, compiler, assembler, stack, embedded, small, retro
description: minimal Forth virtual machine + compiler designed after the J1 CPU
---
IVM
===

IVM (IV Machine or Forth Machine) is a very simple virtual machine
for small embedded devices. It's a software implementation of
[J1 Forth CPU](http://http://excamera.com/sphinx/fpga-j1.html) and is binary
compatible with it.
IVM is a stack machine and is designed to run Forth code, but
can be used as a general-purpose VM as well.

HOW CAN I USE IT?
-----------------

There can be various scenarios, but in general if you:

* want to customize your software without reprogramming the firmware
* want to isolate and control your software
* have enough storage to put virtual machine there (it's about 1K!)
* have storage for the software running inside virtual machine (it's usually 
  more compact than native code)
* can write critical parts in native code and map them to VM memory-mapped I/O
* can forgive than it run 10 times slower than native code

...then you should try running IVM.

DESIGN
------

IVM is designed to be as small as possible (less than 1K) to fit even the
smallest micros, and it should bring them to the new level by possibility of
running external code.

IVM is very flexible and easy to customize.

IVM code is stored in the "/inc/ivm.h" file. It has two functions:

- ivm_reset() - brings the VM back to the default state
- ivm_step(op) - executes instruction "op" on the virtual machine

You need to implement some functionality by your own:

- Fetching instructions. Each instruction is a 2-byte word. Instruction 
index is stored in the `ivm_pc` variable
- Memory access. You must implement `ivm_mem_put` and `ivm_mem_get` functions
to read and write to the memory. It is not a part of IVM code, because you can
use your I/O ports in a memory mapped way, or you might want to cache some
address range if you use external memory chip. Also, you decide what is the amount
of RAM available to the VM.

INSTRUCTION SET
---------------

IVM has a simple instruction set compatible with the J1 Forth CPU.

IVM has two stacks - data stack (DS) and return stack (RS).  Default depth for
both of them is 16 levels (**WARNING: Original J1 has 32 levels!**)

Basically, there are 5 types of the instructions:

- LIT: put a number on the DS

- JMP: jump to address

- JZ: jump to address if the value on the top of the DS is zero. 
This instruction also deletes this value from the top of the DS.

- CALL: store current address to the RS and jump to the address.
This instruction makes it possible to implement functions.

- ALU: perform arithmetic operation

There are 16 types of ALU instructions, each of them can also manipulate
DS and RS stacks, change PC and work with memory. For more details
check the J1 project.

COMPILER
--------

If you know Forth, you can use cross-compiler from the J1 project.

Alternatively, there is a separate project of developer tools for
J1 CPU - [j1vm](http://bitbucket.org/zserge/j1vm)

There is a Forth compiler `j1c` and a simulator (`j1vm`).

IVM FORTH BASICS
----------------

**Syntax**

Forth has reverse Polish notation. So, to add two number you should
write `2 3 +` and to add three numbers - `1 2 3 + +`.

This is so, because Forth program is executed from left to right, so if you
write `open read close` it will mean firth open, then read and finally close.
This sounds more intuitive, right?

Comments in Forth are like:

	( this is a comment )
	\ this is a single line comment

**Stacks**

*IVM has two stacks, so how do they work?*

Data stack is a place where temporary values are stored and where
all the calculations happen. So, if you write `2 3 +` it means:
"put 2 on the top of the data stack, then put 3 over it, then run
ALU function +". Function "+" fetches two items from the top of
the stack, add them, and puts the result on the data stack as well,
replacing that two items. So, if stack was like "1 2 3" before 
calling "+", after that the stack will be "1 5".

There is a specific notation that helps you to know how functions
manipulate data stack. It's written like a comment. This is how
we would describe "+" function: `( a b -- a+b )`. See? There were 
`a` and `b` on the top, but we replace them with `a+b` sum.

How would you call this function: `( a b -- b a )`? Right, it's `swap`.
And this one: `( a -- a a )` is `dup`, because it duplicates the top item.
And this one: `( a -- )` is `drop`, because it drops the top item from
the stack.

*But why there are two stacks?*

The second stack is a return stack, but it does more than storing
return addresses when calling functions. You can put your local values
there when playing with data stack, and fetch them later.

What if you need a function like `( a b c d -- a+b c+d )`?
First you call `+` and get `( a b c+d )`. But now you need to 
remove that `c+d` from the top of the stack! You can move that item
to the return stack. Use functions `>r` and `r>` to do that.
The first one is "put-to-return-stack" and the second one is
"fetch-from-return-stack", but it's obvious because of the arrow
position. So, this is your code for the function above:

	( a b c d -- a+b c+d)
	+ ( a b c+d )
	>r ( a b )
	+ ( a+b )
	r>  ( a+b c+d )

**Memory**

If you need to store global variables, you can use memory-access functions: 
`@` and `!`. They are "fetch" and "store" 

It means, that `100 @` fetches 16-bit value from address 100, and `5 100 !`
writes value 5 to address 100. At this moment variables and constants become
handy.

Both variables and constants differ from what you normally see in Forth. To
make a global variable you write:

	var my-var

This allocates new variable address in RAM. If you need to make a constant
definition write:

	equ X 10

Now you can use them in your code: `my-var @` or `X my-var !`. Great thing is
that you can use constants like variables if you need to use specific address
(e.g. for memory-mapped I/O): 

	equ GPIO 1234
	( GPIO & 0x80 )
	GPIO @ 128 & 

Control structures
------------------

At this point Forth is just an assembly language with weird syntax. Yes, it's
compact, it's easy to learn and it's fast, but it's too much low-level. How do
I make a loop? How to branch my code?

It's easy. First, about branches. Internally, they use JZ/JMP instructions. The
syntax is like:

	<condition> if <then-branch> else <else-branch> then
	<condition> if <then-branch> then

	: max ( a b -- max[a,b] )
		over over ( a b a b )
		> ( a b a>b )
		if ( a b )
			drop ( a )
		else
			nip ( b )
		then

There are several types of loops in the current implementation:

	begin <loop-body> again ( infinite loop )
	begin <loop-body> <condition> until ( do .. while )

