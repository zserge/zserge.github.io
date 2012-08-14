title: zserge's blog
keywords: software, minimalism, linux, embedded, avr, android, golang, KISS

---

This is my blog.

If you like it and want to subscribe - here's [rss](/rss.xml).

## my posts

{%
from datetime import datetime
posts = [p for p in pages if "post" in p] # get all blog post pages
posts.sort(key=lambda p: p.get("date"), reverse=True) # sort post pages by date
for p in posts:
		date = datetime.strptime(p["date"], "%Y-%m-%d").strftime("%B %d, %Y")
		print "  * **[%s](/%s)** - %s" % (p.post, p.url, date) # markdown list item
%}

