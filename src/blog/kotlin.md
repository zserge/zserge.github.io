title: kotlin - a new hope
description: A new language for Android coding
date: 2013-11-28

# <% title %>

I've been looking for Java alternatives since my first days of Android
development. I can't say I don't like Java. It's a nice language, very easy to
learn and pretty logical.  But the lack of proper functional style
constructions often inspires me to check what's new in the field of JVM
languages.

So far I've tried (tried, I never learnt these languages properly):

* Mirah - a very nice Ruby-translated-to-Java language. Zero overhead, allows a
	lot of syntax sugar, but it failed to make a static class attribute when I
	tried it. I'm sure now it's better, I just don't like Ruby.
* Clojure - a Lisp. I had very big expectations about clojure, but it turned
	out to be slow, huge and had no libraries for Android.
* Kawa - another Lisp. Scheme for JVM. Was nice, but seems like one had to make
	lisp-ish bindings for every part of Android before it becomes useful.
* Scala - a better Java. Good. Popular. Slow. Big. I could bear the fact my
	binaries become larger, but the compilation time was unacceptable for me. I
	was looking for a language to make me more productive, but instead I had to
	wait for another minute waiting for my HelloWorld to compile.

This week I discovered Kotlin, a language made by JetBrains (guys making
IntelliJ IDEA).  The history of Kotlin starts in 2010, but Android support was
added in 2012. The ideas behind this language are to make it safer than Java
and faster/easier than Scala.

As a demo app I was going to make a theremin-like app that played different
notes when phone was tilted.

## Kotlin - The Phantom Menace

I've heard Kotlin has nice support of the IDE, but as a convinced vim user I decided to try it in console/vim environment.

