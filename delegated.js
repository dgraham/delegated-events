(function() {
  const events = new Map();
  const stopped = new WeakMap();

  function before(subject, verb, fn) {
    const source = subject[verb];
    subject[verb] = function() {
      fn.apply(subject, arguments);
      return source.apply(event, arguments);
    };
    return subject;
  }

  function dispatch(observers, event) {
    before(event, event.stopImmediatePropagation, stopped.set.bind(stopped, event));
    const matches = observers.matches(event.target);
    for (var i = 0, length = matches.length; i < length; i++) {
      if (stopped.has(event)) break;
      matches[i].data.call(event.target, event);
    }
  }

  this.on = function(name, selector, fn) {
    var observers = events.get(name);
    if (!observers) {
      observers = new SelectorSet();
      events.set(name, observers);
      document.addEventListener(name, dispatch.bind(null, observers), false);
    }
    observers.add(selector, fn);
  };

  this.off = function(name, selector, fn) {
    const observers = events.get(name);
    if (observers) {
      observers.remove(selector, fn);
    }
  };

  this.fire = function(target, name, detail) {
    return target.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        cancelable: true,
        detail: detail
      })
    );
  };
}).call($);
