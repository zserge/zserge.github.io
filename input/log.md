title: Ultra-leightweight logging for embedded system
keywords: log, embedded, variable-length, printf, format

----

log.h
=====

log.h is a ultra-light logging library for [nikl](nikl.html) framework.
You can use it to profile your code or debug time-critical parts.

idea
----

Real hackers don't use debuggers, they use `printf` instead, right?
But `printf` is often too heavy for your tiny 8-bit MCU.

Nikl's logger sends only printf payload (e.g. arguments, without even format 
string) and some information to find the line in the source file and 
get format string from there. 

It allows you to send (let's assume that sending 1 byte takes 1 instruction):

* `TRACE()` message: 5 bytes, 10 instructions.
* `LOG("status =  %d", s);` where `s=2`, s is a 32-bit number: 6 bytes, 20
	instructions.

protocol
--------

Data is sent using very simple datagram protocol. Each datagram has the format:

	+-----+----------+---------+---------+-----+-----+
	| STX | FILE_TAG | LINE_HI | LINE_LO | ... | ETX |
	+-----+----------+---------+---------+-----+-----+

* `STX` - start of the datagram. `STX = 0xFC`
* `ETX` - end of the datagram. `ETX = 0xFD`
* `FILE_TAG` - label of the source file (1 byte)
* `LINE_HI` and `LINE_LO` - high and low byte of `__LINE__` value (2 bytes in total).

After `LINE_LO` but before `ETX` byte there is datagram body. Datagram body can
contain 3 data types:

* Integer numbers
* NULL-terminated strings
* Binary data of known length

Let's see how these type are encoded.

data types
----------

Integers are passed using variable-length format.
Everything depends on the 1st byte:

* `0nnnnnnn`:  7-bit number
* `10nnnnnn nnnnnnnn`: 14-bit number
* `110nnnnn nnnnnnnn nnnnnnnn`: 21-bit number
* `11100nnn nnnnnnnn nnnnnnnn nnnnnnnn`: 27-bit number
* `11101nnn nnnnnnnn nnnnnnnn nnnnnnnn nnnnnnnn`: 35-bit number
* `11111100` - STX
* `11111101` - ETX
* `11111011` - Zero-terminated string
* `11111111 ....` - variable-length data. Length is a variable-length number. 
	Data comes after length.

Easy, right?

internals
---------

Well, sending TRACE() is simple - it's just a function that sends 5 bytes.

LOG() is somewhat more complicated. Normally, LOG() arguments are passed
comma-separated. As you know, statements in C can be also written separated
with commas. All we need to do is to wrap each parameter with a function,
depending on its type. Unfortunatelly, there seems to be no way to do this 
automatically, so the programmer must to it manually:

	LOG("status = %d", _I(status)); /* _I() - for numbers */
	LOG("request = %s", _S(req));   /* _S() - for strings */
	LOG("payload = %v", _D(buf, 512)); /* _D() for binary data */


