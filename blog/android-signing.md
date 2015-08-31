title: How to sign release apk with gradle
description: Signing apks without boilerplate code
keywords: android, signing, gradle, release, keystore
date: 2015-08-09

# {{title}}

Whenever I prepare my APK for the release - I used to do the following steps:

1. Copy keystore to the project directory
2. Copy gradle.properties into the project directory with keystore name, alias
	 and password defined
3. Copy some code from [some blog][1] that would load the properties and set up
	 the signing
4. Finally, do `gradle build`

But why not to move the boilderplate out of build.gradle?

## Helper signing script

I wrote a tiny helper script that can be included into the projects:

	def signingProperties = "signing.properties"
	def signingKeys = [
		storeFile     : {x -> file(x)},
		storePassword : {x -> x},
		keyAlias      : {x -> x},
		keyPassword   : {x -> x},
	]

	// Find signing.properties in the project root, or in $HOME/.gradle
	def f = ["${rootDir}/${signingProperties}", "${gradle.gradleUserHomeDir}/${signingProperties}"].find { file(it).exists() }

	if (f) {
		logger.info "Loading signing properties from ${f}"
		def props = new Properties()
		props.load(new FileInputStream(f))

		// For each property apply it to the release signing config
		signingKeys.any { k, fn ->
			if (!props.containsKey(k)) {
				logger.error "Missing property ${k}"
				android.buildTypes.release.signingConfig = null
				return true
			}
			android.signingConfigs.release[k] = fn(props[k]);
			return
		}
	} else {
		logger.info "Missing ${signingProperties} file"
		android.buildTypes.release.signingConfig = null
	}

It scans for the signing.propeties file in the project directory and in the
gradle home directory, then it parses the properties and configures the build.

## usage

Now I do the following.

Create signing.properties in my $HOME/.gradle (once for all projects):

	storeFile=my.keystore
	keyAlias=myalias
	storePassword=mypassword
	keyPassword=mypassword2

Put my.keystore into $HOME/.gradle (once for all projects).

Edit build.gradle to use release singing config (most likely it is already done
did it the app has been signed in the past):

	android {
		signingConfigs {
			release
		}
		buildTypes {
			release {
				signingConfig signingConfigs.release
			}
		}
	}

Finally, I include the script above. I simply use the github link:

	apply from: 'https://raw.github.com/trikita/gradle-android-signing/master/gradle-android-signing.gradle'

Done. One 'apply from' line and signing just works.

You may try it, too. Sources are available on [github][2], so please file an
issue or a pull request if something it not working.

Posted on {{ date }} {{ rss }}

{{ social }}
{{ disqus }}

[1]: https://www.timroes.de/2013/09/22/handling-signing-configs-with-gradle/
<!--http://tools.android.com/tech-docs/new-build-system/user-guide#TOC-Signing-Configurations-->
[2]: https://github.com/trikita/gradle-android-signing
