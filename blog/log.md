title: log - a drop-in replacement for android Log class
description: another logger for Android, tiny, easy-to-use, smart and flexible
date: 2015-06-14

# {{ title }}

Once upon a time I was making a pretty large app for Android. When everything
was almost finished I wondered how shall I remove all my logs before publishing
the app? Looks like [many][1] [other][2] [developers][3] are interested in the
same question as well.

Surprisingly, the recommented way out is to strip off the Log class from the
production builds using ProGuard. Maybe Proguard is nice, but to me it's really
weird why instead of having a nice out-of-box API for logging I need to modify
my byte code with some 3rd party tool? I'm not the only one thinking like that,
[Jake Wharton also seems to dislike Proguard][4].

## meet trikita.log

So I decided to make a tiny logger that would be backwards compatible with
android.util.Log but provided some extra functionality, common for other modern
loggers. You may look at the results here:

[https://github.com/zserge/log](https://github.com/zserge/log)

You can build it from the sources, or install it from Maven Central or from
JCenter.

## Features

First, you can intergrate it into your current code with just replacing the
imports (from android.util.Log to trikita.log.Log). AFAIK, no other logger can
do this.

Next, you can control your log levels and output mechanisms. `Log.level(level)`
sets the minimally allows logging level. `Log.useLog()` enables/disabled
logging output via Android Log class. `Log.usePrintln()` uses
System.out.println() for output, which makes it compatible with normal
non-android JVMs.

Finally, you can log multiple values without the annoying string concatenation.
You can log using commas or using the format string:

	Log.d(tag, "user", user, "action", userAction);
	Log.d(tag, "user %s, action code %d", user, actionCode);

Of course 'tag' is optional, by default it will be set to the class name, or to
the string value of the tag field of the class, so the above can be written as:

	Log.d("user", user, "action", userAction);
	Log.d("user %s, action code %d", user, actionCode);

Talking of tag fields, if your class has a field called "tag" or "TAG" - it
will be used to provide the tag name. If you have a different tag field - you
can add it to the list using `Log.useTags`.

## What about Timber?

I like squareup tools. But timber was not as easy to migrate to as
trikita.log.Log is, also timber only allowed formatted strings, while I
personally prefer comma-separated values.

## How to start using it with Android Studio?

In the project pane right-click on the app/java directory (or any other directory
containing your java classes). In the popup menu select "Replace in Path..." option.

'Text to find' should be "android.util.Log".
'Replace with' should be "trikita.log.Log".

Click Find, click All files. You're almost done.

Your imports are correct, but the library is not added in Gradle (unless
you did it manually). Add this to your app's build gradle:

	dependencies {
		compile 'co.trikita:log:1.1.1'
	}

Now it should work, enjoy!

## What's next?

Log is stable enough, you can start using it right now. It's distributed
under MIT license, which means it's absolutely free.

I've recently added the support of long messages (over 4K), so you can now dump
your large JSONs or HTTP responses and they won't be trimmed.

Maybe I shall make the "tag" field more customizable, like it could also be a
method, then it would be evaluated on each call letting you print file names,
line numbers and any other relevant information you need.

Also if you have any feature suggestions or found a bug - please report it to
the issue tracker.



[1]: http://stackoverflow.com/questions/2018263/android-logging
[2]: http://stackoverflow.com/questions/10289129/setting-android-log-levels
[3]: http://stackoverflow.com/questions/11602271/flexible-enable-disable-logging-in-android-app
[4]: https://twitter.com/jakewharton/status/410083660545544192
