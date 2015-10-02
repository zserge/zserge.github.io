title: "Anvil: time for a change"
description: I merged anvil-forge branch back to master and published a new version.
date: 2015-10-01

---

# {{ title }}

Those of you who regularly check my blog may remember that I was going to
[redesign Anvil from scratch]. Unfortunately, it was an unavoidable step. We
had performance issues and it turned out that blindly copying modern web
metaphors to Android doesn't work well.

I am sorry, I had to change a lot of Anvil APIs since then. Those of you who
have their apps written with Anvil 0.0.12 most likely would prefer to stick
with the older version.

But please, don't be too conservative. New Anvil has a lot to offer.

## Performance

As being said, old Anvil turned out to be slow. The reason was a lot of lists
and other collections that have been created during each rendering cycle, even
if no data has been changed. New Anvil fixes it and brings you **5-7 times
faster rendering**!

Also, I've measured the cost of lambdas. It turns out Retrolambda is doing its
job very well, it caches lambdas when they don't depend on the outer
environment turning them into singletons.

But even if your lambdas are not cached - in practice you won't even notice the
loss of performance! In the tests I've made the rendering time with cached Java
6 listeners was at most 1% faster than with Java 8 lambdas. But if you really
want to get that 1% performance boost - you may still cache lambdas manually.

New Anvil also produces almost no garbage while rendering, so there is no
noticeable GC delays, even if you update your UI while scrolling the views or
animating them.

Let me show you some numbers. If you render a layout of 100 views, about 10
attributes each - **you still can do about 4000 render cycles per second**! And
it grows linearly, so simple layouts of 10 views would be rendered 10 times
faster.

## Diff'ing in the pipeline

The key concept of Anvil is a virtual layout. Anvil keeps lightweight
representations of your views and their attributes and compares them before
applying the changes to the actual views.

For the old Anvil is was absolutely true. Now it keeps only one virtual layout
tree and traverses it during the next rendering cycle, "patching" it in-place.

This gives dramatic speed improvement for the most typical uses cases (when the
layout remains the same, but the views change their properties). There is some
regression when the new views are added or removed dynamically, but that never
has been a fast operation anyway. So if really have to add/remove views in
runtime - you might want to use adapters or maybe toggle view visibility
instead.

## First-class support of Kotlin and Java 8

So, lambdas are fast, rendering is fast. Why not to make it the default syntax
then? Now Kotlin and Java 8 are supported out of box (yes, no need for
`Sugat.kt` anymore!):

	linearLayout {
		textView {
			text("Hello")
		}
		button {
			onClick(listener)
		}
	}

Java 6 is still supported, using syntax that resembles the old Anvil:

	o (linearLayout(),
		o (textView(),
			text("Hello")),
		o (button(),
			onClick(listener));

## Imperative statements, not return values

Most functions now return `Void` - it's not important what the property setter
function returns, because the main job is already done when it's been called.

You can use the full power of Java without whining about poor support of
functional data processing techniques - you can use `for` loops instead of
(missing) function map method on collection. You can use normal
`if/else/switch` conditionals instead of ternary operations. You can append
views in a loop and style your views easily.

Here's an example of the new syntax in Kotlin:

``` kotlin
public override fun view {
	linearLayout {
		orientation(LinearLayout.VERTICAL)

		// If certain group of views is in every activity -
		// you may move it to a separate "utility" class
		AppStyle.headerView()

		inputField(Icon.USER, login)
		inputField(Icon.PASSWORD, passwd)

		button {
			size(FILL, WRAP)
			text(R.string.login)
			enabled(login.toString().length() > 0 &&
				passwd.toString().length() > 0)
			onClick { v ->
				performLogin(login.toString(), passwd.toString())
			}
		}
	}
}
// If a certain group of views is repeated in the layout - 
// move it to a separate method
fun inputField(iconText, input) {
	linearLayout {
		orientation(LinearLayout.HORIZONTAL)

		textView {
			fontAwesomeIconStyle()
			text(iconText)
		}
		editText {
			size(0, FILL)
			text(input)
		}
	}
}

// If the same style is applied many times - move it to a separate method
fun fontAwesomeIconStyle() {
	// Here you can define properties common for all FontAwesome icons
	size(dip(48), dip(48))
	gravity(CENTER)
	typeface("fontawesome.ttf")
	// You may use different styles depending on the app theme, orientation,
	// screen size or user preferences
	if nightMode() {
		...
	} else {
		...
	}
}
```

As you can see the rules of refactoring (like "don't repeat yourself") still
apply here. You already know them, so you're ready to write maintainable code
with Anvil. Use the full power of your programming language.

## Separation of API levels

As any other library, Anvil has certain impact on your APK size. Previously we
included generated bindings for the two API levels - Android 2.3.3 and Android
4.0.3. That added roughly 500KB to the APK size.

It's not so important nowadays, but I really wanted to ship different builds of
Anvil for different minSdk levels. And new Anvil solves this as well.

Instead of publishing `co.trikita:anvil` we now publish
`co.trikita:anvil-sdk10`, `co.trikita:anvil-sdk15` and
`co.trikita:anvil-sdk19`. This results in smaller APKs, faster build times and
cleaner architecture of Anvil itself. We now have standalone Anvil core, which
can be tested separately, and generated property setters that may not be tested
at all (yet), since they are all dead simple.

## Reactive adapters

Old Anvil provided its own Adapter implementation, but one had to call
notifyDataSetChanged to force it to redraw.

New Anvil uses ViewHolder pattern, new adapters are faster, and list items are
now reactive as well, which means they are automatically updated when you call
Anvil.render(). Calling notifyDataSetChanged() might still be needed when you
add or remove items (so the adapter would create more reactive item views), but
existing and currently shown Views will be updated without
notifyDataSetChanged().

## Less is more

New Anvil has 25% less code in it. API contains the following classes:

* Anvil: use it to mount, unmount and re-render your components (only 3 methods)
* RenderableView: extend it to make a component (override 1 method)
* RenderableAdapter: extend it to make a reactive adapter (override 3 methods)
* DSL: use it intuitively to create views and set up their properties.

So learning ~10 methods and understanding the general idea of how Anvil works
is enough to write even complex Android apps with Anvil.

## Roadmap

I've published Anvil 0.1.0 recently to `mavenCentral` and `jcenter`, and merged
the development "forge" branch back to the master branch. You may already start
playing with it. Sources are on [github], as usual.

I've ported all examples to the new Anvil, you may find them at
https://github.com/zserge/anvil-examples. You may also use them to see how one
can port Anvil 0.0.12 application to Anvil 0.1.0.

Anvil is now actively developed. Next step would be to prepare and publish
documentation to help new users start with Anvil.

Also, you may notice that I've removed Backstack class from the new Anvil.
That's because I'm thinking about making it its own library (but more
powerful).

Finally, the State + Animations is something that mostly remained unchanged,
but there are a few misconception in those modules. I'm afraid the animations
API is likely to be changed again soon.

Please let me know what you think of this update, and don't hesitate to spread
the word about Anvil if you like it!


[redesign Anvil from scratch]: /blog/anvil-breaking-changes.html
[github]: https://github.com/zserge/anvil
