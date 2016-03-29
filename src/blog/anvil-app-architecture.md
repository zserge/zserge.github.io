title: How to architect Anvil apps
description: Anvil simplifies your UI code, but what about your controllers and models?
keywords: android, redux, anvil, reactjs
date: 2016-03-29
---
# {{title}}

If you only have a few UI elements, a small data class and your controllers
have only a few actions to perform - you may consider using no architecture at
all.

Just make a global "controller" object and/or a global data object. By "global"
I mean you may use dependency injection, or propagate the instance from the
root activity to its child views, or make it a singleton.

Simply bind data to your views and call controller methods from your event
listeners. Here's an example of a counter app where Counter object is
propagated from the Activity to its child views:

```java
public class Counter {
  // If your model is more than one variable - you might want to move it to a
  // separate class
  private int count = 0;
  public void incr() { this.count++; }
  public int getCount() { return count; }
}

public class MainActivity extends Activity {
  final Counter counter = new Conuter();
  public void onCreate(Bundle b) {
    super.onCreate(b);
    setContentView(new CounterView(this));
  }
}

public CounterView extends RenderableView {
  private final Counter counter;
  public CounterView(Context c) {
    super(c);
    this.counter = ((MainActivity) c).counter;
  }
  public void view() {
    linearLayout(() -> {
      textView(() -> {
        text("Count: " + this.counter.getCount());
      });
      button(() -> {
        onClick(v -> this.counter.incr());
      });
    });
  }
}
```

Of course this approach doesn't scale well. If your app grows or your
requirements are too flexible - consider using Redux.

## Redux

Anvil guarantees that your views always reflect your most recent data. Redux
guarantees that your data is always in the predictable state.

Together they allow you to write consistent apps that behave and look exactly
as planned, they are easy to develop, to test and to debug.

[Redux](http://redux.js.org) itself is a pattern and there is a number of
Redux implementations for Android. I will focus on
[Jedux](https://github.com/trikita/jedux) here, but
[redux-java](https://github.com/glung/redux-java) and
[bansa](https://github.com/brianegan/bansa) are also worth checking.

Redux defines three main parts: state (your data model), actions (small
messages that are emitted to trigger some state changes) and a reducer (a pure
function that takes an incoming action and returns an updated state).

To tie it all together you will need a global `Store` object. That's the only
class you have to learn in Redux and it has two major methods:

* Store.dispatch(action): State - post an action message and get an updated state
* Store.getState(): State - get current state

It is highly recommended to keep your State class immutable, e.g. when you
modify it - you get a new object. This will save you from synchronization
problems and will simplify your code a lot. If you don't like writing immutable
builders manually - I recommend to use
[Immutables](http://immutables.github.io) library.

## Redux counter

Let's start with a State. For a counter app it will just hold a number. I'm
using Immutables here, but you may write it manually (especially if you use
Kotlin with its great data classes):

```java
@Value.Immutable
public inteface State {
  int count();
}
```

Now, define your action types:

```java
enum Action { INCR, DECR }
```

Create a store:

```java
// Create an initial state object
State initialState = new ImmutableState.builder.count(0).build();
// Create reducer (can be a lambda)
Store.Renderer<Action, State> reducer = (action, state) -> {
  switch (action) {
    case INCR:
      return ImmutableState.copyOf(state).withCount(state.count() + 1);
    case DECR:
      return ImmutableState.copyOf(state).withCount(state.count() - 1);
  }
  // If we can't handle an action - we should return current state
  return state;
};
// Create a store with the given reducer and initial state
Store<Action, State> store = new Store(reducer, initialState);
```

Finally bind your views to the state and emit actions inside the listeners:

```java
textView(() -> {
  text("Count: " + store.getState().count());
});
button(() -> {
  onClick(v -> store.dispatch(INCR));
});
```

## Redux Middleware

Your reducer is a pure function that must have no side effects. It's probably
the most boring part of the Redux app.

Now, what if you have to do some _real_ job in your app? Like starting some
threads, running network operations or dealing with other android APIs?

That's what middlewares are for. Middleware is a simple way to hook into an
action stream, intercept actions, run side-effect tasks and either propagate
the action further, or skip it, or emit another action instead.

Each middleware knows about the incoming message, the current state, the next
middleware in the chain, and it has a reference to the global store object so
it can emit other actions if needed.

Example: you need to download a file when the button is clicked.

On button click you emit `START_DOWNLOAD` action. `Downloader` middleware
receives that action, starts a downloading thread (or service). A thread may
emit `UPDATE_PROGRESS` actions periodically and `DOWNLOAD_FINISHED` once it's
done. All actions are passed into the store, where a reducer could update the
state (e.g. toggle the "isDownloading" flag or "progress" value).

Reducer function does the following:

```java
switch (action) {
  case START_DOWNLOAD:
    return ImmutableState.copyOf(state)
      .isDownloading(true).progress(0).build();
  case UPDATE_PROGRESS:
    return ImmutableState.copyOf(state)
      .progress(actionValue).build();
  case FINISH_DOWNLOAD:
    return ImmutableState.copyOf(state)
      .isDownloading(false).build();
}
```

State is bound to certain views, for example:

```java
button(() -> {
  // Let user click the button only if no download happens at the moment
  enabled(store.getState().isDownloading() == false);
  onClick(v -> store.dispatch(new Action<>(START_DOWNLOAD, someUrl)));
});
progressBar(() -> {
  max(100);
  // Show progress only if something is downloading
  visibility(store.getState().isDownloading());
  progress(store.getState().progress());
});
```

You middleware can be any custom class implementing the following interface:

```java
public interface Middleware<A, S> {
		void dispatch(Store<A, S> store, A action, NextDispatcher<A> next);
}
```

See the
[Logger](https://github.com/trikita/jedux/blob/master/library/src/main/java/trikita/jedux/Logger.java)
middleware for an example of how middleware can be written.

Middlewares are passed as variadic arguments into the store constructor:

```java
new Store(reducer, initialState,
	new Logger("myApp"),
	new Downloader(context, cacheDir));
```

Middlewares are usually small and focused. Each middleware reacts on a certain
group of action types, so you can use different Enums and use instanceof to see
if an action belongs to your middleware.

## Build your own architecture

Jedux doesn't force you to implement certain interface or to use certain data
types.

Your state can be of any type and it can have any nested sub-states (e.g. for
authorization there might be one set of state variables, for user profile
another and so on).

Your action can be on any type, from raw strings or integer constants to enums
and data classes.

Your reducer must be pure, but you may split it into smaller functions, each
handling a subset of actions (and most likely - a sub-state). Since reducers by
default return the current state - you can easily combine reducer functions.
The ones that could not handle the message will return the current sub-state,
join them together and you will get a new state object without producing much
garbage.

Your middlewares are now your controllers. Pass the context into their
constructors if needed, let them control the services and other APIs.
But keep them small and isolated. Each middleware should do one thing.

The only place where your isolated and self-contained parts meet is your custom
Application class (or any other place where you create a global store). You may
even live without dependency injection, and still be able to test each part of
your app individually.

Here are the [sources of Jedux](https://github.com/trikita/jedux) - it's only
about 100 lines of code to read. Try it in some simple projects and see how it
feels. You will like it.

