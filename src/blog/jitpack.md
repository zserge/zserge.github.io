title: painless publishing of android libraries
description: from mavenCentral to jcenter to jitpack.io
date: 2015-12-11
---

# {{ title }}

Libraries are only good when it's easy to share them. Android has done this
wrong for a very long time.

Node.js has npm and a new library can be published in a couple of minutes,
usage is as simple as adding library name to package.json.

Go has no package manager at all and publishing a library is as simple as "git
push" and using is as simple as "import github.com/user/library".

Android... Before Gradle it was a real disaster. Gradle finally made it
possible to add libraries with just one line of code. But publishing your new
library was still a problem.

## maven central

Obviously, in Java world libraries are managed with Maven. When I published my
first android library I've chosen Maven Central and
[described the steps I've taken](/blog/gradle-maven-publish.html).

It was a cumbersome process which required writing some code, creating an account on their website and waiting for a few days to make my registration complete.

That's why when I heard about jCenter I decided to migrate.

## jcenter

Actually, I decided to migrate when I've read that [Android Studio migrates to
jcenter](http://www.technotalkative.com/android-studio-migration-maven-central-jcenter/).

So I've made a Bintray account, added some gradle plugins to my libraries,
wrote another few lines of gradle configuration and published my library. The
process is well documented but
[look at the amount of code to be written](https://github.com/danielemaddaluno/gradle-jcenter-publish)!

And as a result you still have to link your library with jCenter and wait until
they confirm your request.

## jitpack

Finally, I've heard about JitPack.io.

Finally, no registration needed. You only need to have a repository on github
or bitbucket.

Finally, no need to wait for any kind of confirmation before you can publish
your new library.

Finally, publishing is as simple as `git push` and using is as simple as writing
your library name in `build.gradle`.

## step-by-step

First, create a new project on github. Assuming it's an android library it can follow the structure of this repo: https://github.com/jitpack/android-example/

Basically, all you need to change is to add android maven plugin to your
`library/build.gradle`:

```
buildscript {
	dependencies {
		...
		classpath 'com.github.dcendents:android-maven-gradle-plugin:1.3'
	}
}

apply plugin: 'com.android.library'
apply plugin: 'com.github.dcendents.android-maven'
```

You might also want to add this to generate javadocs and sources JAR:

```
task sourcesJar(type: Jar) {
    from android.sourceSets.main.java.srcDirs
    classifier = 'sources'
}

task javadoc(type: Javadoc) {
    failOnError  false
    source = android.sourceSets.main.java.sourceFiles
    classpath += project.files(android.getBootClasspath().join(File.pathSeparator))
}

task javadocJar(type: Jar, dependsOn: javadoc) {
    classifier = 'javadoc'
    from javadoc.destinationDir
}

artifacts {
    archives sourcesJar
    archives javadocJar
}
```

Next, assign a release tag and push your code:

```
git tag 1.0
git push
git push --tags
```

Publishing is done. You may now use your library in other projects:

```
repositories {
	maven { url = 'https://jitpack.io' }
}
dependencies {
	// for https://github.com/user/library with tag 1.0:
	compile 'com.github.user:library:1.0'
}
```

And yes, that is it.

If you don't have an assigned tag yet - you may use
`com.github.user:library:-SNAPSHOT` and will always get the "tip" of the master
branch.

## links

Official documentation for JitPack publishing of Android libraries:
here: https://jitpack.io/docs/ANDROID/

Official example of an Android library: https://github.com/jitpack/android-example/

Issue tracker: https://github.com/jitpack/jitpack.io/issues
