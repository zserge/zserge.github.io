title: android UI development made easy
description: Bringing the ideas from Mithril, React, Bloop to Android
keywords: android, layout, mvc, mvvm, mvp, react.js, mithril, data binding
date: 2015-01-14

# Android UI development made easy

TL;DR: I offer declarative strongly typed layouts with data bindings in pure
Java.

Android UI development is broken. It normally ends up with lots of boilerplate
code and poor architecture. Here are some (very subjective) issues:

* There is no MVC (or M-V-Whatever).
* XMLs always contain lots of copy-pasted code, very poor code reuse.
* XMLs are very fragile, so you can type "TextVeiw" and it will not warn you
	during the compilation but will throw an InflateException in runtime.
* Poor support for styles. Poor support for variables. No support for macros
	and calculated values (like 10dp+2px)
* No data binding, you have to do all those "findViewById" and "setOn...Listener".
* You may create your layout in Java but it will be hardly readable.

## Building user interfaces with Mithril.js

Web developers quickly realized that writing complex applications without MVx
is hard. They realized the problem of jQuery and invented Backbone, Knockout,
Angular, Ember...

But with Android we still have just a number of functions to chaotically change
view properties, much like in jQuery:

	$('.myview').text('Hello');
	$('.myview').on('click', function() {

	});

	myView.setText("Hello");
	myView.setOnClickListener(new View.OnClickListener() { ...});

We define our UI layouts in one place, use them in another place and change
them throughout all our code. That's not good.

React.js changed the things in web development a bit. They used a virtual DOM
concept which is a tree of custom objects representing the actual HTML layout.
That virtual tree is very fast to generate and to traverse. So when the actual
DOM is rendered - two virtual trees (the previous one and the new one) are
compared and only the parts that don't match are rendered.

[Mithril.js](http://lhorie.github.io/mithril/) is another tiny brilliant
framework that makes React.js approach even cleaner. In Mithril you can get rid
of everything except for plain JavaScript and it brings the whole power of a
turing-complete language to your layouts:

	return m('div',
	         m('p', someText),
	         m('ul',
	           items.map((item) => m('li', item))),
	         m('button', {onclick: myClickHandler}));

So you can use loops to generate a collection of views, you can use
conditionals to include/exclude some parts of the layout, finally you can bind
data and set event listeners.

Can this be done in Android?

## Virtual layout

Virtual layout (using the analogy of virtual DOM in web) is a tree of custom
Java objects that represent the actual android layout. The tree is constructed
as many times as the app data changes, but the actual layout should be modified
only for the parts where the virtual layout has been modified.

Our framework will be just one class which I assume to be imported using
"static" keyword, so all its static methods would be accessed without any class
name prefix (e.g. "v()" instead of "Render.v()"). This brings a bit of syntax
sugar.

Here's an example of how the layout would be declared:

	v(LinearLayout.class,
		orientation(LinearLayout.VERTICAL),
		v(TextView.class,
			text(someText)),
		v(Button.class,
			text("Click me"),
			onClick(someClickHandler)));

The top-most v() returns a virtual layout. On every call it returns the actual
representation of the current application state (but not the actual android
Views!).

When `someText` variable is changed - the virtual tree will get a different
node value for the next rendering cycle, and setText() would be called for the
TextView instance. But the rest of the physical layout will remain untouched.

A virtual layout tree should ideally be just one class, let's call it a Node.
But there are two major types of nodes: a view node, like v(TextView.class,
...) and an attribute setter node, like text(someText)

Which means the node may optionally contain a view class and a function to
modify the view attribute:

	interface AttributeSetter {
		public void set(View v);
	}

	public static class Node {
		List<Node> attrs = new ArrayList<Node>();
		Class<? extends View> viewClass; // for view nodes
		AttributeSetter setter;          // for attribute setter nodes

		public Node(Class<? extends View> c) {
			this.viewClass = c;
		}

		public Node(AttributeSetter setter) {
			this.setter = setter;
		}
	}

Now we need to define what classes are capable of generating virtual layouts.
Let's call those classes renderables. A renderable can be an activity, or a custom
ViewGroup, or maybe even a fragment. A renderable must have a method returning
the virtual layout, and it would be nice if it also specified where it wants to
attach the actual layout views:

	public interface Renderable {
		Node view();
		ViewGroup getRootView();
	}

Now, the v() method. It takes the first argument of `Class<? extends View>`, so
you can be safe about the type. Remaining arguments are all of type `Node` so
we simply add them to the list. It could be helpful to ignore null nodes:

	public static Node v(final Class<? extends View> cls, final Node ...nodes) {
		return new Node(cls) {
			{
				for (Node n : nodes) {
					attrs.add(n);
				}
			}
		};
	}

Here's an example of the text() attribute setter (the real code is a bit
different, but it could have been implemented like this):

	public static Node text(final String s) {
		return new Node(new AttributeSetter() {
			public void set(View v) {
				((TextView) v).setText(s);
			}
		});
	}

