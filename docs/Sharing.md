sharing
=========

- [overview](#overview)
- [usage](#usage)

overview
--------

we have a number of ways for games, other parts of the website, to communicate with one another *mysteriously* using shared modules:

- [events](./Events.md)
- [state](./State.md)

usage
-----

you can access these shared modules in javascript through the global `d` or `b` objects:

```js
window.top.d.Events.raise("haunt.me")
```

if you want to access these a little more simply, like:

```js
d.Events.raise("haunt.me")
```

then import the `global.js` script into your page. **note**, you'll have to use relative paths. for example, if you are two folders deep it would look like:

```html
<script type="module" src="/global.js">
```

or if you're importing it from a javascript [module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules):

```js
import "/global.js"
```
