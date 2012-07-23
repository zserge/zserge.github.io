title: my minimalistic agile issue tracker
post: my minimalistic agile issue tracker
date: 2012-05-28
---

# {{ page.post }}

I don't know if you share my point of view, but I have to confess: I hate issue
trackers.  I usually work on small projects with small teams, and I find
monsters like Bugzilla or Redmine an overkill.

Another thing is that in my head the word _"issue"_ has a bitter taste. I
prefer the word _"task"_ instead, because it doesn't make much difference to me
when I'm implementing a new long-expected feature or fixing an annoying bug.

Finally, we live in the world of agile development and my issue tracker should
be as flexible as I want it to be.

It's been a long way to realize that the issue track of my dream has always
been right into my browser.

A spreadsheet, really?
----------------------

Right, I picked a Google Docs spreadsheet to track my tasks/issues.

Well, it's free, it's intuitive, it's hosted in the cloud, but can be stored
locally.  It allows multiple users to share their work, and is available on
Android/iOS. To me it's a perfect choice in terms of flexibility and
simplicity.

Now, a few words about the philosophy of my issue tracking.

I like kanban methodology. I think it's great for small agile projects.  So I
tried to make issue tracking look somewhat "kanbanish".

Every issue has a simple lifecycle, and can be in one of the following states:

* open - an issue is created. Nobody has started working on it, so it's kind
  of a backlog;
* started - a developer started his work on this task/issue. In kanban terms, 
  started tasks/issues fit into the In-Progress category;
* untested - it's an optional status to show that issue seems to be fixed, but needs
  some QA;
* closed - the issue is resolved (or task is complete);
* blocked - it's a special status, that shows that work on the issue/task is not
  possible at the moment by any reasons.

To visualize progress I use color marks - every status has it's own visual
style that is applied automatically after the status changes.

Sometimes I need to store extra information about the issue/task, e.g. if I should
discuss it with the team, or mention in the e-mail to the customer. That's why the
issue tracker can have arbitrary number of columns for your own special needs.
The only limitation is that the status column must be called "Status".

I'm not trying to reinvent the wheel. If I need to add comments on the issue
(e.g. why it is blocked, or why it's reopened) I use "Comments" (Alt+F2). They
are easy to add, easy to read, and you can comment every cell separately. Also,
if you want to see only the issue assigned to you - Google Docs "Filters" will
help you.

final form
----------

Here's an example of my issue tracker for a tiny project:

![screenshot](images/issue-tracker.png)

I have five columns: issue ID, a special column for short marks that have
meaning to me only :), a short description, then whom it's assigned to and
issue status. No priorities or deadlines - if they are really important they
can be part of description, marked with bold font style or written in caps.

I like the idea I've shamelessly stolen from [Anthony
Stevens](http://thepursuitofalife.com/minimalist-issue-tracking-for-remote-teams/)
- to strike-though closed issues. I also make font color lighter to distinguish
them from the blocked issues.

I've created a template to create new <del>spreadsheets</del> issue trackers
easily, so feel free to use it if you like it. I have no idea of how to get the
direct link to the spreadsheet template on Google Docs, so just search for
"Minimalist Issue Tracker".

Let your code be bug-free!

Posted on {{ page.date }}

{{ disqus }}

