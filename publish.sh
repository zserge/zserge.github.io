#!/bin/sh
rm -v pub/blog/*
rm -v pub/images/*
rm -v pub/*.html pub/*.css pub/*.xml
cp -rv output/* pub

cd pub
git add -A
git status
git commit -m "$1" && git push
