# Delegated event listeners

A small, fast delegated event library for JavaScript.

## Usage

```js
import {on, off, fire} from 'delegated-events';

// Listen for browser-generated events.
on('click', '.js-button', function(event) {
  console.log('clicked', this);
});

// Listen for custom events triggered by your app.
on('robot:singularity', '.js-robot-image', function(event) {
  console.log('robot', event.detail.name, this.src);
});

// Dispatch a custom event on an element.
var image = document.querySelector('.js-robot-image');
fire(image, 'robot:singularity', {name: 'Hubot'});
```

## Directly-bound events

The standard method of registering event handler functions is to directly bind
the listener to the element.

```js
// Find an element and bind a function directly to it.
var button = document.querySelector('.js-button');
button.addEventListener('click', function(event) {
  console.log('clicked', event.target);
});
```

If we have several clickable elements, listeners can be directly registered
on them in a loop.

```js
// Find all the buttons and attach a function to each of them.
var buttons = document.querySelectorAll('.js-button');
buttons.forEach(function(button) {
  button.addEventListener('click', function(event) {
    console.log('clicked', event.target);
  });
});
```

Directly binding event listeners to elements works great if the page doesn't
change after it's initially loaded. However, if we dynamically add another
button to the document, it won't receive a click event.

```js
// No click handler is registered on the new element.
var button = document.createElement('button');
button.textContent = 'Push';

var list = document.querySelector('.js-button-list');
list.appendChild(button);
```

## Delegated events

A solution to this is to *delegate* the event handler up the tree to the parent
element that contains all of the button children. When a button is clicked, the
event bubbles up the tree until it reaches the parent, at which point
the handler is invoked.

```js
// Event handling delegated to a parent element.
var list = document.querySelector('.js-button-list');
list.addEventListener('click', function(event) {
  console.log('clicked', event.target);
});
```

However, now *anything* clicked inside the list will trigger this event
handler, not just clicks on buttons. So we add a selector check to determine
if a `button` generated the click event, rather than a `span` element, text, etc.

```js
// Filter events by matching the element with a selector.
var list = document.querySelector('.js-button-list');
list.addEventListener('click', function(event) {
  if (event.target.matches('.js-button')) {
    console.log('clicked', event.target);
  }
});
```

Now we have something that works for any button element inside the list
whether it was included in the initial HTML page or added dynamically to the
document sometime later.

But what if the list element is added to the page dynamically?

If we delegate *most events* up to the global `document`, we no longer worry
about when elements are appended to the page—they will receive event listeners
automatically.

```js
// Delegated click handling up to global document.
document.addEventListener('click', function(event) {
  if (event.target.matches('.js-button')) {
    console.log('clicked', event.target);
  }
});
```

## Globally delegated events

Now that we've covered how browsers handle directly-bound and delegated events
natively, let's look at what this library actually does.

The goals of this library are to:

1. Provide shortcuts that make this common delegation pattern easy to use
   in web applications with hundreds of event listeners.
2. Use the browser's native event system.
3. Speed :racehorse:

### Shortcuts

Delegated event handling shortcuts (`on`, `off`, `fire`) are provided
so event handlers aren't required to test for matching elements
themselves. jQuery has great documentation on [event delegation with selectors][jq] too.

[jq]: http://api.jquery.com/on/

Here's the same globally delegated handler as above but using `on`.

```js
// Easy :)
on('click', '.js-button', function(event) {
  console.log('clicked', event.target);
});
```

### Native events

To provide compatibility with older browsers, jQuery uses "synthetic" events.
jQuery listens for the native browser event, wraps it inside a new event
object, and proxies all function calls, with modifications, through to the
native object.

All browsers now share a standard event system, so we can remove the extra
layer of event handling to recover performance.

### Performance

The delegated event system is written in [vanilla JavaScript](delegated-events.js),
so it won't significantly increase download times (minified + gzip = 640 bytes).
It relies on a small [`SelectorSet`](https://github.com/josh/selector-set)
data structure to optimize selector matching against the delegated events.

A micro-benchmark to compare relative event handling performance is included
and can be run with `npm run bench`.

## Triggering custom events

A `fire` shortcut function is provided to trigger custom events with
attached data objects.

```js
on('validation:success', '.js-comment-input', function(event) {
  console.log('succeeded for', event.detail.login);
});

var input = document.querySelector('.js-comment-input');
fire(input, 'validation:success', {login: 'hubot'});
```

The standard way of doing this works well but is more verbose.

```js
document.addEventListener('validation:success', function(event) {
  if (event.target.matches('.js-comment-input')) {
    console.log('succeeded for', event.detail.login);
  }
});

var input = document.querySelector('.js-comment-input');
input.dispatchEvent(
  new CustomEvent('validation:success', {
    bubbles: true,
    cancelable: true,
    detail: {login: 'hubot'}
  })
);
```

## Browser support

- Chrome
- Firefox
- Safari 6+
- Internet Explorer 9+
- Microsoft Edge

Internet Explorer requires polyfills for [`CustomEvent`][custom-event]
and [`WeakMap`][weakmap].

[custom-event]: https://github.com/krambuhl/custom-event-polyfill
[weakmap]: https://github.com/Polymer/WeakMap

## Development

```
npm run bootstrap
npm test
npm run bench
npm run browser
```

## License

Distributed under the MIT license. See LICENSE for details.
