title: Anvil: big progress for a small library
description: Summing up the progress of anvil development
keywords: anvil, android, render, layout, mvc, mvvm, mvp, mithril, listeners, butterknife, knork
date: 2015-04-16

# Anvil: big progress for a small library

I have just released [Anvil 0.0.2][1]. So many changes have been made and now I am
absolutely confident that Anvil has its strong points even though I'm the only
active user of it.

## What is Anvil?

This section is for those who missed the [early][2] [steps][3] of Anvil.

Anvil is a tiny reactive UI library for Android. What does this mean? It means
that you can declare your UI in Java, bind your data to the views, bind event
listeners to the views and leave it running. The rest will be done by Anvil:
once some data is changed - the UI will be updated in a smart way, so that only
the widgets bound to that data will be modified.

This totally changes the way we design Android apps.

The core thing to understand is that Anvil uses virtual layout. Instead of
modifying your Views and ViewGroups - it first builds a virtual tree containing 
the attributes of your views in the layout hierarchy:

	ViewNode for LinearLayout
		ViewNode for TextView
			AttrNode for text with value "Hello"
		ViewNode for Button
			AttrNode for OnClickListener with some listener object value

Then, Anvil compares the current virtual layout tree and a previous one and
applies the attribute changes when it finds a difference.

## But I loved my XMLs

I've heard some frustration from people who used XMLs a lot. I understand
their criticism, but we have to admit - there is no way to achieve simple,
lightweight and declarative data binding and reactive behavior with XMLs. On
the other hand, we can achieve declarative layouts, styling, multi-screen
support etc with Java.

Good news is that Anvil does not force you to delete all your XMLs
and never use them again. You can nicely mix Anvil layouts with XML layouts.

Same applies to the [single-activity][4] approach, which I find very helpful.
Anvil supports it and encourages it. But you still can use your Fragments and
Activities as you did before and still have some benefits from using Anvil.

## Show me the code

Here's a stupid counter example (using Java 8):

	public class MyCounterView extends RenderableView {

		private int count = 0;

		public MyCounterView(Context c) {
			super(c);
		}

		public void onCounterButtonClicked(View v) {
			count++;
		}

		public ViewNode view() {
			return
				v(LinearLayout.class,
					orientation(LinearLayout.VERTICAL),

					v(TextView.class,
						text("Count is " + this.count)),

					v(Button.class,
						text("Click me"),
						onClick(this::onCounterButtonClicked)));
		}
	}

That's it. When the button is clicked - onCounterButtonClicked method is
called, which increases the count and then Anvil.render() is performed to
update the UI. At this point the new virtual layout will differ in one place
only - the text() attribute of the TextView will be "Count is 1" instead of
"Count is 0". That's why the attribute node will update the TextView by calling
its setText() method.

## Anvil, the Renderer

The fundamental class is `Anvil`. It's a renderer that keeps a list of current
`Renderables` and provides you with the `render()` method.  This method smartly
updates all the visible renderables (views, fragments). So if you want to force
the UI update (for example when you received some data from the
HttpUrlConenction) - you just call Anvil.render() on the UI thread.

## Renderable

Renderable is an interface that holds some root ViewGroup (into which the
layout will be rendered) and has a view() method returning the virtual layout
corresponding to the current application state.

Activities and Fragments can implement Renderable interface, but most likely
you would use RenderableViews. RenderableView is a syntax sugar for a
Renderable FrameLayout, so you only have to override the view() method and
you're done. Also, you can save/restore view state in
onLoad(Bundle)/onStore(Bundle) methods. This helps a lot to split your app into
components and never worry about screen rotation and related problems:

	public MyView extends RenderableView {
		public MyView(Context c) {
			super(c);
		}

		private int count = 0;

		public ViewNode view() {
			return
				v(Button.class,
					text("Clicked " + count),
					onClick(v -> count++));
		}

		// Count will be kept when the screen is rotated
		public void onLoad(Bundle b) {
			b.putInt("count", count);
		}

		public void onSave(Bundle b) {
			count = b.getInt("count");
		}
	}

## Adapters

One may argue that Android has very nice MVC implemented with Adapters. I totally agree, I like Adapters a lot, and Anvil makes them even better:

	RenderableArrayAdapter myAdapter =
		new RenderableArrayAdapter(String[]{"John", "Jane", "Jack", "Jade"}) {

		public void onItemClick(AdapterView a, View v, int pos, long id) {
			Log.d(tag, "You clicked on item " + pos);
		}

		// Background will be different for odd and even items
		public ViewNode itemView(int pos) {
			return v(TextView.class,
				backgroundColor(pos % 2 == 0 ? MyStyle.WHITE : MyStyle.GREY),
				onItemClicked(this::onItemClicked),
				text(getItem(pos)));
		}
	};

	public ViewNode view() {
		return
			v(ListView.class,
				adapter(myAdapter));
	}

