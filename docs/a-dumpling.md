Dumpling
===============

- [Overview](#overview)
- [Attributes](#attributes)
- [Methods](#methods)
- [Events](#events)

Overview
--------

You can create dumplings just like a normal html component
The way to do so is by creating an element named `<a-dumpling>`

A complete dumpling looks something like this

```html
<a-dumpling id='example' x=10 y=20 width=30 height=40 temperament='sanguine' bodyClass='coolclass' hidden noClose>
  <!-- some content here-->
  <!-- if content is iframe or d-iframe, the frame will have maximize and back buttons-->
</a-dumpling>
```

Attributes
----------
### Positioning:

Unless specified, positions are randomized within the forest frame (with a small margin), so they go from like 5% to 95%.
- `x`: horizontal position (in percentage)
- `y`: vertical position (in percentage)
- `width`: width in percentage
- `height`: height in percentage

If you want to control randomization, you can add `min-` and `max-` to any attribute to limit/change randomization parameters. There's also `min-size` and `max-size` to specify both `max-width` and `max-height` at the same time.

### Other stuff
- `id`: if specified, the frame is unique. This can be used to toggle the frame.
- `title`: if specified, the title displayed on the drag bar
- `temperament`: Can be one of the following 4 values (you can read more about what they mean [here](./temperaments.md))
  - sanguine
  - phlegmatic
  - choleric
  - melancholic
- `bodyClass`: a custom class for the body of the frame (might not be useful anymore)
- `focused `: if you want the frame to show up focused on page load (focused frames should always come last in the html document, so they don't get overwritten by another one (TODO: fix this))
- `hidden`: makes the frame start up hidden
- `persistent` or `permanent`: makes the frame persist within the current window
- `noClose`: makes it so that the frame doesn't have a close button
- `noBack`: makes it so that the frame doesn't have a back button

Methods
-------

There are some methods you can call on frames in your js code. Ideally all methods described below can be called in one of 2 ways:

```js
element.methodName() // this assumes you have some reference to the element, like with getElementById or something else
//or
Frames.methodName(elementId)
```

The current methods are:
- `hide`: hides the frame
- `show`: shows a hidden frame
- `toggle`: toggles a frame hidden state
- `bringToTop`: brings the frame to the top and focuses on it
- `listen`: adds event listener to frame (see [Events](#events)

Events
-------

Draggable frames also have events when certain things happen to them. You can add listeners to frames by using the `listen` method

```js
element.listen(eventName, callback)
// or
Frames.listen(elementId, eventName, callback)
```

The current implemented events are:
- `show-frame`: happens when the frame shows up
- `hide-frame`: happens when the frame gets hidden
