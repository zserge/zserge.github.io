title: "Anvil ½: as simple as possible but not simpler"
description: More features with less code and fewer methods
keywords: anvil, databinding, android, render, layout, mvvm, incremental dom, anko
---

# {{title}}

Problem: too many methods
Problem: unsync (breaks with XML)
Problem: abusive support views.
Problem: custom components are hard to work with.
Problem: hard to attach view data.

New method: Anvil.render(view)
New optional argument: Anvil.unmount(view, removeViews)
New renderable function: skip()
New renderable function: Anvil.attr(name, value)

Removed virtual nodes, views are as fast.
Removed attribute lambdas, switch/case is faster and takes less methods.
Added pluggable attribute setters:
    public interface AttributeSetter<T> {
        boolean set(View v, String name, T value, T prevValue);
    }
Added default reflection-based property setter.
Added pluggable view factories:
    public interface ViewFactory {
        View fromClass(Context c, Class<? extends View> v);
        View fromXml(ViewGroup parent, int xmlId);
    }
Added get/set functions to attach meta data to views
Removed x() function, only o() is left.
XML replaces, not appends.

[link]: http://example.com

