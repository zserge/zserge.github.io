title: lambda support for Android
description: Bringing java 8 features to android platform
keywords: android, lambda, jdk8, java 8, ant, retrolambda
date: 2014-01-09

# Lambda support for Android

_Note: big thanks to orfjackal (Esko Luontola), the author of 
[Retrolambda](https://github.com/orfjackal/retrolambda), for making it
possible. I just used his tool to produce Android apk._

So, you're jealous about new JDK8 upcoming to most Java developers except for
you, Android coders? Then I have good news - there is a way to use lambdas in
Android right now (_warning: it's still a hack_)!

## But I already have local classes!

Lambdas are very similar to local classes you had since early days of Java. 

The code below looks familiar to every Android developer:

	// defined in the SDK
	interface OnClickListener {
		public void onClick(View v);
	}

	// your code
	mButton.setOnClickListener(new View.OnClickListener() {
		@Override
		public void onClick(View v) {
			// do something here
		}
	});

That's a bit annoying to write such a bloated code for every single
asynchronous action (especially if you're using a plain text editor instead of
an IDE).

Now with Java 8 they introduce
[lambdas](http://cr.openjdk.java.net/~briangoetz/lambda/lambda-state-final.html)
that can be treated as syntax sugar for functional interfaces (interfaces with
just one abstract method, in Java 8 interfaces may contain non-abstract
methods as well).

The code above can be rewritten with lambdas:

	mButton.setOnClickListener((View v) -> {
		// do something here
	});

If there is just one statement inside the method then the braces can be omitted.
Also, if you refer to some variables outside the functional method - no need to
mark them as `final` anymore.

## but android supports only Java 6/7

Java 7 support was added in the KitKat SDK (well, still no support
for `invokedynamic` instruction in Dalvik and ART). So, to achieve Java 8
support we need to backport our code at least to Java 7.

We'll use retrolambda tool to convert our Java 8 compiled classes into Java 7
bytecode that `dx` can correctly process.

## setup JDK

If you're already running JDK8 - you can skip this part. Otherwise, download the
latest [JDK8](https://jdk8.java.net/download.html) and unpack it somewhere.

Modify your Java environment variables to point to the new JDK (e.g.
`$JAVA_HOME`, `$JDK_HOME` etc) and add `bin` directory to `$PATH`.

Ensure you're running Java 8:

	$ java -version
	$ javac -version

Next, install Ant of version 1.9.1 or newer (with added support of JDK8). You
may install it into separate folder and add `bin` subdirectory to `$PATH`.

Download [retrolambda-1.1.2.jar](https://oss.sonatype.org/content/groups/public/net/orfjackal/retrolambda/retrolambda/1.1.2/)
or newer.

Copy some useful classes from JRE8 runtime. I don't know if that can be done
automatically somehow. I unpacked them to a directory and packed it back into
jar. These files are needed only at the compilation stage, they are not
included into the final apk:

	$ unzip -x <path to JDK8>/jre/lib/rt.jar java/lang/invoke/\*
	$ jar cvf rt8.jar java

Put `rt8.jar` and `retrolambda.jar` into your android project directory.

Modify `ant.properties` file inside your android project adding these lines:

	java.target=1.8
	java.source=1.8
	java.compiler.classpath=rt8.jar

Here we tell to produce Java 8 code and to include rt8.jar into the classpath.

Create `custom_rules.xml`:

	<?xml version="1.0" encoding="UTF-8"?>
	<project>
		<target name="-post-compile">
			<exec executable="java">
				<arg value="-Dretrolambda.inputDir=${out.classes.absolute.dir}" />
				<arg value="-Dretrolambda.classpath=${out.classes.absolute.dir}:${project.target.android.jar}" />
				<arg value="-Dretrolambda.bytecodeVersion=50" />
				<arg value="-javaagent:retrolambda.jar" />
				<arg value="-jar" />
				<arg value="retrolambda.jar" />
			</exec>
		</target>
	</project>

Here we add retrolambda processing of the compiled classes before `dx`-ing
them.

I used `<exec>` task, because `<java>` task put `-jar` option in the first
place, but retrolambda requires it to be last argument. Maybe that can be fixed
somehow, I'm pretty bad at Ant.

Try using lambdas in your code. By the way, I got some other cool things
working, too:

	package com.example.lambda;

	import android.app.Activity;
	import android.os.Bundle;
	import android.util.Log;

	public class MainActivity extends Activity {
		@Override
		public void onCreate(Bundle savedInstanceState) {
			super.onCreate(savedInstanceState);
			setContentView(R.layout.main);

			int x = 42;
			runOnUiThread(() -> {
				Log.d("MainActivity", "Hello from lambda! x = " + x);
			});

			try {
				if (false) {
					throw new NullPointerException();
				} else { 
					throw new InterruptedException();
				}
			} catch (NullPointerException|InterruptedException e) {
				// Multiple exceptions work!
				Log.e("MainActivity", "Exception: ", e);
			}

			String s = "fo" + "o";

			// Switch/case for strings works!
			switch (s) {
				case "foo":
					Log.d("MainActivity", "s = foo");
					break;
				case "bar":
					Log.d("MainActivity", "s = bar");
					break;
			}
		}
	}

Finally, do `ant debug` and see if it works.

For those who is using AIDE there is a [gradle plugin](https://github.com/evant/gradle-retrolambda)
that does pretty much the same.

Also, there was another [tool](https://bitbucket.org/tvernum/syntactic/wiki/ConvertingJava8To7)
to convert Java 8 sources, but lambdas are supported only in variable
declaration. Maybe that can be improved somehow to support lambdas properly.

Anyway, I hope you find it useful and I hope that one day Android will get official
support for many Java niceties, like `invokedynamic` or Java 8 features.

Posted on {{ date }} {{ rss }}

{{ disqus }}

