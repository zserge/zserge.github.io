for f in *.md blog/*.md ; do
	sed '0,/^$/s//---/' < $f > /tmp/x
	mv /tmp/x $f
done
