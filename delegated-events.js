// import SelectorSet from 'selector-set';

const events = {};
const propagationStopped = new WeakMap();
const immediatePropagationStopped = new WeakMap();
const currentTargets = new WeakMap();

function before(subject, verb, fn) {
  const source = subject[verb];
  subject[verb] = function() {
    fn.apply(subject, arguments);
    return source.apply(subject, arguments);
  };
  return subject;
}

function matches(selectors, target) {
  const queue = [];
  let node = target;

  do {
    if (node.nodeType !== 1) break;
    const matches = selectors.matches(node);
    if (matches.length) {
      queue.push({node: node, observers: matches});
    }
  } while (node = node.parentElement);

  return queue;
}

function trackPropagation() {
  propagationStopped.set(this, true);
}

function trackImmediate() {
  immediatePropagationStopped.set(this, true);
}

function getCurrentTarget() {
  return currentTargets.get(this);
}

function defineCurrentTarget(event) {
  const descriptor = Object.getOwnPropertyDescriptor(Event.prototype, 'currentTarget');
  if (!descriptor) return;
  Object.defineProperty(event, 'currentTarget', {get: getCurrentTarget});
}

function dispatch(event) {
  before(event, 'stopPropagation', trackPropagation);
  before(event, 'stopImmediatePropagation', trackImmediate);
  defineCurrentTarget(event);

  const selectors = events[event.type];
  const queue = matches(selectors, event.target);
  for (let i = 0, len1 = queue.length; i < len1; i++) {
    if (propagationStopped.get(event)) break;
    const matched = queue[i];
    currentTargets.set(event, matched.node);

    for (let j = 0, len2 = matched.observers.length; j < len2; j++) {
      if (immediatePropagationStopped.get(event)) break;
      matched.observers[j].data.call(matched.node, event);
    }
    immediatePropagationStopped.delete(event);
  }
}

export function on(name, selector, fn) {
  let selectors = events[name];
  if (!selectors) {
    selectors = new SelectorSet();
    events[name] = selectors;
    document.addEventListener(name, dispatch, false);
  }
  selectors.add(selector, fn);
}

export function off(name, selector, fn) {
  const selectors = events[name];
  if (!selectors) return;
  selectors.remove(selector, fn);

  if (selectors.size) return;
  delete events[name];
  document.removeEventListener(name, dispatch, false);
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
