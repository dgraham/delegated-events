(function() {
  const DEPTH = 100;
  const OBSERVERS = 100;
  const DISPATCHES = 2500;

  function build() {
    var parent = document.body;
    for (var i = 0; i < DEPTH; i++) {
      var child = document.createElement('div');
      child.classList.add('js-div-' + i);
      parent.appendChild(child);
      parent = child;
    }
    return parent;
  }

  function observers(fn) {
    const observers = [];
    for (var i = 0; i < OBSERVERS; i++) {
      observers.push(fn.bind(null));
    }
    return observers;
  }

  function native(selector) {
    return {
      handler: function(event) {
        if (event.target.matches(selector)) {
          if (event.type !== 'test:bench') {
            console.log('test');
          }
        }
      },
      on: function(fn) {
        document.addEventListener('test:bench', fn);
      },
      off: function(fn) {
        document.removeEventListener('test:bench', fn);
      }
    };
  }

  function delegated(selector) {
    return {
      handler: function(event) {
        if (event.type !== 'test:bench') {
          console.log('test');
        }
      },
      on: function(fn) {
        $.on('test:bench', selector, fn);
      },
      off: function(fn) {
        $.off('test:bench', selector, fn);
      }
    };
  }

  function jquery(selector) {
    return {
      handler: function(event) {
        if (event.type !== 'test:bench') {
          console.log('test');
        }
      },
      on: function(fn) {
        $(document).on('test:bench', selector, fn);
      },
      off: function(fn) {
        $(document).off('test:bench', selector, fn);
      }
    };
  }

  function dispatch(node) {
    for (var i = 0; i < DISPATCHES; i++) {
      node.dispatchEvent(
        new CustomEvent('test:bench', {
          bubbles: true,
          cancelable: true,
          detail: {index: i}
        })
      );
    }
  }

  function report(name, value) {
    const el = document.createElement('div');
    el.textContent = name + ' = ' + value;
    document.body.appendChild(el);
  }

  function benchmark() {
    const fn = arguments[0];
    const args = Array.prototype.slice.call(arguments, 1);
    const start = performance.now();
    fn.apply(null, args);
    return Math.round(performance.now() - start);
  }

  const last = build();
  const selector = '.' + last.className;
  [native, delegated, jquery].forEach(function(test) {
    var harness = test(selector);
    var handlers = observers(harness.handler);
    handlers.forEach(harness.on);
    var duration = benchmark(dispatch, last);
    handlers.forEach(harness.off);
    report(test.name, duration);
  });
})();
