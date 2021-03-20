Events
======

- [Overview](#overview)
- [Listening to events](#listening-to-events)
- [Raising Events](#raising-events)
- [Bitsy](#bitsy)
- [Unity(WIP)](#unity)
- [Current Events](./ExistingEvents.md)

Overview
--------

(see [this page](/docs/Sharing.md) for an overview of shared globals)

There is now a global shared state throughout the game that can be accessed in the global object like the following:

```js
window.top.d.State
//or if imported globals.js, simply
d.State
```

State is a plain js object, and can store whatever you want. However, it's good practice to define the initial values of things in the state, which can be done in the file [global.js](../global.js).

Currently the initialState is defined as the following:
```js
const initialState = {
  sawJensNarrative: false,
  visitedAlidator: false,
  visitedPrometeus: false,
}
```

Current State Information
-------
  - `sawMessyServerNarrative`: set to true when opening the narrative in the messy computer
  - `visitedAlidator`: set to true when getting the sparkling light in alidator
  - `visitedPrometeus`: set to true when talking to the bird in prometheus (salada prometida),

TODO
----

 - [] Make events for when the state changes
 - [] Have other ways of saving the state to share between tabs