Also, a renderable base adapter exists to give you more flexibility.

## Styling your views

If some views share the same style - just move it to another method as you would do in any programming language to avoid code duplication:

	public AttrNode textStyle() {
		return attrs(
			textColor(Color.BLACK),
			textSize(27),
			gravity(CENTER));
	}

	...

	v(TextView.class,
		textStyle(),
		text("Hello"))

You can even override some styles, the latter one has priority, since java method arguments are evaluates left to right:

	v(TextView.class,
		textBaseStyle(),
		textStyle(), // may override some properties in textBaseStyle
		text("Hello"))

Now, the fonts. I really like good typography and here's how to make it less painful in Android:

	v(TextView.class,
		// use "assets/RobotoCondensed-Light.ttf" typeface
		typeface("RobotoCondensed-Light.ttf"),
		text("Hello, Roboto!"));

And now something completely different...

**Icons**! You can use [Font Awesome][5] icons inside your textviews. They can be any color, they fit every screen size, no extra work is needed:

	private AttrNode materialIcon(String s) {
		return attrs(
				size(dip(48), dip(48)),
				gravity(CENTER),
				textColor(Color.WHITE),
				typeface("Material-Design-Icons.ttf"),
				textSize(36),
				backgroundResource(R.drawable.icon_button),
				text(s));
	}

	v(TextView.class,
		materialIcon("\ue620"), // Icon for remove

## I like to move it move it

Animations are great. But how hard can it be to tie them to the app logic... Anvil tries to simplify it (still work in progress, so the API may be changed soon):

	private boolean isShown = false;

	...

	v(TextView.class,
		anim(!isShown).of("alpha", 0f).duration(250),
		anim(isShown).of("alpha", 1f).duration(250).listener(() -> {
			// animation has ended
		}));

	...

	// Here's how to show the view with animation:
	isShown = true
	// Here's how to hide the view with animation:
	isShown = false

Also, you can use an existing Animator class (e.g. inflated from animation XMLs):

	v(TextView.class,
		anim(isShown, myAnimation));

## Single-activity applications

With Anvil it's very easy to componentize your app. Each component will be an
isolated renderable view. Now, how to do the navigation between them if they
are all in the same activity?

Anvil provides a simple helper in the Backstack class:

	private Backstack mBackstack = new Backstack(this, (v) -> {
		setContentView(v);
	});

	@Override
	public void onCreate(Bundle b) {
		super.onCreate(b);
		if (b != null) {
			mBackstack.load(b);
		} else {
			mBackstack.navigate(new MyDefaultView(this));
		}
	}

	@Override
	public void onBackPressed() {
		if (!mBackstack.back()) {
			finish();
		}
	}

You can use backstack navigate method anywhere inside your views. You can also
save the stack of the views to Bundle inside onSaveInstanceState() in your
activity.

## Kotlin!

Anvil work fine with good old Java 6. With Java 8 + Retrolambda you would be
able to use method references and lambdas making your code much more compact.

But [Kotlin makes it even better][6]!

## Are here any real apps written with Anvil?

Yes. First, you can check the example that comes with Anvil. Next, I've
published a couple of simple games on Google Play (sources will be released
later) - [Spot](http://play.google.com/store/apps/details?id=trikita.spot) and
[Quilt](http://play.google.com/store/apps/details?id=trikita.quilt). Both
written exclusively with Anvil.

## Bright future you say?

Currently Anvil is good enough to be used. I wonder if Anvil can be integrated
with some event bus implementations, so onClick() would take an event object
instead of taking a listener. This will simplify the syntax of Java without
lambdas. Also, animations could be implemented in better way I think.
Performance could be optimized by caching the attribute nodes. Helpers could be
added for colors (like darken()/lighten() etc), for touch events, for support
libraries. Tutorials could be written for newcomers.

Lots of things to do. Stay tuned.


[1]: https://github.com/zserge/anvil
[2]: /blog/android-mvx.html
[3]: /blog/anvil-1.html
[4]: http://corner.squareup.com/2014/10/advocating-against-android-fragments.html
[5]: http://fortawesome.github.io/Font-Awesome/icons/
[6]: /blog/anvil-kotlin.html
