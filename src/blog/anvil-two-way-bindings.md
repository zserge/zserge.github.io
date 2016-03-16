title: Two way data bindings in Anvil
description: How to register callbacks in your views to change data bound to the same views
keywords: android, anvil, react, user input, data binding, mvvm
date: 2016-03-15
---

# {{ title }}

New Anvil 0.3.0 has been released. The major focus for this release has been on user
input widgets and two-way data bindings.

## Issues

There have been two types of issues in this two-way data binding milestone:
bloated inconvenient event listeners and recursion.

## Listeners

The first one is easy. Java 8 and Kotlin are the primary languages for Anvil,
so when people bind an event listener to a view - they use either a lambda or a
method reference. This means that all common event listeners should have a
simple functional interface form (lambda).

Here's what we've got:

* Button:
	- `onClick((View v) -> {})`
* CompoundButton:
	- `onCheckedChange((CompoundButton b, boolean checked) -> {})`
* RadioGroup:
	- `onCheckedChange((RadioGroup r, int checkedId) -> {})`
* Spinner:
	- `onItemSelected((AdapterView av, View v, int pos, long id) -> {})`
* SeekBar:
	- `onSeekBarChange((SeekBar sb, int value, boolean fromUser) -> {})`
* TextView:
	- `onTextChanged((CharSequence s) -> {})`
* NumberPicker:
	- `onValueChanged((NumberPicker v, int oldValue, int value) -> {})`
* TimePicker:
	- `onTimeChanged((TimePicker v, int hours, int minutes) -> {})`
* CalendarView:
	- `onDateChanged((CalendarView v, int year, int month, int day))`

Everywhere except for the `RadioGroup` and the `CompoundButton` you may safely
omit data types in lambda arguments - they will be inferred automatically. In
Kotlin you may resolve the lambda ambiguity between RadioGroup and
CompoundButton callbacks by specifying at least one argument type in lambda, e.g:

* CompoundButton: `onCheckedChange { v, checked: Boolean -> ... }`
* RadioGroup: `onCheckedChange { v, checked: Int -> ... }`

This should cover all the standard views that are commonly used in android
apps. The only one left aside is SearchView. First of all, it requires API
level 11 while Anvil current minSdk is 10. Next, it's a really problematic one
because it has the same issues as TextView plus its own strange misbehaviors
like hooking into back button or glitches with expand/collapse. Finally, I
don't think people use SearchView a lot as a real two-way input type. As far as
I know it's most often used inside action bars where Anvil is of little help.

To be fair, you can still use SearchView if you initialize query inside the
`init { ... }` block and bind a query listener that doesn't call setQuery()
internally. That's how you can get user input with Anvil and it works well
without any issues.

## The Curse of Recursion

TextView has been Anvil's burden for more than a year. The reason is that it
has a listener that can't be just set, but can only be added or removed
instead.  Futhermore there is no way to detect if a certain listener has been
added or not.

Next, TextWatcher is called from inside every setText, recursively. Even if the
text is the same.

And the worst - setText changes cursor position.

The only solution I could came with was to keep track of the currently active
input field and ignore setText calls on that field as a reaction to user input.
Firstly, because that text view already has the requested text value. Secondly,
because is seems to be the only way to keep the cursor in place.

So for TextViews you can now use full TextWatcher interface or a shorthand
lambda with just a CharSequence.

## Minor changes

Talking of text views, do you know that `setTextSize()` in Android takes a
value in "sp" (implicitly), while in XMLs we're used to specify "sp"
explicitly.

This means that `android:textSize="27sp"` and `textView.setTextSize(sip(27))`
result in different text sizes.

By the way, do you know that `getTextSize()` returns the value in pixels?

Anvil finally makes it all sane. `textSize()` takes pixels by default, much
like size, margin or padding do.

To specify size in sp you can do `textSize(sip(27))`. Or you may use `dip` if
you prefer.

## Examples

To make it easier to start with Anvil we've updated the `anvil-examples`
repository adding two subprojects: databinding and databinding-kotlin. Both
demonstrate how you can bind the data to various views, change data from the
view event listeners and update views when data is changed.

https://github.com/zserge/anvil-examples/tree/master/databinding

https://github.com/zserge/anvil-examples/tree/master/databinding-kotlin

And if you find any issues or would like to suggest an example to be added -
please file an issue at https://github.com/zserge/anvil-examples/issues
