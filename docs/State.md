State
=====

- [Overview](#overview)
- [Listening to state changes](#listening-to-events)
- [Current Events](#current-state-information)

Overview
--------

(see [this page](/docs/Sharing.md) for an overview of shared globals)

There is now a global shared state throughout the game that can be accessed in the global object like the following:

```js
window.top.d.State
//or if imported globals.js, simply
d.State
```

State is a plain js object, and can store whatever you want. However, it's good practice to define the initial values of things in the state, which can be done in the file [global.js](/global.js).

Currently the initialState is defined as the following:
```js
const initialState = {
  sawMessyServerNarrative: false,
  visitedAlidator: false,
  visitedPrometeus: false,
}
```

Listening to State Changes
--------------------------

You can also listen to specific state changes if you want to, the way to do it is with the global `ListenState(propertyName)` function:

For example:

```js
d.State.listen('sawMessyServerNarrative', (value) => {
  console.log('sawMessyServerNarrative changed to ' + value)
})
```

Clearing the State
------------------
For debugging purposes, you can clear the saved state completely by typing `window.top.d.State.clear()` into the console.

Current State Information
-------------------------

  - `sawMessyServerNarrative`: set to true when opening the narrative in the messy computer
  - `visitedAlidator`: set to true when getting the sparkling light in alidator
  - `visitedPrometeus`: set to true when talking to the bird in prometheus (salada prometida),
  - `visitedFranBlog`: set to true on first open of fran's blog

TODO
----

 - [] Make events for when the state changes
 - [] Have other ways of saving the state to share between tabs
