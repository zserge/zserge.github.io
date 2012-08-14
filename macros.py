# -----------------------------------------------------------------------------
# generate sitemap.xml
# -----------------------------------------------------------------------------

from datetime import datetime
import os.path
import email.utils
import os.path
import time

_SITEMAP = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
%s
</urlset>
"""

_SITEMAP_URL = """
<url>
		<loc>%s/%s</loc>
		<lastmod>%s</lastmod>
		<changefreq>%s</changefreq>
		<priority>%s</priority>
</url>
"""

def hook_preconvert_sitemap():
	"""Generate Google sitemap.xml file."""
	date = datetime.strftime(datetime.now(), "%Y-%m-%d")
	urls = []
	for p in pages:
		urls.append(_SITEMAP_URL % (options.base_url.rstrip('/'), p.url, date,
			p.get("changefreq", "monthly"), p.get("priority", "0.8")))
		fname = os.path.join(options.project, "output", "sitemap.xml")
	fp = open(fname, 'w')
	fp.write(_SITEMAP % "".join(urls))
	fp.close()

# -----------------------------------------------------------------------------
# generate rss feed
# -----------------------------------------------------------------------------


_RSS = """<?xml version="1.0"?>
<rss version="2.0">
<channel>
<title>%s</title>
<link>%s</link>
<description>%s</description>
<language>en-us</language>
<pubDate>%s</pubDate>
<lastBuildDate>%s</lastBuildDate>
<docs>http://blogs.law.harvard.edu/tech/rss</docs>
<generator>Poole</generator>
%s
</channel>
</rss>
"""

_RSS_ITEM = """
<item>
		<title>%s</title>
		<link>%s</link>
		<description>%s</description>
		<pubDate>%s</pubDate>
		<guid>%s</guid>
</item>
"""

def hook_postconvert_rss():
	items = []
	posts = [p for p in pages if "post" in p] # get all blog post pages
	posts.sort(key=lambda p: p.date, reverse=True)
	for p in posts:
		title = p.post
		link = "%s/%s" % (options.base_url.rstrip("/"), p.url)
		desc = p.get("description", "")
		date = time.mktime(time.strptime("%s 12" % p.date, "%Y-%m-%d %H"))
		date = email.utils.formatdate(date)
		items.append(_RSS_ITEM % (title, link, desc, date, link))

	items = "".join(items)

	# --- CHANGE THIS --- #
	title = "zserge's blog"
	link = "%s/blog.html" % options.base_url.rstrip("/")
	desc = "My thoughts on software, simplicity and how to make it work together"
	date = email.utils.formatdate()

	rss = _RSS % (title, link, desc, date, date, items)

	fp = open(os.path.join(output, "rss.xml"), 'w')
	fp.write(rss)
	fp.close()

#
# lesscss
#
import lesscss.lessc

def lesscss_to_css(src, dst):
	less = open(src).read()
	css = lesscss.lessc.compile(less)
	open(dst, 'w').write(css)

converter = {r'\.less': {lesscss_to_css, 'css'}}

rss = "<span class='rss' style='float: right;'>[[rss](/rss.xml)]</span>"

disqus = """
<div id="disqus_thread"></div><script type="text/javascript">
var disqus_shortname='zserge';
	(function() {
		var dsq = document.createElement('script');
		dsq.type = 'text/javascript';
		dsq.async = true;
		dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
		})();
	</script>
<noscript>
</noscript>
"""
