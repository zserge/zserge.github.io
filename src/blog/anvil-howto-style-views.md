title: "Anvil howto: view styling"
description: "How to use view styles in Anvil: traditional XML approach and more flexible styling with code"
keywords: android, styles, xml
date: 2016-03-28
---
# {{title}}

A common question I hear about [Anvil](https://github.com/zserge/anvil) is how
to style views.

Let's recall how it's been traditionally done in Android. Here's an example
from the Android Developers website:

```xml
<TextView
    android:layout_width="fill_parent"
    android:layout_height="wrap_content"
    android:textColor="#00FF00"
    android:typeface="monospace"
    android:text="@string/hello" />
```

If you have a lot of views like this - most likely you would like to move
repetitive code into a single place and just keep a reference to them in the
layout. That's what we call a style - a reusable set of view attributes.

Android styles are normally written as XMLs:

```
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="CodeFont" parent="@android:style/TextAppearance.Medium">
        <item name="android:layout_width">fill_parent</item>
        <item name="android:layout_height">wrap_content</item>
        <item name="android:textColor">#00FF00</item>
        <item name="android:typeface">monospace</item>
    </style>
</resources>
```

While Anvil doesn't support such styles as a first-class citizen - it still
supports them by using XML layouts or by sub-classing a view with the default
style overridden:

```
// In XML:
<TextView id="@+id/my_text" style="@style/CodeFont" />
// In Java inject your XML layout and bind data to the views
xml(R.layout.my_text_layout, () -> {
	withId(R.id.my_text, () -> {
		text(R.string.hello);
	});
});

// Subclass ProgressBar
public class MyProgressBar extends ProgressBar {
	public MyProgressBar(Context c) {
		super(c, null, android.R.attr.progressBarStyleSmall);
	}
}
v(MyProgressBar.class, () -> {
	...
});
```

This is still only a fallback option if you really have to use XML styles,
because for most cases Anvil offers a much better solution to styling than XML.

## Custom Style class

You may create a custom `Style` utility class (e.g. a final class with just
static methods or constant fields):

```java
public final class Style {
	public static class CodeFont {
		public final static int width = FILL;
		public final static int height = WRAP;
		public final static int textColor = Color.BLUE;
		public final static Typeface typeface = Typeface.MONOSPACE;
	}
}
```

Now you may use this style in Anvil layouts:

```java
textView(() -> {
	size(Style.CodeFont.width, Style.CodeFont.height);
	textColor(Style.CodeFont.textColor);
	typeface(Style.CodeFont.typeface);
});
```

So far it's very similar to XMLs, but let's see how it can be developed further.

## Calculated values

Since we have the full power of a real programming language - we can describe
dependencies between the values. For example if our text color is 20% darker
than some common accent color - we can write it as an expression. It also
applies to other values like sizes, margins, weights etc - they may be derived
from some base style.

Now if you want to change you app accent color from blue to red - you only need
to change it in one place.

```java
public final class Style {
	public static class Base {
		public final static int accentColor = Color.BLUE;
		public final static int textSize = sip(16);
	}
	public static class CodeFont {
		public final static int textSize = Base.textSize * 0.8;
		public final static int textColor = darken(Base.accentColor, 0.2);
	}
}
```

## Functions, not constants

However it's more useful use functions instead:

```java
public final class Style {
	public static void monospaceText() {
		typeface(Typeface.MONOSPACE);
	}
	public static void bigView() {
		size(MATCH, MATCH);
		padding(dip(20));
	}
	public static void darkCodeText() {
		textSize(Base.textSize * 0.8);
		textColor(darken(Base.accentColor* 0.8));
	}
	// Now we can use other style functions as mixins
	public static void codeFont() {
		bigView();
		monospaceText();
		darkCodeText();
	}
}

textView(() -> {
	Style.codeFont();
	text("Hello");
});
```

The style definitions look more compact and they are very flexible - we can even
include certain conditional constraints. For example if we want our view to be
full-screen in landscape and have bigger font - it can be part of the style:

```java
public final class Style {
	public static void codeFont() {
		if (isPortrait) {
			size(MATCH, WRAP);
			textSize(sip(18);
		} else {
			size(MATCH, MATCH);
			textSize(sip(20);
		}
		textColor(darken(Base.accentColor* 0.8));
	}
}
```

## Overriding styles

My personal favourite way of making styles is passing a renderable lambda
to override the style if needed:

```
public static void codeFontView(Anvil.Renderable r) {
	// View class
	textView(() -> {
		// With common style values
		if (isPortrait) {
			size(MATCH, WRAP);
			textSize(Base.textSize * 0.8);
		} else {
			size(MATCH, MATCH);
			textSize(Base.textSize);
		}
		textColor(darken(Base.accentColor* 0.8));
		// Let the caller to override style
		r.view();
	});
}

// Usage:
codeFontView(() -> {
	text("Hello"); // Has default style attributes
});

codeFontView(() -> {
	text("World");
	textColor(Color.RED); // Has default style attributes, but textColor overridden
});
```

It's useful if you want to separate how your view looks from how your view
behaves - you may move look-and-feel styles into a utility class, but leave
your data bindings and listeners inside your main class.

As you can see, Anvil is more flexible than XMLs and you may architect your
styles any way you like by using constants, expressions, overriding styles or 
mixing them together.
