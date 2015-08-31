title: Anvil: the story of automatic rendering
description: How to render your view automatically and stop worrying about UI state
keywords: anvil, android, render, layout, mvc, mvvm, mvp, mithril, listeners, knork
date: 2015-01-22

Reading my [previous blog post](/blog/android-mvx.html) some people asking why I'm so strongly against
XMLs if they are really good? I think I shall clarify that I'm not against XMLs
per se, I'm against the way many developers organize their apps. Let's look at
a simple example - a button and a textview showing how many times the button
was pressed.

Here's a typical implementation in Java+XML:

	<LinearLayout ....>
		<TextView android:id="@+id/text" ..../>
		<Button android:id="@+id/button" .... />
	</LinearLayout>

	private int mNumberOfClicks = 0;

	setContentView(R.layout.counter_layout);
	final TextView textView = (TextView) findViewById(R.id.text);
	Button b = (Button) findViewById(R.id.button);
	button.setOnClickListener(new View.OnClickListener() {
		public void onClick(View v) {
			mNumberOfClicks++;
			textView.setText("Clicked " + mNumberOfClicks + " times");
		}
	});

Here's the same example written with Anvil:
	
	private int mNumberOfClicks = 0;

	View.OnClickListener increment = (v) -> mNumberOfClicks++;

	public NodeView view() {
		return
			v(LinearLayout.class,
				v(TextView.class,
					text("Clicked" + mNumberOfClicks + " times")),
				v(Button.class,
					text("Increase"),
					onClick(increment)));
	}

So far they are very similar, but we can already see that View and Controller
are clearly separated in the second example. Is it helpful?

Let's now have two buttons - increment and decrement, and let's the range of
number will be between 0 and 10. Increment button should be disabled when the
number reaches 10, decrement button should be disabled when the number reaches
0.

This time we will use the Knork view injector to make code shorter:

	<LinearLayout ....>
		<TextView android:id="@+id/text" ..../>
		<Button android:id="@+id/up" .... />
		<Button android:id="@+id/down" .... />
	</LinearLayout>

	private int mNumberOfClicks = 0;

	@Id(R.id.text) TextView mTextView;
	@Id(R.id.up) Button mUpButton;
	@Id(R.id.down) Button mDownButton;

	@On(CLICK + R.id.up)
	public void onClick(View v) {
		mNumberOfClicks++;
		mDownButton.setEnabled(true);
		if (mNumberOfClicks == 10) {
			mUpButton.setEnabled(false);
		}
		updateText();
	}

	@On(CLICK + R.id.down)
	public void onClick(View v) {
		mNumberOfClicks--;
		mUpButton.setEnabled(true);
		if (mNumberOfClicks == 0) {
			mDownButton.setEnabled(false);
		}
		updateText();
	}

	private void updateText() {
		mTextView.setText("Clicked " + mNumberOfClicks + " times");
	}

See what happened? I only changed the requirement about View (another button,
enabled/disabled state should be controlled) - but we had to rewrite most of
the existing Activity code. That's because Activity is not a pure Controller.
It's a mix of View and Controller that are so tightly coupled that you can't
use them separately.

With Anvil where view and controller are decoupled this change won't be even
noticeable:

	private int mNumberOfClicks = 0;

	View.OnClickListener increment = (v) -> mNumberOfClicks++;
	View.OnClickListener decrement = (v) -> mNumberOfClicks--;

	public NodeView view() {
		return
			v(LinearLayout.class,
				v(TextView.class,
					text("Clicked" + mNumberOfClicks + " times")),
				v(Button.class,
					text("Increase"),
					enabled(mNumberOfClicks < 10),
					onClick(increment)),
				v(Button.class,
					text("Decrease"),
					enabled(mNumberOfClicks > 0),
					onClick(decrement)));
	}

I only added one line to the Controller part (because we really need to handle
our model differently, so the controller had to change), and I modified the
view, because it was requested to control the enabled state of the buttons.

If later the requirement becomes to hide buttons instead of enabling them - I
will have to modify the view only, not the controller. But if the change will
be to reset number to zero instead of decreasing it - I will modify the
controller only, not the view.

Now, let's also add a Slider to control the same numeric value. Of course when
the value is changed using the buttons - the slider should be adjusted, too.

With Android+Knork we now have too many places when we need to modify the state
of our views, so we move it to a separate method called "render" to avoid
copy-paste:

	<LinearLayout ....>
		<TextView android:id="@+id/text" ..../>
		<Button android:id="@+id/up" .... />
		<Button android:id="@+id/down" .... />
		<Slider android:id="@+id/seekbar .... />
	</LinearLayout>

	private int mNumberOfClicks = 0;

	@Id(R.id.text) TextView mTextView;
	@Id(R.id.up) Button mUpButton;
	@Id(R.id.down) Button mDownButton;
	@Id(R.id.seekbar) SeekBar mSeekBar;

	@On(CLICK + R.id.up)
	public void increment(View v) {
		mNumberOfClicks++;
		render();
	}

	@On(CLICK + R.id.down)
	public void decrement(View v) {
		mNumberOfClicks--;
		render();
	}

	@On(INJECT + R.id.seekbar)
	public void setupSeekbar(SeekBar seekBar) {
		seekBar.setMax(10);
	}

	@On(SEEKBAR_CHANGE + R.id.seekbar)
	public void change(SeekBar seekBar, int progress, boolean fromUser) {
		if (fromUser) {
			mNumberOfClicks = progress;
			render();
		}
	}

	private void render() {
		mTextView.setText("Clicked " + mNumberOfClicks + " times");
		mDownButton.setEnabled(mNumberOfClicks > 0);
		mUpButton.setEnabled(mNumberOfClicks < 10);
		mSeekBar.setProgress(mNumberOfClicks);
	}

Now, imagine if render() is called automatically in your UI event listeners?
You've just re-invented Anvil! But one important note on performance - Anvil
renders only the parts of the layout that have actually been changed, not all
of your UI widgets.

	private int mNumberOfClicks = 0;

	View.OnClickListener increment = (v) -> mNumberOfClicks++;
	View.OnClickListener decrement = (v) -> mNumberOfClicks--;
	SeekBar.OnSeekBarChangeListener change = new SeekBar.OnSeekBarChangeListener() {
		public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
			if (fromUser) {
				mNumberOfClicks = progress;
			}
		}
		public void onStartTrackingTouch(SeekBar seerBar) {}
		public void onStopTrackingTouch(SeekBar seerBar) {}
	};

	public NodeView view() {
		return
			v(LinearLayout.class,
				v(TextView.class,
					text("Clicked" + mNumberOfClicks + " times")),
				v(Button.class,
					text("Increase"),
					enabled(mNumberOfClicks < 10),
					onClick(increment)),
				v(Button.class,
					text("Decrease"),
					enabled(mNumberOfClicks > 0),
					onClick(increment)),
				v(SeekBar.class,
					max(10),
					progress(mNumberOfClicks),
					onSeekBarChange(change)));
	}

Summing up. Declarative event binding is much more readable than setting
listeners manually. It's as good as using Knork or ButterKnife or RoboGuice or
AndroidAnnotations. Except for with Anvil it gives you automatic smart
rendering of your UI after your event listener has been finished.

Rendering all your layouts at once is nice way to ensure that your model and UI
are always in sync, no matter how complex your UI logic is. But it can be too
complicated if you have lots of UI widgets and you want to change the text of
just one of them. So Anvil does this automatically for you.

Finally, decoupling views and controllers is a good way to keep your app code
clean and maintainable.

P.S. For those who missed the birth of Anvil last week -
[here's](https://github.com/zserge/android-virtual-layout) the repository




