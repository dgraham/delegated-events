(function() {
  const events = new Map();
  const propagationStopped = new WeakMap();
  const immediatePropagationStopped = new WeakMap();

  function before(subject, verb, fn) {
    const source = subject[verb];
    subject[verb] = function() {
      fn.apply(subject, arguments);
      return source.apply(subject, arguments);
    };
    return subject;
  }

  function matches(selectors, target) {
    var queue = [];
    var node = target;

    do {
      if (node.nodeType !== 1) break;
      var matches = selectors.matches(node);
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

  function dispatch(selectors, event) {
    before(event, 'stopPropagation', trackPropagation);
    before(event, 'stopImmediatePropagation', trackImmediate);

    const queue = matches(selectors, event.target);
    for (var i = 0, len1 = queue.length; i < len1; i++) {
      if (propagationStopped.has(event)) break;
      var matched = queue[i];

      for (var j = 0, len2 = matched.observers.length; j < len2; j++) {
        if (immediatePropagationStopped.has(event)) break;
        matched.observers[j].data.call(matched.node, event);
      }
    }
  }

  this.on = function(name, selector, fn) {
    var selectors = events.get(name);
    if (!selectors) {
      selectors = new SelectorSet();
      events.set(name, selectors);
      document.addEventListener(name, dispatch.bind(null, selectors), false);
    }
    selectors.add(selector, fn);
  };

  this.off = function(name, selector, fn) {
    const selectors = events.get(name);
    if (selectors) {
      selectors.remove(selector, fn);
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
