#!/bin/sh

STASH=~/src/serge/stash/sta.sh

if [ ! -d gh-pages ] ; then
	git clone https://github.com/zserge/zserge.github.com gh-pages
	cd gh-pages
	git checkout master
fi

if [ "$1" = "pub" ] ; then
	cd gh-pages
	git rm -rf .
	cp -r ../pub/* .
	git add -A
	git status
	git commit -m "site update $(date)" && git push
elif [ "$1" = "run" ] ; then
	cd pub
	python3 -m http.server
else
	$STASH
fi

