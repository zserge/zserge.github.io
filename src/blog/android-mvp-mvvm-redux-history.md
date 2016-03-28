title: The evolution of Android architecture
description: "Android history: from no architecture to MVP to MVVM to Redux"
keywords: android, mvp, mvvp, data binding, redux, react, anvil
date: 2016-03-28
---
# {{title}}

Android is probably the second most popular development platform after the web.
Web development practices tend to change every month if not every week. As soon
as a tool or a library becomes mature and stable - they call it deprecated and
seek for a new replacement. Now let's see how Android development tools and
paradigms have evolved over the past few years and how it compares to the web.

## Year 2010: classic Android

In 2010 we've been all still learning Android. We wrote UI layouts in XMLs and
had the following code in every activity:

```java
TextView mCounterText;
Button mCounterIncrmentButton;

int mClicks = 0;

public void onCreate(Bundle b) {
  super.onCreate(b);

  mCounterText = (TextView) findViewById(R.id.tv_clicks);
  mCounterIncrementButton = (Button) findViewById(R.id.btn_increment);

  mCounterIncrementButton.setOnClickListener(new View.OnClickListener() {
    public void onClick(View v) {
      mClicks++;
      mCounterText.setText(""+mClicks);
    }
  });
}
```

This resembles a lot of the jQuery ages in web development. The snippet below
is a jQuery equivalent of the above Androd code:

```javascript
var clicks = 0;
$('.incr-button').on('click', function() {
  clicks++;
  $('.counter').text(clicks);
});
```

Just to remind, in 2010 web developers already had HTML5 rising with media
queries to support multiple screens, CSS3 to support hardware-accelerated
animations and so on. JQuery and Sencha ExtJS were leading libraries and
developers have been writing spaghetti code, which everyone hated.

## Year 2013

In three years we've been all tired of the clumsy Eclipse and tons of redundant
code we wrote in every app.

The year of 2013 brought us two famous libraries to solve the most obvious
problems.

