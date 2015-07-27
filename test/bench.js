(function() {
  const DEPTH = 25;
  const OBSERVERS = 100;
  const DISPATCHES = 1500;

  function build(depth) {
    var parent = document.body;
    for (var i = 0; i < depth; i++) {
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
      name: 'native',
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
      name: 'delegated',
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
      name: 'jQuery',
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

  function jqueryss(selector) {
    return {
      name: 'jQuery + SelectorSet',
      setup: function() {
        return new Promise(function(resolve) {
          const script = document.createElement('script');
          script.addEventListener('load', resolve);
          script.src = '../vendor/jquery-selector-set/jquery.selector-set.js';
          document.head.appendChild(script);
        });
      },
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

  function report(results) {
    const colors = '#54c7fc #ffcd00 #ff9600 #ff2851 #0076ff #44db5e #ff3824 #8e8e93'.split(' ');

    const max = results.reduce(function(a, b) {
      return a.value > b.value ? a : b;
    });

    results = results.map(function(result, ix) {
      var percent = 100 * result.value / max.value;
      return {
        name: result.name,
        value: result.value,
        percent: Math.ceil(percent * 10) / 10,
        color: colors[ix]
      };
    }).sort(function(a, b) {
      return a.value < b.value ? -1 : 1;
    });

    const svg = document.querySelector('.js-results');
    const ns = 'http://www.w3.org/2000/svg';
    results.forEach(function(result, ix) {
      var row = document.createElementNS(ns, 'rect');
      row.setAttribute('fill', result.color);
      row.setAttribute('width', result.percent + '%');
      row.setAttribute('height', 60);

      var text = document.createElementNS(ns, 'text');
      text.textContent = result.name + ': ' + result.value + 'ms ' + result.percent + '%';
      text.setAttribute('x', 10);
      text.setAttribute('y', 35);

      var group = document.createElementNS(ns, 'g');
      group.setAttribute('transform', 'translate(0, ' + 60 * ix + ')');

      group.appendChild(row);
      group.appendChild(text);
      svg.appendChild(group);
    });
  }

  function benchmark() {
    const fn = arguments[0];
    const args = Array.prototype.slice.call(arguments, 1);
    const start = performance.now();
    fn.apply(null, args);
    return Math.round(performance.now() - start);
  }

  function run() {
    const last = build(DEPTH);
    const selector = '.' + last.className;
    const results = [native, delegated, jquery, jqueryss].map(function(test) {
      var harness = test(selector);
      var ready = harness.setup ? harness.setup() : Promise.resolve();
      return ready.then(function() {
        var handlers = observers(harness.handler);
        handlers.forEach(harness.on);
        var duration = benchmark(dispatch, last);
        handlers.forEach(harness.off);
        return {name: harness.name, value: duration};
      });
    });
    Promise.all(results).then(report);
  }

  run();
})();
