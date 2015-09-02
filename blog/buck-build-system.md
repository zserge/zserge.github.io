title: Buck - life is too short to spend a minute for each build
description: Buck is a build system made by Facebook. It fits so perfectly for my needs that I've made a project skeleton generator for it.
keywords: buck, build system, android build, slow gradle, speed up gradle, ant build, buck facebook, bazel
date: 2015-05-27
---
# {{ title }}

Gradle is too slow, Ant is too basic. Buck is fast and super-configurable and
I'd like to tell you how I use it for Android development.

I own a pretty old thinkpad laptop so I don't expect the builds to be too fast.
Ant used to spend 10..40 seconds for each build on my laptop depending on how
large the project is. Gradle takes about a minute in average and that's too
long for me - I just lose focus when I just sit and wait for the build results.

I had great expectations about [Bazel][1], but it doesn't have Android support
yet. And then I've heard about [Buck][2]. I tried it and it was so great that
I could not believe it.

## how fast is this buck?

Let me show you some numbers for each of the build systems. It's not a real
benchmark made in the vacuum, it's just a picture of my average workflow with
my normal apps running in the background. I created a minimal empty project
with a single activity, some XML resources and a few lines of code. Here's the
commands I used to generate project structure:

Ant:

	android create project -p ant-example -k com.example.buildsystem -n BuildSystemTest -a MainActivity -t android-21

Gradle:

	android create project -p gradle-example -k com.example.buildsystem -n BuildSystemTest -a MainActivity -t android-21 -g -v 1.1

Buck (using my own wrapper, see about it below):

	buckbonejava com.example.buildsystem buck-example

Then I tried a clean build, an incremental build and a no-op build. For all
builds I used 'ant debug', 'gradle assembleDebug' and 'buck build app'
commands, I measured time with 'time' command (instead of using the numbers
printed by each build system, those numbers are a bit lower).

* Clean build (clean everything, and build from scratch)
	- Ant: 11 seconds
	- Gradle: 19 seconds (with parallel, configureondemand and daemon)
	- Buck: 4 seconds
* Incremental build (making one change in one file and re-building the app)
	- Ant: 11 seconds
	- Gradle: 12..30 seconds (varying)
	- Buck: 0.8 sec
* Empty build (no changes, just re-build)
	- Ant: 4 seconds
	- Gradle: 8 seconds
	- Buck: 0.1 sec

Now, let's try a larger project. I simply added some fake methods in five more
source files, 3000 LOC in total. Looks like a common number for a single-person
project. Incremental build times are (for the addition of 3000 LOC):

* Ant: 21 seconds
* Gradle: 30 seconds
* Buck: 3 seconds

So Buck is ~10 times faster than other build systems for my normal workflow.
And I actually never seen it to take more than 5 seconds for my (relatively
simple) projects.

## how can it be true?

Technical details of Buck are described [here][3]. It optimizes everything - it
keeps jvm running in the nailgun server, it uses threads, it caches a lot,
it uses an optimized 'dx' utility etc etc. They even seem to have a separate
app that updates your code in the 'live' mode, so you don't have to pack the
APK and install it (in fact, now 'adb install' is one of the longest build
steps I have now!).

## where's the catch?

Buck has outdated documentation. You have to spend time reading the issue
trackers and looking for the ansers.

Buck seems to have a small community. Not so many Stackoverflow answers, not so
many articles, not so many tutorials.

Buck 'quickstart' command is far from what you expect from the app
skeleton generator.

In Buck you have to write most of the build scripts manually. It gives you
power, but it takes away the convenience. E.g. for your dependencies you have
to download them, put into some folder, create rules that point to the JARs,
include those rules as a dependency.

Ah, Buck seems to have no support for Windows, but well, I don't care about
Windows.

So Buck can be a problem for newcomers, but if you learn it - you get a very
fast build system you can totally control. No magic behing the scenes.

## finally, what's that buckbonejava command?

Since I often play with app ideas - I want to start a new app quickly, write
some code and see the results as quickly as possible. Buck fits perfectly here.

So I spent some time to make a tiny Bash script that generates the Buck android
project. Just give it a package name and tell where to put the generated
sources.

Buckbone is available at [https://github.com/zserge/buckbone](https://github.com/zserge/buckbone)

In your project the sources will be at `java/my/package/name/`, and resources
will be at `res/my/package/name/res/values/strings.xml` etc. Just go edit those
and run 'buck install app' or 'buck build app'.

As a nice bonus I've added the `maven` macro so you can include the dependencies like:

	maven('com.squareup:otto:1.3.7') # that's how you define your maven library
	maven('com.squareup.okhttp:okhttp:2.4.0') # that's how you define your maven library

	android_library(
		...
		deps = [
			':otto',   # this matches the library name 
			':okhttp',
		]
	)

AARs and JARs are supported. You can run 'buck fetch app' to download those
dependencies. Or it will download them on the next 'buck build' cycle. Similar
to Gradle, huh?

Next, I like [Kotlin language][4] [a lot][5] and I want it to become my primary
language for Android development. So far I only used Kotlin with Gradle and it
was painful. The language speeds up my code writing, but each build took over
one minute. I tried Kotlin with Buck and got my build times reduced to 15
seconds, which is the best I could have expected from Java+Ant in the past.
Kotlin generator is still experimental, but you may try it using
`buckbonekotlin` instead of `buckbonejava` to start your Kotlin android
projects right now.

I also tried to manually run nailgun for the Kotlin compiler and got the app
built in about 5 seconds, I could not even dream about such a small number. But
this approach uses too many hardcoded paths that I can't recommend it yet for
normal usage and I can't make a generic wrapper.

## extending Buck

At the moment Buck is very hard to extend and it's not documented. So no Buck
plugins yet (and that's why it seems so hard for me to add Kotlin support).

Also I'm not sure how the top-level Buck configuration can be accessed from
within the Buck script, but if that's possible - it could simplify things a lot.
E.g. compiler paths could be defined in the top-level config, and other build
scripts would reuse those.

I'm still very new to Buck, but if you have any suggestions how to create a
Buck project that would use Kotlin or any other compiler (Scala, Groovy,
Clojure) with nailgun and Buck - please share your thoughts. Also if you have
an idea to improve my buckbone scripts - send me pull requests.


[1]: http://bazel.io
[2]: http://buckbuild.com
[3]: http://buckbuild.com/concept/what_makes_buck_so_fast.html
[4]: http://kotlinlang.org
[5]: http://zserge.com/blog/anvil-kotlin.html