In a similar manner other helper methods can be written for linear layout
orientation, view dimensions, margins, padding and every other view parameter
that can be changed.

## How to render?

Now we need a renderer. It's a method that creates new views by their
class names, adjusts their parameters using AttributeSetters and adds child
views recursively (also, the code below is simplified, the real code does some
kind of a diff to avoid rendering when the node has not been changed).

	public static View inflateNode(Context c, Node node, ViewGroup parent) {
		if (node.viewClass == null) {
			throw new RuntimeException("Root is not a view!");
		}
		// Exception handling skipped here to make the code look shorter
		View v = (View) node.viewClass.getConstructor(Context.class).newInstance(c);
		parent.addView(v);
		for (Node subnode: node.attrs) {
			if (subnode.setter != null) {
				subnode.setter.set(v);
			} else {
				View subview = inflateNode(c, subnode, (ViewGroup) v);
			}
		}
		return v;
	}

Now we can actually get rid of XMLs and inflate our layouts in Java in a nice
clean way.

inflateNode is not supposed to be used directly, instead there are two methods -
"render(Renderer r)" and just "render()". The first one re-renders one view, the
second one re-renders all present views. Renderers are stored in a weak hash
map, so once the view is removed or activity is destroyed - their renderers
won't be used anymore.

## When to render?

The selling point is automatic re-rendering so the UI would always represent
the most recent virtual layout state. It means render() should be called at
certain points.

I followed the way of Mithril, so I wrap every On...Listener and call render on
every UI interaction:

	public static Node onClick(final View.OnClickListener listener) {
		return new Node(new AttributeSetter() {
			public void set(View v) {
				v.setOnClickListener(new View.OnClickListener() {
					public void onClick(View v) {
						listener.onClick(v);
						// After the click was processed - some data may have been changed
						// so we try to re-render the UI
						render();
					}
				});
			}
		});
	}

I think it makes sense because in most android applications data is changed
when user interaction happens. If your data is updated from some other sources
- call render() manually.

## Summing up

This simple approach is really powerful:

* you can define your layout hierarchy in an XML-like manner (with nested "v()" calls)
* you can bind data and bind listeners in a nice declarative way
* layouts are type-safe and your IDE will help with autocomplete
* no runtime overhead, no reflection, no code generation
* you can use java in all its power (variables, expressions, "macros" to
	generate layouts)
* you can use custom views and custom attribute setters
* since all your UI data is kept in attributes - you can easily make it
	persistent
* you can easily use views as your UI components (as suggested in
["Advocating Against Android Fragments"](http://corner.squareup.com/2014/10/advocating-against-android-fragments.html))
* it's all in less than 250 LOC of pure Java!

This proves that the concept is viable. Now I wonder if anyone wants to join
the development of a full-featured library based on this concept?

The still is an big task of designing a good 'diff' algorithm. Basically, it
should detect if a node was added/removed/modified. The trick here is attribute
nodes. For simple data types we can just call "equals()" to compare old value
to the new value. But what about listeners:

	v(SomeView.java,
		onClick(v => ...));

Here the listener will be a new object every time the virtual tree is created.
How to compare them? Never update listeners? Update only if the listener class
has changed? Use some kind of event bus and post events instead of registering
listeners?

Another important thing is my unwillingness to write all attribute setters by
hand. There is be a better way, and Kotlin guys did it for their
[koan](https://github.com/yanex/koan) library.

I'm now working on generating setters automatically from android.jar classes
and I hope it will make this experiment more useful.

Anyway, the current code is on
[Github](https://github.com/zserge/android-virtual-layout), MIT licensed.
Comments and pull requests are welcome!



