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

Listening to events
-------------------

Currently there's not a very straightforward way of listening of events, it's mostly a case by case basis. But you can see the current implementations in [the function loop() in gatherings/sequential-games.html](gatherings/sequential-games.html) and in [salad daze line 289](games/salad-days/game.html).

Particularly [sequential-games.html](gatherings/sequential-games.html), is reacting to events and opening/replacing windows, or executing code in the page containing other games. You can see it in the following code: 

```js
function loop() {
  if (window.parent.getEvents) {
    var newEvents = window.parent.getEvents("cat");
    newEvents.forEach((event) => {
      // search (ctrl+f) "#LISTEN" to get to this part of the code
      // THIS IS THE IMPORTANT PART
      // TO ADD NEW EVENTS ADD A NEW IF BLOCK HERE, AS FOLLOWS:
      // if (event == <eventName>) {
        //// Write code that happens here
      //}
      if (event == "cat") {
        document.getElementById("alidator").style.display = "none"
        document.getElementById("salada").style.display = "block"
      }
      if (event == "salada") {
        document.getElementById("alidator").style.display = "block"
        document.getElementById("salada").style.display = "none"
      }
      if (event == "juice") {
        document.getElementById("free-juice").style.display = "block"
      }
    });
  }
  window.requestAnimationFrame(loop)
}
```

Raising events
--------------

The current way to raise events is to call `window.parent.addEvent("<eventName>")` from the game (that is embedded in the current page). Therefore the challenge is to make being able to execute javascript code in whatever tool we are using for our games to be able to call the events.

So far, we have instructions for the following:
  - [Bitsy](#bitsy)
  - [Unity(WIP)](#unity)

### Bitsy

If you have a bitsy game and want it to be able to have events, add the `javascript dialog` hack. [borksy](https://ayolland.itch.io/borksy) is pretty good for this.

With that you now have the power to write any arbitrary javascript in your bitsy dialogues. And so you have access to our work in progress event system! Where you can do either of the following:

1. Raise events __immediately in chat__
```
(jsNow "window.parent.addEvent('eventName')")
```

2. Raise events __after the dialogue is over__
```
(js"window.parent.addEvent('eventName')")
```
### Unity 

-- work in progress --

Following whatever is described in this link should work: https://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html