[Retrlolambda](https://github.com/orfjackal/retrolambda). Thanks, @orfjackal.
It helped a lot. Replacing all listeners with compact lambdas was a breath of
fresh air.

[ButterKnife](https://github.com/JakeWharton/butterknife). Thanks,
@jakewharton. We finally got rid of all those setOnXXXListeners and
findViewByIds.

Our code now looked more clear:

```java
@Bind(R.id.tv_clicks) mCounterText;
@OnClick(R.id.btn_increment)
public void onSubmitClicked(View v) {
	mClicks++;
	mCounterText.setText(""+mClicks);
}
```

Also by that time we already had Ice Cream Sandwich and Jelly Bean released.
Later that year Google have released KitKat, the most popular Android OS
version so far.

How this compares to web development? Well, web developers in 2013 moved from
jQuery's spaghetti to some MVC frameworks. They have been using Backbone.js,
Angular.js and Ember.js. Angular is probably the most prominent one in the list
- it moved away from manipulating DOM nodes (views) directly and offered
declarative data binding instead. The views updated automatically as you
changed your data which felt really reactive.

## Year 2014

The most important event to me in 2014 was the article
["Advocating against fragments"](https://corner.squareup.com/2014/10/advocating-against-android-fragments.html).
Written by the engineers from Square it explained why Android Fragments, the
concept advertised by Google and blindly trusted by many developers turned out
to be a trouble-maker.

They also have shown that there is almost no benefits in using fragments versus
using custom viewgroups (well, assuming that Fragment from the support library
is actually a custom viewgroup is not a big surprise).

This seems to be the first time when a technology so strongly forced by Google
has been fairly criticized and the criticism was widely accepted.

Also that year we could finally have dropped the support of Android Gingerbread
if we cared about the top 90% of the devices.

Finally, that year of 2014 have started the glory of MVP
(Model-View-Presenter) architectural pattern. Most Squareup libraries have
promoted this pattern and people gladly followed it. We've learned to separate
our view presentation layer from the data layer.

While this also led to a noticeable code bloat (the price you pay for making
your presenter and view match the interfaces) - it opened the doors to actually
useful unit testing.

Web development trends that year have shown the rise of React.js. Another
paradigm shift resulted in high-performance modular UI components.  The
simplicity and efficiency of the React ideas brought a crowd of the followers,
some of them made tiny custom React-like libraries: Mithril, Riot, Bloop etc.

React simplicity and flexibility caused it to gain popularity very quickly and
it became a strong alternative to Angular.

## Year 2015

In the middle of 2015 Google presented its Data Binding library (still in
beta). There has been some earlier attempts to achieve Model-View-ViewModel (MVVM) in
android ([Robobinding](http://robobinding.github.io/RoboBinding) is probably the most
famous one).

Google made their data binding library in the spirit of Angular - XML acts as
a custom template with a special language to denote data bindings. Then
some code is generated to actually render views bound to that data.

```xml
<layout xmlns:android="http://schemas.android.com/apk/res/android">
   <data>
       <variable name="counter" type="com.example.Counter"/>
       <variable name="counter" type="com.example.ClickHandler"/>
   </data>
   <LinearLayout
       android:orientation="vertical"
       android:layout_width="match_parent"
       android:layout_height="match_parent">
       <TextView android:layout_width="wrap_content"
           android:layout_height="wrap_content"
           android:text="@{counter.value}"/>
       <Buttonandroid:layout_width="wrap_content"
           android:layout_height="wrap_content"
           android:text="@{handlers.clickHandle}"/>
   </LinearLayout>
</layout>
```

At this point many people started shifting
[from MVP to MVVM](http://tech.vg.no/2015/07/17/android-databinding-goodbye-presenter-hello-viewmodel/).

Android developer community seems to be split into several groups. Some only
use the technologies backed up by Google. This is the most conservative group.

Others trust some well-known developers or companies as well. Of course there
is a group of people who always try something new - Groovy, Scala, Clojure,
Mirah, new libraries and frameworks. It's risky and often causes more troubles,
but this is what actually drives the evolution.

I personally was afraid of Retrolambda because I thought that patching binary
code can break things at any moment. But now I trust retrolambda and have lots
of production apps using it.

Same about [Kotlin](https://kotlinlang.org). I have been looking for a sane
Java replacement for years and when Kotlin became more or less stable - I gave
it a try. Until year 2015 I was afraid that Google might break something and
Kotlin may stop working. But so far it's been surprisingly well. Now I use
Kotlin in some of my projects and I like it.

[Buck](https://buckbuild.com) is also a notable example. Google's Gradle is a
leading build system in Android development. However Buck developers from
Facebook do lots of work to make a really fast build system with predictable
(reproducible) results.  I've tried Buck in a few projects and it was much,
much faster than Gradle.  Still waiting for [Bazel](http://bazel.io) to
officially support Android or Buck to become more popular.

## Modern Times

In the past Android developers used to be a step behind the web development
trends. It's not bad, there was time to watch the rise and fall of the
technologies and apply the ones that survived.

But evolution always wins. We got better tools anyway, despite Google ignoring
developer requests.

I started [Anvil](https://github.com/zserge/anvil) in 2015 as an attempt to
bring reactive views to Android. I admit that now we have serious competitors
like [React Native](https://facebook.github.io/react-native) or Google Data
Binding library. Still, Anvil has lots of advantages which I will describe in
the following posts.

Also we've recently implemented [Redux](https://github.com/trikita/jedux)
architecture for Android which really feels superior to MVVM in most cases.

I'm glad to see that Android developers are now open to the paradigm shifts and
happy to try new tools and instruments. This means that sooner or later by
trial and error, by natural selection and other evolutionary tricks we will get
an (almost) perfect development ecosystem that finally make the developers
happy.

