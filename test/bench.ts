import { on, off } from '../delegated-events';

declare const Zepto: JQueryStatic;

interface IResult {
  name: string;
  value: number;
}

interface IPostResult extends IResult {
  percent: number;
  color: string;
}

interface IBenchAdapter {
  name: string;
  setup?: () => Promise<any>;
  on: (selector: string) => void;
  off: (selector: string) => void;
}

(function() {
  const DEPTH = 25;
  const DISPATCHES = 1500;

  function build(depth: number): string[] {
    const selectors = [];
    let parent = document.body;
    for (let i = 0; i < depth; i++) {
      const name = 'js-div-' + i;
      selectors.push('.' + name);
      const child = document.createElement('div');
      child.classList.add(name, 'a', 'b', 'c');
      parent.appendChild(child);
      parent = child;
    }
    return selectors;
  }

  function handler(event: Event): string | void {
    if (event.type !== 'test:bench') {
      return 'test';
    }
  }

  function matchHandler(this: string, event: Event): string | void {
    if ((event.target as Element).matches(this)) {
      if (event.type !== 'test:bench') {
        return 'test';
      }
    }
  }

  function native(): IBenchAdapter {
    const handlers = new Map();

    return {
      name: 'native',
      on(selector: string) {
        const clone = matchHandler.bind(selector);
        handlers.set(selector, clone);
        document.addEventListener('test:bench', clone);
      },
      off(selector: string) {
        const nativeHandler = handlers.get(selector);
        handlers.delete(selector);
        document.removeEventListener('test:bench', nativeHandler);
      },
    };
  }

  function delegated(): IBenchAdapter {
    return {
      name: 'delegated',
      on(selector: string) {
        on(document, 'test:bench', selector, handler);
      },
      off(selector: string) {
        off(document, 'test:bench', selector, handler);
      },
    };
  }

  function jquery(): IBenchAdapter {
    return {
      name: 'jQuery',
      on(selector: string) {
        $(document).on('test:bench', selector, handler);
      },
      off(selector: string) {
        $(document).off('test:bench', selector, handler as any);
      },
    };
  }

  function jqueryss(): IBenchAdapter {
    return {
      name: 'jQuery + SelectorSet',
      setup() {
        return new Promise<Event>(function(resolve) {
          const script = document.createElement('script');
          script.addEventListener('load', resolve);
          script.src = '../vendor/jquery-selector-set/jquery.selector-set.js';
          document.head.appendChild(script);
        });
      },
      on(selector: string) {
        $(document).on('test:bench', selector, handler);
      },
      off(selector: string) {
        $(document).off('test:bench', selector, handler as any);
      },
    };
  }

  function zepto(): IBenchAdapter {
    return {
      name: 'zepto',
      on(selector: string) {
        Zepto(document).on('test:bench', selector, handler);
      },
      off(selector: string) {
        Zepto(document).off('test:bench', selector, handler as any);
      },
    };
  }

  function dispatch(node: Node): void {
    for (let i = 0; i < DISPATCHES; i++) {
      node.dispatchEvent(
        new CustomEvent('test:bench', {
          bubbles: true,
          cancelable: true,
          detail: { index: i },
        }),
      );
    }
  }

  function report(results: IResult[]) {
    const colors = '#54c7fc #ffcd00 #ff9600 #ff2851 #0076ff #44db5e #ff3824 #8e8e93'.split(' ');

    const max = results.reduce((a, b) => (a.value > b.value ? a : b));

    const postResults: IPostResult[] = results
      .map(function(result, ix) {
        const percent = (100 * result.value) / max.value;
        return {
          name: result.name,
          value: result.value,
          percent: Math.ceil(percent * 10) / 10,
          color: colors[ix],
        };
      })
      .sort((a, b) => (a.value < b.value ? -1 : 1));

    const svg = document.querySelector('.js-results') as SVGElement;
    const ns = 'http://www.w3.org/2000/svg';
    postResults.forEach(function(result, ix) {
      const row = document.createElementNS(ns, 'rect');
      row.setAttribute('fill', result.color);
      row.setAttribute('width', result.percent + '%');
      row.setAttribute('height', String(60));

      const text = document.createElementNS(ns, 'text');
      text.textContent =
        result.name + ': ' + result.value + 'ms ' + result.percent + '%';
      text.setAttribute('x', String(10));
      text.setAttribute('y', String(35));

      const group = document.createElementNS(ns, 'g');
      group.setAttribute('transform', 'translate(0, ' + 60 * ix + ')');

      group.appendChild(row);
      group.appendChild(text);
      svg.appendChild(group);
    });
  }

  function benchmark(fn: (element: Element) => void, element: Element): number {
    const start = window.performance.now();
    fn.call(null, element);
    return Math.round(window.performance.now() - start);
  }

  function run() {
    const selectors = build(DEPTH);
    const deepest = document.querySelector(selectors[selectors.length - 1]);
    const results = [native, delegated, jquery, zepto, jqueryss].map(function(test) {
      const harness = test();
      const ready = harness.setup ? harness.setup() : Promise.resolve();
      return ready.then(function() {
        selectors.forEach(harness.on);
        const duration = benchmark(dispatch, deepest as Element);
        selectors.forEach(harness.off);
        return { name: harness.name, value: duration } as IResult;
      });
    });
    Promise.all(results).then(report);
  }

  run();
})();
