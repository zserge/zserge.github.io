title: Anvil 0.4.0 + support libraries
description: For a long time Anvil worked only with normal SDK views, but now you may use support library views as well
keywords: android, support, appcompat, recyclerview, drawerlayout, anvil, reactjs
date: 2016-05-11
---
# {{title}}

Previously on [Anvil](https://github.com/zserge/anvil): version 0.1 was the
first one to use incremental rendering approach instead of virtual tree
diff'ing. Version 0.2 added support for XML layouts and binding data to
existing views. Version 0.3 was about two-way data bindings - most views got
simplified lambas for handling user input and many related bugs have been fixed.

Today's version 0.4 takes care of support libraries.

I personally rarely use support libraries (at work we don't target regular
consumer devices so material niceties or fragments or action bars are not used
a lot). But the urgency of bringing them to Anvil has been clear.

Thanks to [Lalit Maganti](https://github.com/tilal6991) who rewrote Anvil DSL
generator, it finally got the ability to produce DSL from the support classes
as well.

Here are the new build artifacts that should be added if you are going to use
support libraries with Anvil (you may only add the ones you actually need, they
are all independent):

```
compile 'co.trikita:anvil-support-v4:0.4.0'
compile 'co.trikita:anvil-recyclerview-v7:0.4.0'
compile 'co.trikita:anvil-cardview-v7:0.4.0'
compile 'co.trikita:anvil-appcompat-v7:0.4.0'
compile 'co.trikita:anvil-design:0.4.0'
```

Each one has its own DSL class, so let's quickly jump though all of them.

## Support v4

Here the most notable view functions are `drawerLayout`, `viewPager`,
`pagerTabStrip` and `swipeRefreshLayout`. Most of them can be used like normal Anvil views.

Here's an example of using drawer layout with Anvil:

```java
drawerLayout(() -> {
  init(() -> {
    // The following is needed if you want actionbar to toggle the drawer, too
    drawer = Anvil.currentView();
    drawerToggle = new ActionBarDrawerToggle(activity, drawer, R.string.drawer_open, R.string.drawer_close);
    drawer.addDrawerListener(drawerToggle);
    activity.getSupportActionBar().setDisplayHomeAsUpEnabled(true);
    activity.getSupportActionBar().setHomeButtonEnabled(true);
    drawerToggle.syncState();
  });

  size(FILL, FILL);

  // Main content, often is a custom renderable
  // You may use if/else or switch/case to toggle between different content views
  v(SomeContentView.class, () -> {
    size(FILL, FILL);
  });

  // Drawer menu
  listView(() -> {
    size(dip(240), FILL);
    layoutGravity(START);
    adapter(drawerAdapter);
    onItemClick((av, v, pos, id) -> {
      drawer.closeDrawer(av);
      // handle navigation here
    });
  });
});
```

## RecyclerView and CardView

Prior to Anvil 0.4 we made a separate library that handled RecyclerView. Now
once RecyclerView is part of Anvil libraries you may use it out-of-the-box like:

```
// Simple adapters are created like for ListView
// But one may extend RenderableRecyclerViewAdapter to get more control
someAdapter = RenderableRecyclerViewAdapter.withItems(items, (i, item) -> {
  textView(() -> {
    text(item.text + " at position " + i);
  });
});

recyclerView(() -> {
  linearLayoutManager();
  // If you want grid layout:
  // gridLayoutManager(spanCount)
  adapter(someAdapter);
});
```

Unlike RecyclerView, CardView is a pretty boring library, all you can do is
create a card view and control its corner radius, elevation etc:

```
cardView(() -> {
  cardElevation(1);
  radius(dip(4));
});
```

One potential caveat is using animated views (like switches) inside the
recycler view.  You can't modify such views during the layout phase, so if you
are calling `notifyDataSetChanged` on your recycler adapter from inside the
`view()` method - better delay the adapter change with `post()`. It would fix a
potential crash.

## AppCompat

Due to the programming language semantics, Anvil is unable to replace regular
views with appCompat versions on-the-fly like XML inflater does. Probably it's
for the best - explicit is often better than implicit:

```
appCompatButton(() -> ...);
appCompatCheckBox(() -> ...);
```

## Design

Design library is often being used to get the floating action buttons, so
here's an example:

```
floatingActionButton(() -> {
  compatElevation(dip(4));
  layoutGravity(BOTTOM | END);
  onClick(v -> ...);
});
```

Of course all these libraries are not limited to the examples above, all view
classes and view attributes have been wrapped into DSL. If some of them are
still missing - please report an
[issue](https://github.com/zserge/anvil/issues).

## Caveats

Since Java has no mixins - there now may be some name collisions if you import
all DSLs statically with a wildcard.

There is no simple fix for that, not at least in Java, so whenever you get a
name conflict - specify DSL class explicitly, e.g.  `CardViewv7DSL.cardView(()
-> ...)` instead of `cardView(() -> ...)`.

Some support DSLs modify attributes of the support views which are not
inherited from the common SDK views yet have the same setter names. Likewise,
specify DSL name explicitly in such a case.

Another potential problem could be LayoutParams. If you put your view inside a
support layout - you must set the specific support layout params class. As a
workaround, you may do it explicitly:

```
someSupportLayout(() -> {
  yourView(() -> {
    layoutParams(someSupportLayoutParams);
  });
});
```

For layout params such as `weight` and `gravity` you may use normal Anvil
attribute setters, otherwise either use support DSL setters, or pass the
LayoutParams object manually.

Hope this doesn't stop you from using Anvil, moreover, I hope the adoption of
the support libraries will encourage you to try Anvil in your next project!
