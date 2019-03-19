import SelectorSet from 'selector-set';

interface IPlainObject<T = any> { [key: string]: T; }

type IEventsPool = IPlainObject<SelectorSet<EventListener>>;

interface IEventsPools {
  bubbleEvents: IEventsPool;
  captureEvents: IEventsPool;
}

const eventsPoolMap = new WeakMap<Element | Document, IEventsPools>();
const propagationStopped = new WeakMap<Event, true>();
const immediatePropagationStopped = new WeakMap<Event, true>();
const currentTargets = new WeakMap<Event, EventTarget>();
const currentTargetDesc = Object.getOwnPropertyDescriptor(
  Event.prototype,
  'currentTarget',
);

interface IMatchedTarget {
  node: Node;
  observers: Array<{selector: string, data: EventListener}>;
}

function isBoolean(v: any): v is boolean {
  return v === false || v === true;
}

function before(subject: any, methodName: keyof IPlainObject<Function>, callback: Function): any {
  const source = subject[methodName];
  subject[methodName] = function() {
    callback.apply(subject, arguments);
    return source.apply(subject, arguments);
  };
  return subject;
}

function matchesTargets(selectorSet: SelectorSet<EventListener>, event: Event, reverse: boolean): IMatchedTarget[] {
  const queue: IMatchedTarget[] = [];
  let node: Node | null = event.target as Node | null;
  if (!node) return queue;

  do {
    if (node.nodeType !== Node.ELEMENT_NODE) break;

    const observers = selectorSet.matches(node as Element);

    if (observers.length) {
      const matched = { node, observers };

      if (reverse) {
        queue.unshift(matched);
      } else {
        queue.push(matched);
      }
    }
  } while ((node !== event.currentTarget) && (node = node.parentElement));

  return queue;
}

function trackPropagation(this: Event) {
  propagationStopped.set(this, true);
}

function trackImmediate(this: Event) {
  propagationStopped.set(this, true);
  immediatePropagationStopped.set(this, true);
}

function getCurrentTarget(this: Event) {
  return currentTargets.get(this) || null;
}

function defineCurrentTarget(event: Event, getter?: () => EventTarget | null) {
  if (!currentTargetDesc) return;

  Object.defineProperty(event, 'currentTarget', {
    configurable: true,
    enumerable: true,
    get: getter || currentTargetDesc.get,
  });
}

function delegateListener(event: Event): void {
  if (!event.currentTarget || !event.target) return;
  const capture = event.eventPhase === Event.CAPTURING_PHASE;
  const selectorSet = getEventsPool(event.currentTarget as Element, capture)[event.type];

  if (!selectorSet) return;

  const queue = matchesTargets(selectorSet, event, capture);
  if (!queue.length) return;

  before(event, 'stopPropagation', trackPropagation);
  before(event, 'stopImmediatePropagation', trackImmediate);
  defineCurrentTarget(event, getCurrentTarget);

  for (let i = 0, len1 = queue.length; i < len1; i++) {
    if (propagationStopped.has(event)) break;
    const { node, observers } = queue[i];
    currentTargets.set(event, node);

    for (let j = 0, len2 = observers.length; j < len2; j++) {
      if (immediatePropagationStopped.has(event)) break;
      observers[j].data.call(node, event);
    }
  }

  currentTargets.delete(event);
  defineCurrentTarget(event);
}

function getEventsPool(element: Element | Document, capture?: boolean): IEventsPool {
  let eventsPool = eventsPoolMap.get(element);
  if (!eventsPool) {
    eventsPool = {
      bubbleEvents: {},
      captureEvents: {},
    };
    eventsPoolMap.set(element, eventsPool);
  }
  return capture ? eventsPool.captureEvents : eventsPool.bubbleEvents;
}

export function on(
  element: Element | Document,
  type: string,
  selector: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions,
): void {
  const capture = isBoolean(options) ? options : options && options.capture;
  const selectorSetByType = getEventsPool(element, capture);

  let selectorSet = selectorSetByType[type];
  if (!selectorSet) {
    selectorSet = new SelectorSet();
    selectorSetByType[type] = selectorSet;
    element.addEventListener(type, delegateListener, options);
  }
  selectorSet.add(selector, listener);
}

export function off(
  element: Element | Document,
  type: string,
  selector?: string,
  listener?: EventListener,
  options?: boolean | AddEventListenerOptions,
): void {
  if (!eventsPoolMap.has(element)) return;

  const capture = isBoolean(options) ? options : options && options.capture;
  const selectorSetByType = getEventsPool(element, capture);

  const selectorSet = selectorSetByType[type];
  if (!selectorSet) return;

  if (selector) {
    if (listener) {
      selectorSet.remove(selector, listener);
    } else {
      selectorSet.remove(selector);
    }

    if (selectorSet.size) return;
  }

  element.removeEventListener(type, delegateListener, options);
  delete selectorSetByType[type];
}

export function fire(target: EventTarget, type: string, detail?: any) {
  return target.dispatchEvent(
    new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail,
    }),
  );
}
