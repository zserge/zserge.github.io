IDIR=src
ODIR=pub
BASEURL="http://zserge.com"
DEFAULT_LAYOUT="layouts/default.html"

rss() {
	echo "<span class='rss' style='float: right;'>[[rss](/rss.xml)]</span>"
}

disqus() {
	cat << EOF
<div id="disqus_thread"></div><script type="text/javascript">
var disqus\_shortname='zserge';
	(function() {
		var dsq = document.createElement('script');
		dsq.type = 'text/javascript';
		dsq.async = true;
		dsq.src = 'http://' + disqus\_shortname + '.disqus.com/embed.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
		})();
	</script>
<noscript>
</noscript>
EOF
}

social() {
	cat << EOF
<script type="text/javascript">(function() {
if (window.pluso)if (typeof window.pluso.start == "function") return;
	if (window.ifpluso==undefined) { window.ifpluso = 1;
		var d = document, s = d.createElement('script'), g = 'getElementsByTagName';
		s.type = 'text/javascript'; s.charset='UTF-8'; s.async = true;
		s.src = ('https:' == window.location.protocol ? 'https' : 'http')  + '://share.pluso.ru/pluso-like.js';
		var h=d[g]('body')[0];
		h.appendChild(s);
	}})();</script>
<div class="pluso" data-background="transparent" data-options="medium,round,line,horizontal,nocounter,theme=02" data-services="facebook,twitter,google"></div>
EOF
}

blogposts() {
	echo "$BLOGS" | sort -r -n | while read line ; do
		[ -z "$line" ] && continue
		timestamp=$(echo $line | cut -d' ' -f1)
		url=$(echo $line | cut -d' ' -f2)
		text=$(echo $line | cut -d' ' -f3-)
		name=$(echo $text | sed 's/||||.*$//')
		desc=$(echo $text | sed 's/^.*||||//')
		echo "* **[$name](/$url)** - $(date "+%B %d, %Y" --date @$timestamp)"
	done
}

gen_rss() {
	TITLE="zserge's blog"
	xml=$(cat << EOF
<?xml version="1.0"?>
<rss version="2.0">
<channel>
<title>$TITLE</title>
<link>$BASEURL/blog.html</link>
<description>My thoughts on software, simplicity and how to make it work together</description>
<language>en-us</language>
<pubDate>$(date -R)</pubDate>
<lastBuildDate>$(date -R)</lastBuildDate>
EOF
	echo "$BLOGS" | sort -r -n | while read line ; do
		[ -z "$line" ] && continue
		timestamp=$(echo $line | cut -d' ' -f1)
		url=$(echo $line | cut -d' ' -f2)
		text=$(echo $line | cut -d' ' -f3-)
		name=$(echo $text | sed 's/||||.*$//')
		desc=$(echo $text | sed 's/^.*||||//')
		printf "<item><title>%s</title><link>%s</link><description>%s</description><pubDate>%s</pubDate><guid>%s</guid></item>\n" \
			"$name" "$BASEURL/$url" "$desc" "$(date --date @$timestamp -R)" "$BASEURL/$url"
	done
cat << EOF
</channel>
</rss>
EOF
)
	echo "$xml" > $ODIR/rss.xml
}

ongen() {
	if [ -n "$page_date" ] ; then
		url=$(echo $1 | sed 's/\.md$/\.html/')
		timestamp=$(date --date "$page_date" +%s)
		printf -v BLOGS "$BLOGS"'\n'"$timestamp $url $page_title |||| $page_description"
	fi
}

onexit() {
	echo "Done."
	gen_markdown "blog.md" "$ODIR/blog.html"

	gen_rss
}

