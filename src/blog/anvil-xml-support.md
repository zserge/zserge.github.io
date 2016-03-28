title: The Stockholm syndrome of Android XML
description: We love XMLs, but there might be a better way
keywords: android, anvil, XML, layout, resources
date: 2016-03-29
---

# {{ title }}

When people first hear about [Anvil](https://github.com/zserge/anvil) they
don't trust it because at first glance Anvil seems to be just a replacement for
XML layouts. It's not. It's a library to build predictable reactive views.

There are many known disadvantages of XMLs (poor code reuse, no type-safety, no
variables, very limited styling support etc etc). Yet the developers are so
much used to XMLs that they started liking them!

Let's see how one can use Anvil in all its power and still have XMLs in their
projects.

## XML layouts

Anvil has a Java/Kotlin DSL to describe layouts in code and many people find it
really convenient. But you may still use XML layouts. If you have an existing
XML layout - you may "inject" it into Anvil to bind data or override certain
attributes.

XMLs are injected with an `xml()` call, and you may customize nested view using
`withId()` function.

```xml
<!-- my_layout.xml -->
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  android:layout_width="match_parent"
  android:layout_height="match_parent">
  <TextView android:id="@+id/text"
    android:layout_width="wrap_content"
    android:layout_height="wrap_conent" />
  <Button android:id="@+id/button"
    android:layout_width="wrap_content"
    android:layout_height="wrap_conent" />
</LinearLayout>
```

The above XML layout can be injected like this:

```java
xml(R.layout.my_layout, () -> {
  withId(R.id.text, () -> {
    text(mText);
  });
  withId(R.id.button, () -> {
    onClick(v -> {
      // handle click
    });
    typeface("MyFont.ttf");
  });
});
```

That's how you may use XMLs for UI, styles etc, while using Anvil DSL for data
binding to keeping UI in sync with the data model. This approach is especially
useful if you're moving an existing code base to Anvil.

## Other XML resources

I personally don't use XML layouts anymore, but I still use other XMLs a lot.
Since Anvil is just a thin library that deals with normal android views - you
can still bind values from the XML resources:

```java
// Strings
text(R.string.some_text);

// Colors and color state lists
backgroundColor(R.color.my_background);
textColor(R.color.my_color_list);

// Drawables (and VectorDrawables)
backgroundResource(R.drawable.my_background_drawable);
imageResource(R.drawable.my_image);

// Pre-defined IDs (e.g. for RelativeLayouts)
id(R.id.foo);
```

You may still use Animation resources:

```java
Animation a = AnimationUtils.loadAnimation(getContext(), android.R.anim.slide_out_right);
viewFlipper(() -> {
    inAnimation(a);
});
```

You may extract values from styles as you would normally do in Java with the
TypedArray class:

```java
TypedArray a = context.obtainStyledAttributes(attrs, R.styleable.TileView);
mTileSize = a.getInt(R.styleable.TileView_tileSize, 12);
v(TileView.class, () -> {
	size(mTileSize, mTileSize);
});
```

Basically, all XML resources are supported in Anvil much like they are in
normal Android Java.

## Multiple screens support

All dimensions in your app are likely to be specified in DIP, that's why Anvil
has `dip` and `sip` helper methods. They convert density-intependent values
into pixel dimensions.

In most cases you would want to customize your layouts depending on the screen
geometry or size. Normally you would use layout resource suffices like "-large"
or "-long". With Anvil you have a real programming language so if you want to
use one set of attributes in portrait and another in landscape orientation -
that's a perfect example of the if/else statement:

```java
linearLayout(() -> {
  size(FILL, FILL);
  if (isPortrait()) {
    orientation(LinearLayout.HORIZONTAL);
  } else {
    orientation(LinearLayout.VERTICAL);
  }
});
```

You may also do other checks on `Configuration` object to
include, exclude or customize your layout. It's really easy to tweak the layout
a little depending on the screen configuration (with XMLs you would likely
end up with two separate but very similar layouts or with a style that is not
reusable).

Finally, with Anvil you may calculate dimensions of your views depending on the
actual screen size in pixels detected in runtime. There will be no practical
performance loss comparing to XMLs.

## References to real views

Many Anvil users wonder how to get a real view object. As you may know, layout
described in Anvil is just a set of instructions for view construction, but not
the pointers to the real views.

To get a real view object in Anvil you may simply call `Anvil.currentView()`
inside your virtual layout code. You may keep that reference if needed. It's
recommended to do such things inside the `init` block to ensure that
non-reactive code is executed only once.

```java
Button mButton;
...
linearLayout(() -> {
  button(() -> {
    init(() -> {
      mButton = Anvil.currentView();
    });
  })
});
```

Using init + currentView is a nice way to call methods directly on the custom
views that do not have DSL helpers.

## How to use RelativeLayout in Anvil?

Anvil has wrapper for RelativeLayout parameters such as "centerInParent",
"below", "leftOf" etc. You only need to assign view IDs manually.

In older Android versions this means using pre-allocated R.id constants.  Since
API level 17 you may use `View.generateViewId()` for the same purpose:

```java
private final int ID_BUTTON = View.generateViewId();
private final int ID_TEXT = View.generateViewId();
...
relativeLayout(() -> {
  textView(() -> {
    id(ID_TEXT);
  });
  button(() -> {
    id(ID_BUTTON);
    rightOf(ID_TEXT);
    alignParentButton();
  });
});
```

## Can I use fragments?

You may wonder how to use reactive views inside fragments. Since each fragment
has an `onCreateView` method where the layout can be inflated it becomes no
different from using RenderableViews inside activities:

```java
public class ArticleFragment extends Fragment {
  public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle b) {
    return new RenderableView(container.getContext()) {
      public void view() {
        linearLayout(() -> {
          textView(() -> {
            text("Hello");
          });
          // etc
        });
      }
    };
  }
}
```

Basically you return a renderable view that becomes a fragment layout. You
should not use Anvil.mount() here because that would actually add the view to
the container, while fragment manager prefers to do it in its own manner.

If you want to inject a fragment into some Anvil layout (e.g. if you do tabs
with Anvil) you may use any of the techniques described above - you may use XML
layouts with &lt;fragment&gt; tags inside or you may create a container layout
and use fragment manager to add/remove fragments dynamically using
transactions.

See https://github.com/zserge/anvil-examples/tree/master/fragments for more
details.

To my personal opinion it's much easier to use custom view for modular UI than
fragments. But as you see Anvil doesn't force you to change technologies, use
whatever you are more comfortable with.
