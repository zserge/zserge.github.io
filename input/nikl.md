title: Microframework for embedded systems development
keywords embedded system, rtos, protothread, development, avr, pic, arm, microcontroller, programming

---

nikl
====

Nikl is a micro-framework for small embedded devices like AVR
microcontrollers.

HISTORY
-------

One day I decided to write a real-time OS. It had multitasking, semaphores and
supported only ARM architecture. Then I tried to port it to use with the AVRs,
but context switching was slow, memory was very limited and my OS became
generally useless.

Then, I started another project called avOS, that some kind of a kernel that
was not real-time, and was widely using protothreads for pseudo-multitasking.
Later the project was abandoned, but now I'm trying to give it a new born.

PHILOSOPHY
----------

* No .c files, until they are really needed
* This implies - no build system. You can take any combinations of modules you
  need and just copy or symlink them to your project directory


STRUCTURE
---------

You should see "/inc" folder. There is where all the modules are stored.
Another folder is "/test". This is a folder with unit tests. 

Let's go deeper. Inside "/inc" folder you should find modules for

* bare-bone unit-testing (test.h)
* list-based data structures (list.h)
* FORTH virtual machine (ivm.h)

For the IVM there is a simple compiler written in Python (see "/utils/ivmc").

HOW TO USE TESTS
----------------

There is a bunch of unit-testing frameworks. But they all are an overkill for
tiny embedded systems. If you just need to write a few tests for your device
and have a possibility to detect which test failed - you can use test.h.

Here's an example of typical usage. Assume we have a board that works with data
on the SD card. We need to be sure that SD card is valid, and hardware is ready
to use.  I still doubt if it is a correct usage of unit tests, as it seems like
we test hardware, but this is how it works for me:

	/* Use custom error notification, e.g. show line number on LCD,
	 * or send message and line number over UART, or just turn the
	 * error indicating LED on */
	#define TEST_NOTIFY(msg, line)	lcd_display_number(line)

	#include <test.h>

	/* Check that after hardware initialization SD card is present */
	int test_sdcard_available() {
		int part_id;
		sdcard_init();
		check(sdcard_available() == 1);

		/* Ensure that FAT partition ID is 1..4 */
		part_id = sdcard_find_fat_partition();
		check(part_id > 0 && part_id <= 4);

		return 0;
	}

	/* Check that toggling LED port works correctly */
	int test_leds() {
		LED_PORT |= (1 << GREEN_LED);
		check(LED_PORT & (1 << GREEN_LED));
		LED_PORT &= ~(1 << GREEN_LED);
		check((LED_PORT & ~(1 << GREEN_LED)) == 0);
	}

	....

	test(test_sdcard_available(), "sdcard test");
	test(test_leds(), "LED test");

	...

Ain't it simple? You basically write test functions that do some assertions.
Then you call these functions and if the return value is non-zero - it means
that the test has failed. In this case TEST_NOTIFY function will be called and
it's your chance to tell user that something was wrong

* your test functions must return 0 at the end to indicate success
* you need to test values using check(condition) macro.
* you need to run your test functions using test(func, descr) function
* if you use your own TEST_NOTIFY implementation you can print test name
  (msg argument) and line number (line argument), where the error occurred.

HOW TO USE LISTS
----------------

Lists are stolen from linux kernel in a shameless way. They are not so easy-to-use
as more common <sys/queue.h>, but are more flexible.

To define an object, that can be linked into the list, do:

	typedef struct {
		/* My data */
		int value1;
		int value2;
		/* List pointer */
		list_t list;
	} my_obj;

To create a list head, do:

	list_t my_obj_list;

Next, initialize list:

	list_init(&my_obj_list);

And now you can do everything you want with your lists:

	my_obj *a, *b, *c; /* object to add to the list */
	list_t *tmp; /* list iterator */

	list_add(&my_obj_list, &a->list);
	list_add(&my_obj_list, &b->list);
	list_add(&my_obj_list, &c->list);

	list_del(&b->list);

	list_for_each(&my_obj_list, tmp) {
		/* This is how to get the object using list_entry() */
		my_obj *iterator;
		iterator = list_entry(tmp, my_obj, list);
		printf("%d\n", iterator->value1);
	}

For now only double-linked lists are implemented. Soon single-linked lists and
queues will be added.

HOW TO USE IVM
--------------

IVM is not that simple. See IVM.README for more details to how use it.

