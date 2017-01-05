title: Where Anvil meets Kotlin
description: A minimal extension to add Kotlin support to Anvil
keywords: anvil, android, render, UI, mvc, mvvm, mvp, mithril, kotlin, scala
date: 2015-04-16
---
# {{ title }}

Kotlin is a [very nice language for JVM][1]. I [wrote][2] about it in the past.  
[Anvil][3] is a very nice UI library for Android. How do these two play together?

## The first attempt

My favourite example to demonstrate Anvil syntax is a simple click counter. It demonstrates the use of layouts, views, data binding and event binding. In Java it looks like this:

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

When we try to translate this literaly - we get something like this in Kotlin:

	class MyView(c: Context) : RenderableView(c) {

		var count = 0

		public override fun view() =
			v(javaClass<LinearLayout>(),
				size(FILL, FILL),
				orientation(LinearLayout.VERTICAL),

				v(javaClass<TextView>(),
					text("Count: " + count)),

				v(javaClass<Button>(),
					onClick({ count++ }),
					text("Click me")))
	}

Good parts:

* Return type is inferred automatically
* Lambdas are very compact

<br/>
Bad parts:

* javaClass&lt;TextView&gt;() is less readable than TextView.class
* static imports are not working well. I had to import the whole hierarchy of classes
	to get syntax sugar for attributes working

## Type-safe builders

In Kotlin the cool way to make DSLs is [type-safe builders][4]. Here is how I would imagine this to look like:

	class MyView(c: Context) : RenderableView(c) {

		var count = 0

		public override fun view() =
			linearLayout {
				size(FILL, FILL)
				orientation(LinearLayout.VERTICAL)
				textView {
					text("Count: " + count)
				}
				button {
					onClick({ count++ })
					text("Click me"))
				}
			}
	}

Here linearLayout() is a function that takes some other function, and that's why the parens will be omitted:

	linearLayout({
		...
	})
	// same as:
	linearLayout {
		...
	}

But after some quick thoughts I found how complex will it be to make Anvil compatible to this syntax. Basically it would be easier to rewrite it all from scratch rather than adjust it.

The worst part was attribute generators, like text(). In Anvil they return AttrNode instrances, while in Kotlin they should assign AttrNode instances to the parent ViewNode object.

Any ideas?

## Minimally sweetened Anvil

Luckily, Kotlin has _lots_ of syntax sugar. And it also has operator
overloading (oh, I know how bad it can be). We can keep the stack of nested
views and abuse some of the operators to assign AttrNode to the topmost
ViewNode.

This only requires an extra few lines of code:

	// The stack of views
	val stack = ArrayDeque<ViewNode>()

	// A function to build a new view node and put it onto the stack
	inline fun v<reified T: View>(f: () -> Unit): ViewNode {
		val node = ViewNode(javaClass<T>())
		if (!stack.empty) {
			stack.peek().addViews(node)
		}
		stack.push(node)
		f()
		return stack.pop()
	}

	// Overloading "-"
	fun AttrNode.minus() = stack.peek().addAttrs(this);

	// Overloading "+"
	fun AttrNode.plus() = stack.peek().addAttrs(this);

Can you imagine how nicely Anvil code looks now with this little hack? I use
minus here because it resembles me of markdown lists. People can use "+size()"
as well instead of "-size()":

	class MySugarView(c: Context) : RenderableView(c) {

		var count = 0

		public override fun view() =
			v<LinearLayout> {
				- size(FILL, FILL)
				- orientation(LinearLayout.VERTICAL)

				v<TextView> {
					- text("Clicked: " + count)
				}
				v<Button> {
					- text("Click me")
					- onClick {
						println("Button clicked")
						count++
					}
				}
			}
	}

It's clean, it's readable, it's reactive, it's only extra 200K of code for
Kotlin standard library.

Now I wonder why would I still use Java for Android development...


[1]: http://kotlinlang.org/
[2]: /blog/kotlin.html
[3]: /blog/anvil-2.html
[4]: http://kotlinlang.org/docs/reference/type-safe-builders.html
