title: "Anvil: move fast and break things"
description: I have to break backwards-compatibility a lot and I'm sorry about it
date: 2015-09-13

---

# {{ title }}

Dear users, those who were early followers of Anvil. I'm now heavily working on
the next version of Anvil, but it's likely to make you rewrite your code, and
I'm deeply sorry about that.

Below I will describe why the changes are necessary and I hope you will find
that your code would not be modified a lot and embrace the benefist it brings.

## how anvil works now

Currently we have `Renderables` which have a `view()` method returning a
virtual layout.  Virtual layout is a tree of nodes, each node describing a view
or a view group and all its attributes.

Then Anvil compares new virtual layout and the previously known one, and
applies the changes between two virtual layouts to the actual view tree.

This approach is popular in web development where manipulating real DOM is
slow, but comparing two javascript objects to minimize the number of DOM
manipulations is known to be faster.

In Anvoid this approach brings some limitations, though:

* There is no access to the real views from inside a renderable.
* It's hard to apply the layout weight, gravity, marings etc because the
	`LayoutParams` depend on the parent view, and when the virtual layout is
	constructed there is no parent view yet, so we have to keep all possible
	properties of all possible layouts.
* It's hard to debug, because the action described in a virtual layout can
	throw an exception later when the layouts are compared and applied, so the
	stack trace is not helpful in this case.
* It's hard to use functional style, because Java 6 lacks map(), filter(),
	forEach() and other methods to process collections in a functional way.
* It's slow.

## slow?

I was thinking Anvil is "fast enough". Rendering a simple layout of ~15 views
took about 200us on a modern phone. Which means you can render this layout a
few thousand times per second.

In practice, this allocates and releases lots of temporary objects, which
results in GC pauses. Also, as your layouts grow - the rendering time seems to
grow linearly so for complex layouts you may not even meet the 60 FPS deadline.

I thought the bottleneck would be countless lambdas that we create when
building virtual node attributes (like setter for text, setter for
OnClickListener etc). It turns out the slowest part is not the lambdas, but the
collections. In each node we keep a list of child nodes and attributes. These
lists are created on each rendering cycle and shortly after that they are
collected by the GC.

To improve Anvil performance I started thinking about reusing previously known
virtual layout as much as possible instead of allocating new objects, because
the nature of Android layouts is that they are mostly constant (number and
order of views/attributes remains mostly the same, only the values change).

## functional vs imperative

Ok, when a new view is created we need to pick the next virtual view node from
the previous tree. Same for the new attribute. We shall create a new node only
if current attribute or view is different, otherwise we shall keep the previous
one.

Which means now the order in which attribute and view builders are called
begins to matter. It's no longer a functional approach (when functions return
nodes, top-level function collects the nodes and returns anoder node). It's an
imperative approach with a sequence of statements (as it was in Anvil/Kotlin).

Java guarantees that function agruments are evaluated left-to-right, but this
is not enough to reconstruct the view tree. For example:

	v(TextView.class,
		text("Hello"),
		padding(0));

We have `v()` which indicates end of the view node, we have attributes, but we
don't have the indicator of the node beginning. This becomes cumbersome if we
look at a group of views:

	v(SomeLayout.class,
		text("Hello"),
		v(SomeView.class,
			text("world")));

Here it's impossible to say if text("world") belongs to SomeLayout or SomeView
judging only from the order of method calls. So we need a special function that
would be called first in every view function. In the new Anvil it will look like:

	o (linearLayout(),
	   orientation(LinearLayout.VERTICAL),

	  o (textView(),
	     text("Hello")),
	  o (button(),
	     text("click me"),
	     onClick(clickHandler)));

Here "o" (or "x") looks like a list bullet, but it acts as an end-of-view
marker. View functions or a generic `v(SomeView.class)` act as a start-of-view
marker.

If a user can use Java 8 lambdas - it becomes more readable:

	linearLayout(() -> {
		orientation(LinearLayout.VERTICAL);

		textView(() -> {
			text("Hello");
		});

		button(() -> {
			text("Click me");
			onClick(clickHandler);
		});
	});

Or in Kotlin (notice the lack of dashes - we are going to have first-class
support of Kotlin, no extra Sugar.kt needed!)

	linearLayout {
		orientation(LinearLayout.VERTICAL)
		textView {
			text("Hello")
		}
		button {
			text("Click me")
			onClick(clickHandler)
		}
	}

Of course due to the imperative nature you would be able to use if/for loops,
not only the ternary operations. In fact Kotlin users have been able to use
them for a long time, now it comes to java as well.

So anvil is not about diffing two virtual layouts as React or Mithril do. It's
about manipulating real views in a lazy manner (still keeping the previous
values set to the views). It's still similar to a virtual layout, but it's
happening in a pipeline - thus the performance boost.

## performance?

This changes a lot. The `view()` method now returns void, becuse the tree it
contructs is already stored inside Anvil. Also, view() now manipulates the real
views and layouts, which is more natural for Android development. However it
does changes in a lazy way - only if the new value is different from the
previous one.

This allows to simplify Anvil code a lot, and to increase performance 5-7
times. An average rendering cycle now takes 30us and that seems to be on the
lower limit of my poor-man benchmarks, because simple string concatenation
takes about the same time. And if your layout is huge, but constant - the
rendering time will still be around 30-50 us!

## roadmap

Anvil is now being rewritten from scratch, you can see it on the `forge` branch
at https://github.com/zserge/anvil

Anvil core now only takes care about the virtual layout management. Using just
the core forces you to write all attribute and view wrappers by hand.

Of course generated attributes and views will still be there, but moved to a
separate module. So are the tests. We can now run tests in Java 8 and Kotlin,
keeping core code to be Java6-compliant.

It's still arguable how to distribute various versions of attributes and views
for each of the API levels - any suggestions are welcome.

So the plan is as follows:

* Implement core mechanism to construct view trees and to update them
* Cover it with tests
	- Help needed: how to measure coverage in Java/Android/Gradle?
	- Tests in Kotlin and benchmarks in Kotlin
* Implement RenderableView and adapters
* Attribute setters
	- How to handle multiple API levels?
* LayoutParam setters
	- Now these are chained called of the size() method. I hope I would be able
	  to make them look closer to XML, like layoutWeight() or layoutGravity()
* View builders like button() or linearLayout()
	- How to handle multiple API levels?
* Animation setters

If I get enough free time it should take a week or two, so be in touch!

P.S. Anyone willing to help - let me know!
