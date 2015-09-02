title: simple library publishing with Gradle
description: quick guide to maven central library publishing with gradle
date: 2014-08-10
---
# {{ title }}

So, you switched to Gradle and just finished you new shiny Android library (or
java library). And of course you want to share it with the community.

Here's a quick guide for those who never published their libraries before.

## What is maven central?

In java world libraries are usually stored in a big repository called Maven
Central. You may think of it as of the NPM repository for Node.js or as of
PyPI for Python.

It lets you quickly find a library at
[http://search.maven.org](http://search.maven.org). It is also used by other
tools like [Gradle, Please](http://gradleplease.appspot.com/). Finally, gradle
uses this repo if you included `mavenCentral()` into your repositories section.

## Registration

First, you will have to register. No, don't try to find a 'Register' link on
the Maven Central website. Instead, you should register on the Sonatype
website.

What is Sonatype? They are the guys who created Maven back in 2002. But don't
try to find a registration link on their site either, instead go to their [issue
tracker](https://issues.sonatype.org/secure/Signup!default.jspa).  (well-known
JIRA) and register there:

Next, [create a new
issue](https://issues.sonatype.org/secure/CreateIssue.jspa?issuetype=21&pid=10134).

In the issue details fill in your library description and summary, specify
project URL if any and version control URL (like bitbucket or github link).
Ensure you have a valid group id. It's should be somehow related to your
package and should contain at least one dot in it. So, names like 'johndoe' are
invalid, but 'com.johndoe' are ok if you own the 'johndoe.com' website. If you
don't own any website - you may use your version control hosting name, e.g.
com.bitbucket.johndoe or com.github.johndoe.

Then - relax and wait. It may take up to 2 business days to process your ticket
manually.

After that you will receive a confirmation that your configuration has been
prepared and you can publish your library.

## Gradle setup

There are many possible ways of how to set up your gradle for maven publishing.
I used a file I found in some other repository and I like it's separated from
the main build.gradle.

Here it is:

	/*
	 * Copyright 2013 Chris Banes
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	apply plugin: 'maven'
	apply plugin: 'signing'

	def isReleaseBuild() {
			return VERSION_NAME.contains("SNAPSHOT") == false
	}

	def getReleaseRepositoryUrl() {
			return hasProperty('RELEASE_REPOSITORY_URL') ? RELEASE_REPOSITORY_URL
							: "https://oss.sonatype.org/service/local/staging/deploy/maven2/"
	}

	def getSnapshotRepositoryUrl() {
			return hasProperty('SNAPSHOT_REPOSITORY_URL') ? SNAPSHOT_REPOSITORY_URL
							: "https://oss.sonatype.org/content/repositories/snapshots/"
	}

	def getRepositoryUsername() {
			return hasProperty('NEXUS_USERNAME') ? NEXUS_USERNAME : ""
	}

	def getRepositoryPassword() {
			return hasProperty('NEXUS_PASSWORD') ? NEXUS_PASSWORD : ""
	}

	afterEvaluate { project ->
			uploadArchives {
					repositories {
							mavenDeployer {
									beforeDeployment { MavenDeployment deployment -> signing.signPom(deployment) }

									pom.groupId = GROUP
									pom.artifactId = POM_ARTIFACT_ID
									pom.version = VERSION_NAME

									repository(url: getReleaseRepositoryUrl()) {
											authentication(userName: getRepositoryUsername(), password: getRepositoryPassword())
									}
									snapshotRepository(url: getSnapshotRepositoryUrl()) {
											authentication(userName: getRepositoryUsername(), password: getRepositoryPassword())
									}

									pom.project {
											name POM_NAME
											packaging POM_PACKAGING
											description POM_DESCRIPTION
											url POM_URL

											scm {
													url POM_SCM_URL
													connection POM_SCM_CONNECTION
													developerConnection POM_SCM_DEV_CONNECTION
											}

											licenses {
													license {
															name POM_LICENCE_NAME
															url POM_LICENCE_URL
															distribution POM_LICENCE_DIST
													}
											}

											developers {
													developer {
															id POM_DEVELOPER_ID
															name POM_DEVELOPER_NAME
													}
											}
									}
							}
					}
			}

			signing {
					required { isReleaseBuild() && gradle.taskGraph.hasTask("uploadArchives") }
					sign configurations.archives
			}

			//task androidJavadocs(type: Javadoc) {
					//source = android.sourceSets.main.allJava
			//}

			//task androidJavadocsJar(type: Jar, dependsOn: androidJavadocs) {
					//classifier = 'javadoc'
					//from androidJavadocs.destinationDir
			//}

			task androidSourcesJar(type: Jar) {
					classifier = 'sources'
					from android.sourceSets.main.java.sourceFiles
			}

			artifacts {
					archives androidSourcesJar
			}
	}

You may also download it from [here](https://gist.github.com/zserge/fef8a67d7c58131fbbc6).

Put this file next to your `build.gradle` and create a `gradle.properties` file
in the same directory:

	POM_NAME=Foo
	POM_ARTIFACT_ID=foo
	POM_PACKAGING=aar
	VERSION_NAME=1.0.0
	VERSION_CODE=1
	GROUP=com.bitbucket.johndoe

	POM_DESCRIPTION=Foo library
	POM_URL=https://bitbucket.org/johndoe/foo
	POM_SCM_URL=https://bitbucket.org/johndoe/foo
	POM_SCM_CONNECTION=scm:hg:https://bitbucket.org/johndoe/foo
	POM_SCM_DEV_CONNECTION=scm:hg:https://bitbucket.org/johndoe/foo
	POM_LICENCE_NAME=MIT License
	POM_LICENCE_URL=http://www.opensource.org/licenses/mit-license.php
	POM_LICENCE_DIST=repo
	POM_DEVELOPER_ID=johndoe
	POM_DEVELOPER_NAME=johndoe

	NEXUS_USERNAME=johndoe
	NEXUS_PASSWORD=1234567890

	SNAPSHOT_REPOSITORY_URL=https://oss.sonatype.org/content/repositories/snapshots
	RELEASE_REPOSITORY_URL=https://oss.sonatype.org/service/local/staging/deploy/maven2

	signing.keyId=YYYYYYYY
	signing.password=1234567890
	signing.secretKeyRingFile=/home/johndoe/.gnupg/secring.gpg

This `gradle.properties` should not be added to the version control as it
contains some private information.

Finally, in your build.gradle just add this line somewhere at the end:

	apply from: 'maven-push.gradle'

Now you're almost ready to publish.

## Ensure you have gpg set up

You should sign your package with GPG. If you never used it - first create the
GPG keys:

	$ gpg --gen-key

Next, find your key ID:

	$ gpg --list-keys

There the first line will be like `pub XXXXX/YYYYYYYY <date>`. Remember that
'YYYYYYYY' part, it's you key ID.

Now, publish your keys:

	$ gpg --keyserver hkp://keyserver.ubuntu.com --send-keys YYYYYYYY
	$ gpg --keyserver hkp://pgp.mit.edu --send-keys YYYYYYYY

You may use other key servers as well. You may also want to ensure your keys
were published:

	$ gpg --keyserver hkp://pgp.mit.edu --search-keys johndoe@example.com # Use your email

## Pushing the archives

Now you can do:

	$ gradle uploadArchives

Your library will be built, signed and pushed to the sonatype repo. Please,
ensure that 'signing' stage was not skipped. It is skipped if your library name
is ending with "-SNAPSHOT", but for releases signing is mandatory.

If all went fine - go to the [OSSRH web
UI](https://oss.sonatype.org/#stagingRepositories) and look for your 'staging'
library. It should be somewhere at the end of the list. Select it, and press
'Close' button. Closing a library actually means that you're ready to release
it. Another option is 'dropping' a library, which means removing it from the
list. If closing went fine - you should see a 'Release' button active. Press it
and then get back to JIRA and post a comment there that you promoted you
library.

After that you should get a response from Sonatype that your library will be
available in ~10 minutes and it will be synced with the Maven Central in the
next few hours.

To me that meant that I could use my library in other projects in a few minutes
after I released it (e.g. using in gradle like 'compile groupID:name:version'),
but the search.maven.org found it only next morning.

So, that's it, and if you still have any problems - ask Sonatype support, I
found them to be very helpful. Happy coding!





