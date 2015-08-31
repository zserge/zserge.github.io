title: logdog - a colorized Android logcat
description: logdog is a better logcat
date: 2013-05-20

# {{ title }}

Sometimes I do Android development. I never liked using debuggers, neither I
use IDE. So my choice is to write Android apps with Vim+Terminal. With the lack
of debugger I have to use logcat frequently, and using plain adb logcat (even
with grepping output) is far from being pleasant.

Then I found there are nicer alternatives, like
[coloredlogcat](https://code.google.com/p/colored-logcat/) or
[proclogcat](https://github.com/jasta/android-dev-tools/blob/master/proclogcat).
I tried them, but they lacked other output formats, like "time". So I started
writing my own one, which I successfully use in the last few months. It's
written in Python and seems to be the smallest logcat post-processor (it's only
about 100 LOC in a single file).

It supports "brief", "time" and "raw" output formats and allows to filter output
by one or several applications.

Here are some usage samples:

	Show messages from phone app with timestamps:
	$ logdog -v time com.andorid.phone

	Show messages from app1 and app2:
	$ logdog com.example.app1 com.example.app2

	Show messages from all apps in raw format:
	$ logdog -v raw

I also use bash/zsh snippets to autocomplete android process names:

	#
	# .zshrc
	#
	_logdog() {
		local tag="${words[$CURRENT]}"
		compadd $(adb shell ps | tr -d '\r' | awk -v tag=" $tag" '$0 ~ tag { print $9 }')
	}
	compdef _logdog logdog

	#
	# .bashrc
	#
	_logdog() {
		local tag=${COMP_WORDS[COMP_CWORD]}
		procs="$(adb shell pm list packages $tag | sed -e 's/package://')"
		COMPREPLY=($(compgen -W "$procs" -- $tag))
	}
	complete -o default -o nospace -F _logdog logdog

And here's how logdog looks in my terminal:

![logdog](/images/logdog.png)

You can download logdog on the [bitbucket](https://bitbucket.org/zserge/logdog)
page. Open source, MIT-licensed, as usual.



