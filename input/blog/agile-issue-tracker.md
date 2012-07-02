title: my minimalistic agile issue tracker
post: my minimalistic agile issue tracker
date: 2012-05-28
---

# {{ page.post }}

Posted on {{ page.date }}

I don't know if you share my point of view, but I have to confess to a
hatred of issue trackers.  I usually work on small projects with small
teams (2-5 developers), and I don't like monsters like Bugzilla or Redmine
filled with the bureaucracy.

Another thing is that in my head the word _"issue"_ has a bitter taste. I
prefer the word _"task"_, because it doesn't make much difference to me
when I'm implementing a new long-expected feature or fixing an annoying
bug.

Finally, we live in the world of agile development and my issue tracker
should be as flexible as I want it to be.

It's been a long way to realize that the issue track of my dream has
always been right into my browser.

A spreadsheet, really?
----------------------

Right, I picked a Google Docs spreadsheet to track my tasks/issues. Why
not?  It's already working on all platforms, including Android/iOS, it has
offline mode, and Google Drive makes it even more pleasant.

Next, I don't need to set up a server or pay for hosting, and several
users can watch/edit bugs at the same time without any conflicts.

I can choose what characteristics of a bug are important for this project,
and create relevant columns for them.

A few words about the philosophy.

I like kanban methodology. I think it's great for small agile projects.
So I tried to make issue tracking look "kanbanish".

There is a kind of backlog. All open issues that haven't been started yet
are in the backlog.

When developers start working on the issue - it's marked as "started".
When developer claims he fixed it - the issue gets "untested" status.
Finally, after the fix is approved, the issue is marked as "closed".

Of course it's not a law, so some really simple issued can omit the
"untested" status.

There is one extra status - _"blocked"_. Issue can be blocked at any
stage, by any reasons, so this status is somewhat special.

To visualize progress I use color marks - every status has it's own visual
style that is applied automatically.

I'm not trying to reinvent the wheel. If I need to add comments on the
issue (e.g. why it is blocked, or why it's reopened) I use "Comments"
(Alt+F2).  They are easy to add, easy to read, and you can comment every
cell separately.

Also, if you want to see only the issue assigned to you - Google Docs
"Filters" will help you.

final form
----------

Here's an example of my issue tracker for a tiny project.

I have three columns: issue ID, short description, whom it's assigned to
and issue status.  No priorities or deadlines - if they are really
important they can be part of description, marked with bold font style or
written in caps.

I like the idea I've stolen from .... - to strike-though closed issues. I
also make font color lighter to distinguish them from the blocked issues.

I've created a template to create new <del>spreadsheets</del> issue
trackers easily, so feel free to use it if you like it

Let your code be bug-free!

