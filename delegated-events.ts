import SelectorSet from 'selector-set';

const bubbleEvents = {};
const captureEvents = {};
const propagationStopped = new WeakMap();
const immediatePropagationStopped = new WeakMap();
const currentTargets = new WeakMap();
const currentTargetDesc = Object.getOwnPropertyDescriptor(
  Event.prototype,
  'currentTarget'
);

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
  } while ((node = node.parentElement));

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

function defineCurrentTarget(event, getter) {
  if (!currentTargetDesc) return;

  Object.defineProperty(event, 'currentTarget', {
    configurable: true,
    enumerable: true,
    get: getter || currentTargetDesc.get
  });
}

function dispatch(event) {
  const events = event.eventPhase === 1 ? captureEvents : bubbleEvents;

  const selectors = events[event.type];
  if (!selectors) return;

  const queue = matches(selectors, event.target, event.eventPhase === 1);
  if (!queue.length) return;

  before(event, 'stopPropagation', trackPropagation);
  before(event, 'stopImmediatePropagation', trackImmediate);
  defineCurrentTarget(event, getCurrentTarget);

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
  defineCurrentTarget(event);
}

export function on(name, selector, fn, options = {}) {
  const capture = options.capture ? true : false;
  const events = capture ? captureEvents : bubbleEvents;

  let selectors = events[name];
  if (!selectors) {
    selectors = new SelectorSet();
    events[name] = selectors;
    document.addEventListener(name, dispatch, capture);
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
  document.removeEventListener(name, dispatch, capture);
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
