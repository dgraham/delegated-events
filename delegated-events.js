import SelectorSet from 'selector-set';

const eventsPoolMap = new WeakMap();
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
    if (node.nodeType !== Node.ELEMENT_NODE) break;
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
  const eventsPool = eventsPoolMap.get(event.currentTarget);
  const capture = event.eventPhase === Event.CAPTURING_PHASE;
  const events = capture ? eventsPool.captureEvents : eventsPool.bubbleEvents;

  const selectors = events[event.type];
  if (!selectors) return;

  const queue = matches(selectors, event.target, capture);
  if (!queue.length) return;

  before(event, 'stopPropagation', trackPropagation);
  before(event, 'stopImmediatePropagation', trackImmediate);
  defineCurrentTarget(event, getCurrentTarget);

  for (let i = 0, len1 = queue.length; i < len1; i++) {
    if (propagationStopped.has(event)) break;
    const matched = queue[i];
    currentTargets.set(event, matched.node);

    for (let j = 0, len2 = matched.observers.length; j < len2; j++) {
      if (immediatePropagationStopped.has(event)) break;
      matched.observers[j].data.call(matched.node, event);
    }
  }

  currentTargets.delete(event);
  defineCurrentTarget(event);
}

/**
 * @param {Element | Document} element — host element
 * @param {string} name — event type
 * @param {string} selector
 * @param {EventListener} fn
 * @param {boolean | AddEventListenerOptions} [options]
 */
export function on(element, name, selector, fn, options = {}) {
  let eventsPool = eventsPoolMap.get(element);
  if (!eventsPool) {
    eventsPool = {
      bubbleEvents: {},
      captureEvents: {}
    };
    eventsPoolMap.set(element, eventsPool);
  }

  const capture = typeof options === 'boolean' ? options : options.capture;
  const events = capture ? eventsPool.captureEvents : eventsPool.bubbleEvents;

  let selectors = events[name];
  if (!selectors) {
    selectors = new SelectorSet();
    events[name] = selectors;
    element.addEventListener(name, dispatch, capture);
  }
  selectors.add(selector, fn);
}

/**
 * @param {Element | Document} element — host element
 * @param {string} name — event type
 * @param {string} [selector]
 * @param {EventListener} [fn]
 * @param {boolean | AddEventListenerOptions} [options]
 */
export function off(element, name, selector, fn, options = {}) {
  const eventsPool = eventsPoolMap.get(element);
  if (!eventsPool) return;

  const capture = typeof options === 'boolean' ? options : options.capture;
  const events = capture ? eventsPool.captureEvents : eventsPool.bubbleEvents;

  const selectors = events[name];
  if (!selectors) return;

  if (selector) {
    if (fn) {
      selectors.remove(selector, fn);
    } else {
      selectors.remove(selector);
    }

    if (selectors.size) return;
  }

  delete events[name];
  element.removeEventListener(name, dispatch, capture);
}

/**
 * @param {EventTarget} target
 * @param {string} name — event type
 * @param {any} [detail]
 */
export function fire(target, name, detail) {
  return target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: detail
    })
  );
}
