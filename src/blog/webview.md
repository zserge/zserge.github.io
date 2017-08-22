title: Cross-platform web UI for C and Go
description: Tiny single-header webview wrapper for Gtk/WinAPI/Cocoa with Golang bindings
keywords: webkit, mshtml, gtk, cocoa, winapi, gui, golang
# This is used in the text, I can't inline it because it conflicts with common template delimiters
markdownhack: "{{ .Name }}"
date: 2017-08-20
---

# {{ title }}

Cross-platform GUI has always been a painful part of software development.

Today the biggest horror for an old-school C developer is to look at the [list
of Electron apps][electron-apps] on their website. Simple, often trivial
utilities, each taking over a hundred of megabytes of disk space and consuming
hundreds of RAM once launched.

I'm not going to start a rant here, people of HackerNews have said enough on
this topic. Electron wins because it is easy to use and everyone knows how to
write HTML/CSS (unlike, say, QML or XAML).

Still, there must be a better way. Even though RAM and disk space are cheap, it
just doesn't feel right.

I obviously won't be the one to fix it with a silver bullet, but at least I
can try. My today's Sunday morning exercise was to make the smallest possible
wrapper for various WebView implementations on Linux, MacOS and Windows and
turn it into a cross-platform native GUI library that uses HTML/CSS for
rendering.

## Webviews

Let's start with macOS. It comes bundled with a nice WebKit library, and that
WebView can be easily integrated into a Cocoa app. No troubles here. Linux is a
bit on a darker side. From what I'm aware of, modern Debian-based distributions
don't come with WebKit library preinstalled. However, due to the simplicity of
package management and the smartness of an average Linux user, it should not be
a problem to install gtk-webkit manually.

Windows, in contrast, is a total disaster. There is MSHTML and there is
EdgeHTML. The first one is our dearest Internet Explorer, and the latter
doesn't have any APIs to embed it from the C code.

After spending some time trying to learn about UWP and EdgeHTML, I ended up
embedding MSHTML via OLE, like in the old days. Surprisingly, it gives rather
satisfactory results.

On Windows 8 user will end up with IE10, which is still broken, but at least
supports most of the CSS3/HTML5. On Windows 10 it will be IE11, which is even
better. But poor Windows 7 users will be enjoying IE7 in all its glory and
there is not much we can do about it. And I don't want to even start talking
about Windows XP...

## API

Of course it would be nice to have an advanced API with a flexible event loop and
functions to control every aspect of a web view and the hosting window, but
that's beyond the time limits of a Sunday morning.

The library is available at https://github.com/zserge/webview

So I simplified the API down to one function call:

```
int webview(const char *title, const char *url,
	int width, int height, int resizable);
```

It is supposed to open a window with the given title, width and height
(optinally - resizable) and render a full size web page with the given URL.

There is no way to provide actual HTML contents, but on Mac and Linux you can
pass `data:text/html,<html>....</html>` instead of a URL.

## Usage

The whole library is just a single header file of ~700 LOC and is available on
[github][github]. It's written in C99, so it should play nicely with other
languages if you want to make bindings. I expect it to be used only for web UI
rendering. I don't force you to use any specific JS frameworks or communication
methods with the main application core.

I would probably use a WebSocket for communication with the "backend" part of
the app. If you can afford sharing you code under a GPL license - you can use
[Mongoose][mongoose] web framework, it supports WebSockets.

But in 2017 I would also consider using Go.

## From C to Go

Of course, there is little fun in writing web apps in C. So I made a tiny cgo
wrapper that allows opening a webview from Go.

A self-contained native app with webUI can look like this. It shows a greeting
with the current user name and exits if you click the button. You can check the
[screenshots][screenshots] on the project github page.

```
package main

import (
	"html/template"
	"log"
	"net"
	"net/http"
	"os"
	"os/user"

	"github.com/zserge/webview"
)

var tmpl = template.Must(template.New("").Parse(`
<html>
	<head>
		<style>
		* { margin: 0; padding: 0; box-sizing: border-box; font-family: Helvetica, Arial, sans-serif; }
		body { color: #ffffff; background-color: #03a9f4; text-decoration: uppercase; font-size: 24px; }
		h1 { text-align: center; font-weight: normal}
		form { margin-left: auto; margin-right: auto; margin-top: 50px; width: 300px; }
		input[type="submit"] {
				border: 0 none;
				cursor: pointer;
				margin-top: 1em;
				background-color: #ffffff;
				color: #03a9f4;
				width: 100%;
				height: 2em;
				font-size: 24px;
				text-transform: uppercase;
		}
		</style>
	</head>
	<body>
	  <form action="/exit">
			<h1>Hello, {{ markdownhack }}!</h1>
			<input type="submit" value="Exit" />
		</form>
	</body>
</html>
`))

func main() {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	go func() {
		http.HandleFunc("/exit", func(w http.ResponseWriter, r *http.Request) {
			os.Exit(0)
		})
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			u, _ := user.Current()
			tmpl.Execute(w, u)
		})
		log.Fatal(http.Serve(ln, nil))
	}()

	webview.Open("Hello", "http://"+ln.Addr().String(), 400, 300, false)
}
```

The good thing is that unlike many Electron apps, this demo consumes only ~6MB
of RAM and the binary size is about 7MB unstripped (I've only measured it on
Linux).

Of course, it's a very early proof-of-concept and I haven't used it in any
serious apps yet. But the whole idea of running a native web UI on top of a
memory safe modern language is very appealing to me. So if you share my views,
or found a bug, or have a suggestion to make - feel free to contribute!

[electron-apps]: https://electron.atom.io/apps/
[github]: https://github.com/zserge/webview
[mongoose]: https://github.com/cesanta/mongoose
[screenshots]: https://github.com/zserge/webview
