import SelectorSet from 'selector-set';

const bubbleEvents = {};
const captureEvents = {};
const dispatchMap = {};
const propagationStopped = new WeakMap();
const immediatePropagationStopped = new WeakMap();
const currentTargets = new WeakMap();
let mismatchedEventType = function() {};

function before(subject, verb, fn) {
  const source = subject[verb];
  subject[verb] = function() {
    fn.apply(subject, arguments);
    return source.apply(subject, arguments);
  };
  return subject;
}

function matches(selectors, target, reverse) {
  const queue = [];
  let node = target;

  do {
    if (node.nodeType !== 1) break;
    const matches = selectors.matches(node);
    if (matches.length) {
      const matched = {node: node, observers: matches};
      if (reverse) {
        queue.unshift(matched);
      } else {
        queue.push(matched);
      }
    }
  } while (node = node.parentElement);

  return queue;
}

function trackPropagation() {
  propagationStopped.set(this, true);
}

function trackImmediate() {
  propagationStopped.set(this, true);
  immediatePropagationStopped.set(this, true);
}

function getCurrentTarget() {
  return currentTargets.get(this) || null;
}

function defineCurrentTarget(event) {
  const descriptor = Object.getOwnPropertyDescriptor(Event.prototype, 'currentTarget');
  if (!descriptor) return;
  Object.defineProperty(event, 'currentTarget', {get: getCurrentTarget});
}

function dispatch(expectedType) {
  let handler = dispatchMap[expectedType];
  if (!handler) {
    handler = dispatchMap[expectedType] = function(event) {
      if (event.type !== expectedType) {
        // Microsoft Edge sometimes fires an event handler for an event whose
        // type doesn't match the one the handler was registered for. Silence
        // the resulting runtime exceptions, but provide an optional API for
        // subscribing to them for debugging purposes.
        mismatchedEventType(expectedType, event);
        return;
      }
      before(event, 'stopPropagation', trackPropagation);
      before(event, 'stopImmediatePropagation', trackImmediate);
      defineCurrentTarget(event);

      const events = event.eventPhase === 1 ? captureEvents : bubbleEvents;
      const selectors = events[event.type];
      const queue = matches(selectors, event.target, event.eventPhase === 1);

      for (let i = 0, len1 = queue.length; i < len1; i++) {
        if (propagationStopped.get(event)) break;
        const matched = queue[i];
        currentTargets.set(event, matched.node);

        for (let j = 0, len2 = matched.observers.length; j < len2; j++) {
          if (immediatePropagationStopped.get(event)) break;
          matched.observers[j].data.call(matched.node, event);
        }
      }
      currentTargets.delete(event);
    };
  }
  return handler;
}

export function on(name, selector, fn, options = {}) {
  const capture = options.capture ? true : false;
  const events = capture ? captureEvents : bubbleEvents;

  let selectors = events[name];
  if (!selectors) {
    selectors = new SelectorSet();
    events[name] = selectors;
    document.addEventListener(name, dispatch(name), capture);
  }
  selectors.add(selector, fn);
}

export function off(name, selector, fn, options = {}) {
  const capture = options.capture ? true : false;
  const events = capture ? captureEvents : bubbleEvents;

  const selectors = events[name];
  if (!selectors) return;
  selectors.remove(selector, fn);

  if (selectors.size) return;
  delete events[name];
  document.removeEventListener(name, dispatch(name), capture);
}

export function fire(target, name, detail) {
  return target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: detail
    })
  );
}

export function onMismatchedEventType(callback) {
  mismatchedEventType = callback;
}
