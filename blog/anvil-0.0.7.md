title: Anvil: Double O Seven
description: A preferred way to prepare your android apps. Shaken, not stirred.
keywords: android UI, android design, android architecture, android mvc, simple android animations, android react.js, android reactive UI, butterknife, dagger
date: 2015-06-25

# Anvil: version 0.0.7 released!

If you missed the news - [Anvil](https://github.com/zserge/anvil) is a tiny
reactive UI library for Android. It's based on the concept of the virtual
layout (much like React.js) and brings declarative layouts with data bindings,
componentization, styles, animations etc in pure Java.

It also supports Kotlin, which is a great language and I hope it will replace
Java on Android some day.

Version 0.0.6 was suprisingly stable, but life goes on, and here's version 0.0.7.

## config() helper

If you really have to work with real views and not the virtual layout - you can
do it now. It's helpful for SurfaceViews, TextureViews and other views where
just setting the attributes is not enough.

Also it can be helpful if you want to migrate to Anvil gradually - you can move
layouts to Java, but let the configuration of the views (binding callbacks,
setting styles and attrobutes) happen in existing methods:

	public void initUi() {
		mMyButton = (Button) findViewById(MY_BUTTON);
		mMyButton.setOnClickListener(new View.OnClickListener() {
			public void onClick(View v) {
			}
		});
	}

	public ViewNode view() {
		return
			v(LinearLayout.class,
				config(v -> initUi), // initUi will be called when layout is ready
				v(Button.class,
					id(MY_BUTTON)));
	}

Of course, it's highly recommented to use config() wisely and let Anvil deal
with your data binding.

## better syntax for views

Some people requested to add more sugar to view trees, so now there is a
generated file Views.java which simplifies the tree construction of the
existing view classes from the Android SDK JAR:

	// Normal Anvil variant
	v(LinearLayout.class,
		v(Button.class,
			text(R.string.click_me)
			onClick(onButtonClick)),
		v(TextView.class,
			text(someText))

	// "Sugarized" variant, aligning parens is a matter of taste, of course
	linearLayout(
		button(
			text(R.string.click_me),
			onClick(onButtonClick)
		),
		textView(
			text(someText)
		)
	)

Another advantage is that you don't need to import every view class that you're
using in your layouts.

Of course, the traditional v() approach remains, and is the only way you can
add your custom classes into the view tree.

## relative layout

With 0.0.7 you can now use it like:

	v(RelativeLayout.class,
		size(FILL, FILL),
		padding(dip(16), 0),

		v(EditText.class,
			id(ID_NAME),
			hint("Reminder time"),
			size(FILL, WRAP)),

		v(Spinner.class,
			id(ID_DATES),
			size(0, WRAP)
				.align(BELOW, ID_NAME)
				.align(ALIGN_PARENT_LEFT)
				.align(LEFT_OF, ID_TIMES)),

		v(Spinner.class,
			id(ID_TIMES),
			size(dip(96), WRAP)
				.align(BELOW, ID_NAME)
				.align(ALIGN_PARENT_RIGHT)),

		v(Button.class,
			text("Done"),
			size(dip(96), WRAP)
				.align(BELOW, ID_TIMES)
				.align(ALIGN_PARENT_RIGHT)));
		
## other things

There's been many bug fixes and small changes since 0.0.6.

Probably the most notable minor improvement is that you can now call
Anvil.render() from any thread, not just the UI thread. It simplifies code a
lot in background tasks where you don't care about the Context, but modify the
data that is reflected in the UI somehow.

## Matter of state importance

One last thing to list here is states. Anvil's strong point is declarative
animations. You can declare them right in your layout - how they behave, when
they are started/stopped etc. Then you can trigger them by just changing one
boolean variable.

However when your animations start to chain and depend on each other - it can
become pretty messy (but still cleaner than if you used only andorid SDK).

Now there are States - tiny two-state finite state machines that can slowly (or immidiately)
switch from one state ("on") to another ("off") and back. Binding animations to
the states instead of raw boolean variables gives your more flexibility over
time and sequence of data changes that involve view animations.

However I have to acknowledge you that States API is still experimental and
might be changed in future versions.

Posted on {{ date }} {{ rss }}

{{ social }}
{{ disqus }}