So, on the official [website](http://kotlin.jetbrains.org/) I found no binaries.
Instead, I found a link to Github release with source archives. That was not
looking promising, as I have no installed Maven, Gradle or whatever is used these
days to make Java world more complicated. Luckily, Kotlin build system was plain old Ant.

Dealing with dependencies and compiling the compiler took a while, and in the
`$SRC/dist/kotlinc` directory I found compiler binaries and runtime. Also, in the
`$SRC/dist/kotlinc/tools` directory there was a j2k app (I thought it's a
translator from Java to Kotlin), but it failed to run.

## Kotlin - Empire Strikes Back

So, let's get back to Google stuff and make kotlin compiler work with Android
build.xml. Customizations of build process are possible with `custom_rules.xml`.
Again, good design of kotlin provides us with `kotlinc` Ant task, so we need
to include that task into the `custom_rules.xml`. 

So, starting with `android create project` as usual, I added the following
custom rules:

	<?xml version="1.0" encoding="UTF-8"?>
	<project name="scala-android">
		<property environment="env"/>
		<taskdef resource    = "org/jetbrains/jet/buildtools/ant/antlib.xml">
			<classpath>
				<fileset dir = "${env.KOTLIN_HOME}/lib" includes = "*.jar"/>
			</classpath>
		</taskdef>
		<target name="-post-compile">
			<path id="project.javac.classpath">
				<path refid="project.all.jars.path" />
				<path refid="tested.project.classpath" />
				<path path="${java.compiler.classpath}" />
				<path path="${project.target.android.jar}"/>
				<path path="${out.classes.absolute.dir}" />
			</path>
			<kotlinc src="src" output="bin/classes" 
				classpathref="project.javac.classpath" />
		</target>
	</project>

I'm not good at Ant, but that works if `KOTLIN_HOME` environment variable is
set correctly (it should point to the `kotlinc` folder). We use post-install
hook, because R.java should be generated and compiled before compiling kotlin
files.

Then, copy Kotlin runtime from `$KOTLIN_HOME/libs` to your project `libs` directory.
Runtime is small, so I hoped apk size won't get large, too.

Now, create an empty source file `src/<...package...>/Main.kt`.

## Kotlin - Return of the Jedi

So, let's write some Kotlin. Minimal activity example looks much like Java:

	package kotlin.theremin

	import android.os.Bundle
	import android.app.Activity

	class Main(): Activity() {
		protected override fun onCreate(savedInstanceState : Bundle?) {
			super<Activity>.onCreate(savedInstanceState)
			setContentView(R.layout.main)
		}
	}

Semicolons are not needed anymore, methods are functions inside classes,
inheritance looks a bit different as well as super calls.

Interesting part here is `savedInstanceState : Bundle?`. Question mark means a
null-safe type.  Also, parameter name is not recommended to be changed, since
Kotlin may use named arguments in calls. That's very annoying if careless
Android SDK developers defined arguments as "p0", "p1" and so on. Good news
it's only a warning, so I decided to ignore it when default parameter name is
meaningless.

Build, install, run - all should work. Build process doesn't feel slow, but
compiler output (warnings, errors) is a bit hard to read, since at the end of
the build logs there is a long stack trace if your code has errors, so I had to
scroll up to see actual error messages.

## Kotlin - Attack of the Clones

So, I could write some code in Kotlin. The strongest feeling was that Kotlin is
a copy of Scala. I can't say it's bad. I think I would have spent more time to
study Scala if it was not that slow, and if I saw real profit of how Scala can
help me in Android development. Here's the code of theremin app in kotlin:

	package kotlin.theremin

	import android.content.pm.ActivityInfo
	import android.util.Log
	import android.hardware.SensorEventListener
	import android.hardware.SensorEvent
	import android.hardware.SensorManager
	import android.content.Context
	import android.app.Activity
	import android.os.Bundle
	import android.media.AudioFormat
	import android.media.AudioManager
	import android.media.AudioTrack
	import android.hardware.Sensor
	import android.hardware.SensorEvent

	class Main(): Activity() {

		val tag = "Theremin:Main"

		val audioThread = AudioThread()
		var sensorManager : SensorManager? = null
		var sensor : Sensor? = null

		val sensorListener = object : SensorEventListener {
			override fun onSensorChanged(e : SensorEvent?) {
				val values = e?.values
				if (values != null) {
					val range = sensor!!.getMaximumRange()
					var x = values[1]
					if (x < -90 || x > 90) {
						return
					}
					x = (x + 90) / 180
					audioThread.setPitch(x)
					Log.d(tag, "x = ${x}")
				}
			}
			override fun onAccuracyChanged(sensor : Sensor?, accuracy: Int) {}
		}

		protected override fun onCreate(savedInstanceState : Bundle?) {
			super<Activity>.onCreate(savedInstanceState)
			setContentView(R.layout.main)

			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)

			sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager?

			sensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ORIENTATION)
			sensorManager?.registerListener(sensorListener, sensor,
				SensorManager.SENSOR_DELAY_FASTEST)

			audioThread.start()
		}

		protected override fun onDestroy() {
			super<Activity>.onDestroy()
			audioThread.interrupt()
			sensorManager?.unregisterListener(sensorListener)
		}
	}

	class AudioThread(): Thread() {

		val sampleRate = 44100

		var pitch : Int = 440

		public override fun run() {
			setPriority(Thread.MAX_PRIORITY)
			val buffsize = AudioTrack.getMinBufferSize(sampleRate, 
					AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)/32
			val audioTrack = AudioTrack(AudioManager.STREAM_MUSIC,
													sampleRate, AudioFormat.CHANNEL_OUT_MONO,
													AudioFormat.ENCODING_PCM_16BIT, buffsize,
													AudioTrack.MODE_STREAM)
			val samples = ShortArray(buffsize)
			val amp = 10000
			val twopi = 8*Math.atan(1.toDouble())
			var ph = 0.0

			audioTrack.play()
			while (!Thread.interrupted()) {
				var frequency = pitch
				for (i in 0..buffsize-1) {
					samples[i] = (amp*Math.sin(ph)).toShort()
					ph += twopi*frequency/sampleRate
				}
				audioTrack.write(samples, 0, buffsize)
			}
			audioTrack.stop()
			audioTrack.release()
		}

		public fun setPitch(p : Float) {
			val note = Math.round(p * 8).toInt()
			val scale = array(0, 2, 4, 5, 7, 9, 11, 12)
			pitch = (Math.pow(2.0, scale[note].toDouble()/12) * 440).toInt()
		}
	}

It was all in one source file, Main.kt. It plays major scale notes as you tilt
the phone.  Sine generator code was stolen somewhere from the web, so it's not
an example of how one should write it. But I hope it's enough to get
first impression of how Kotlin looks like.

Good news: overhead is only 200KB, Kotlin runtime is very small.

## Kotlin - may the force be with you

Impressions. Very nice language. Logical, consistent, fast, small. Pretty stable.
I think I will spend some time learning it.

What I didn't like: null-safety is rather painful, than safe. Most android
objects coming from the outside are marked as null-safe, so I had to write "?"
everywhere or check for null. However, the risk of getting null in those cases
is almost zero, so I would prefer not to care about it. But language prevents
such flippancy.

Converting types in math is also verbose, and often doesn't work automatically
(well, not in the way I assumed it to work). I had to split expression into
smaller ones to make them compile.

Arrays are different. There is `IntArray` (like Java array) with no proper
documentation on how to work with it, there is `Array<Int>`, which is Kotlin
array, and they are different.

I haven't found a way how to declare a volatile variable.

However, theoretical possibility to make domain-specific functions and extreme
flexibility of the language is really amazing.

So, don't be afraid to try Kotlin, the more developers know about it, the
larger is the community - the better is the language and tools. Hope you will
like it.

P.S. I will upload project sources and apk on bitbucket soon.

Posted on <% date %> <% rss %>

<% disqus %>

