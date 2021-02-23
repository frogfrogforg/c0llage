Events
======

- [Overview](#overview)
- [Listening to events](#listening-to-events)
- [Raising Events](#raising-events)
  - [Bitsy](#bitsy)
  - [Unity(WIP)](#unity)

Overview
--------

The event system we are currently working on is a simple way of broadcasting something happened in your game/iframe so that other games/iframes can react to it if they want to.

There are 2 things you can do with events:
- __Listen__(get): you write code so that when an event happens, the code reacts to it in some way.
- __Raise__(add): you write code to broadcast that an event has happened causing all the listeners respond.

I (mut) used in sequential-games.html used a pattern I think Darwin suggested in the chat of calling the events with some sort of namespace, like `alidator.tea` `salada.bucket`. Hopefully we might keep some nice pattern like this.

Listening to events
-------------------

THERE IS NOW A WAY TO LISTEN TO EVENTS NICELY.

If your current window has events enabled, or if it's embedded in a page that does  (TODO: move the events code to a separate script to make this easier). The only code you need to add to listen to events is the following:

```js
// Event listening
// ctrl+f "#listen" to get here on file 'gatherings/sequential-games.html'
// copy the template below to add your own! (you can add anywhere!)
window.top.listenEvent('event.name', () => {
    // Write the code that should happen in response for the event
})
```

See that part of the code to see how some events currently work. You can also look at `./games/free-tanooki.js` in the end of the file there are some events specific for that game.

Raising events
--------------

The current way to raise events is to call `window.top.raiseEvent("event.name")` from the game (that is embedded in the current page). Therefore the challenge is to make being able to execute javascript code in whatever tool we are using for our games to be able to call the events.

So far, we have instructions for the following:
  - [Bitsy](#bitsy)
  - [Unity(WIP)](#unity)

### Bitsy

If you have a bitsy game and want it to be able to have events, add the `javascript dialog` hack. [borksy](https://ayolland.itch.io/borksy) is pretty good for this.

With that you now have the power to write any arbitrary javascript in your bitsy dialogues. And so you have access to our work in progress event system! Where you can do either of the following:

1. Raise events __immediately in chat__
```
(jsNow "window.top.raiseEvent('event.name')")
```

2. Raise events __after the dialogue is over__
```
(js"window.top.raiseEvent('event.name')")
```
### Unity 

-- work in progress --

Following whatever is described in this link should work: https://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html

