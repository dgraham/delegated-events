import {on, off, fire} from '../delegated-events';

describe('delegated event listeners', function() {
  before(function() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="js-test-parent">
        <div class="js-test-child"></div>
      </div>`;
    document.body.appendChild(container);
  });

  describe('custom event dispatch', function() {
    it('fires custom events with detail', function() {
      const observer = function(event) {
        assert(event.bubbles);
        assert(event.cancelable);
        assert.equal(event.type, 'test:detail');
        assert.deepEqual(event.detail, {id: 42, login: 'hubot'});
        assert.strictEqual(document.body, event.target);
        assert.instanceOf(event, CustomEvent);
      };
      document.addEventListener('test:detail', observer);
      fire(document.body, 'test:detail', {id: 42, login: 'hubot'});
      document.removeEventListener('test:detail', observer);
    });

    it('fires custom events without detail', function() {
      const observer = function(event) {
        assert(event.detail === undefined || event.detail === null);
        assert.instanceOf(event, CustomEvent);
      };
      document.addEventListener('test:fire', observer);
      fire(document.body, 'test:fire');
      document.removeEventListener('test:fire', observer);
    });

    it('returns canceled when default prevented', function() {
      const observer = event => event.preventDefault();
      document.addEventListener('test:cancel', observer);
      const canceled = !fire(document.body, 'test:cancel');
      assert.equal(canceled, true);
      document.removeEventListener('test:cancel', observer);
    });

    it('returns not canceled when default is not prevented', function() {
      const [observer, trace] = spy(event => assert.ok(event));
      document.addEventListener('test:event', observer);
      const canceled = !fire(document.body, 'test:event');
      assert.equal(canceled, false);
      assert.equal(trace.calls, 1);
      document.removeEventListener('test:event', observer);
    });
  });

  describe('event observer registration', function() {
    it('observes custom events', function() {
      const observer = function(event) {
        assert(event.bubbles);
        assert(event.cancelable);
        assert.equal(event.type, 'test:on');
        assert.deepEqual({id: 42, login: 'hubot'}, event.detail);
        assert.strictEqual(document.body, event.target);
        assert.strictEqual(document.body, event.currentTarget);
        assert.strictEqual(document.body, this);
        assert.strictEqual(this, event.currentTarget);
        assert.instanceOf(event, CustomEvent);
      };
      on(document, 'test:on', 'body', observer);
      fire(document.body, 'test:on', {id: 42, login: 'hubot'});
      off(document, 'test:on', 'body', observer);
    });

    it('removes bubble event observers', function() {
      const observer = event => assert.fail(event);
      on(document, 'test:off', '*', observer);
      off(document, 'test:off', '*', observer);
      fire(document.body, 'test:off');
    });

    it('removes capture event observers', function() {
      const observer = event => assert.fail(event);
      on(document, 'test:off', '*', observer, {capture: true});
      off(document, 'test:off', '*', observer, {capture: true});
      fire(document.body, 'test:off');
    });

    it('can reregister after removing', function() {
      const [observer, trace] = spy(event => assert.ok(event));
      on(document, 'test:register', 'body', observer);
      off(document, 'test:register', 'body', observer);
      on(document, 'test:register', 'body', observer);
      fire(document.body, 'test:register');
      off(document, 'test:register', 'body', observer);
      assert.equal(trace.calls, 1);
    });
  });

  describe('event propagation', function() {
    before(function() {
      this.parent = document.querySelector('.js-test-parent');
      this.child = document.querySelector('.js-test-child');
    });

    it('fires observers in tree order', function() {
      const order = [];

      const parent = this.parent;
      const child = this.child;

      const one = function(event) {
        assert.strictEqual(child, event.target);
        assert.strictEqual(parent, event.currentTarget);
        assert.strictEqual(this, event.currentTarget);
        assert.strictEqual(this, parent);
        order.push(1);
      };

      const two = function(event) {
        assert.strictEqual(child, event.target);
        assert.strictEqual(child, event.currentTarget);
        assert.strictEqual(this, event.currentTarget);
        assert.strictEqual(this, child);
        order.push(2);
      };

      const three = function(event) {
        assert.strictEqual(child, event.target);
        assert.strictEqual(parent, event.currentTarget);
        assert.strictEqual(this, event.currentTarget);
        assert.strictEqual(this, parent);
        order.push(3);
      };

      const four = function(event) {
        assert.strictEqual(child, event.target);
        assert.strictEqual(child, event.currentTarget);
        assert.strictEqual(this, event.currentTarget);
        assert.strictEqual(this, child);
        order.push(4);
      };

      on(document, 'test:order', '.js-test-parent', one, {capture: true});
      on(document, 'test:order', '.js-test-child', two, {capture: true});
      on(document, 'test:order', '.js-test-parent', three);
      on(document, 'test:order', '.js-test-child', four);
      fire(this.child, 'test:order');
      off(document, 'test:order', '.js-test-parent', one, {capture: true});
      off(document, 'test:order', '.js-test-child', two, {capture: true});
      off(document, 'test:order', '.js-test-parent', three);
      off(document, 'test:order', '.js-test-child', four);

      assert.deepEqual([1, 2, 4, 3], order);
    });

    it('clears currentTarget after propagation', function() {
      const [observer, trace] = spy(event => assert.ok(event.currentTarget));
      const event = new CustomEvent('test:clear', {bubbles: true});

      on(document, 'test:clear', 'body', observer);
      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);
      assert.equal(event.currentTarget, null);
      off(document, 'test:clear', 'body', observer);
    });

    it('does not interfere with currentTarget when selectors match', function() {
      const [observer, trace] = spy(event =>
        assert.strictEqual(document.body, event.currentTarget)
      );
      const [observer2, trace2] = spy(event =>
        assert.strictEqual(this.parent, event.currentTarget)
      );
      const event = new CustomEvent('test:target:capture', {bubbles: true});

      on(document, 'test:target:capture', 'body', observer, {capture: true});
      this.parent.addEventListener('test:target:capture', observer2);

      this.child.dispatchEvent(event);
      assert.equal(trace.calls, 1);
      assert.equal(trace2.calls, 1);
      assert.equal(event.currentTarget, null);

      off(document, 'test:target:capture', 'body', observer, {capture: true});
      this.parent.removeEventListener('test:target:capture', observer2);
    });

    it('does not interfere with currentTarget when no selectors match', function() {
      const [observer, trace] = spy(event => assert.ok(event.currentTarget));
      const event = new CustomEvent('test:currentTarget', {bubbles: true});

      const one = event => assert.fail(event);
      on(document, 'test:currentTarget', '.not-body', one);

      document.addEventListener('test:currentTarget', observer);

      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);
      assert.equal(event.currentTarget, null);

      off(document, 'test:currentTarget', '.not-body', one);
      document.removeEventListener('test:currentTarget', observer);
    });

    it('prevents redispatch after propagation is stopped', function() {
      const [observer, trace] = spy(event => event.stopPropagation());
      const event = new CustomEvent('test:redispatch', {bubbles: true});

      on(document, 'test:redispatch', 'body', observer);

      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);

      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);

      off(document, 'test:redispatch', 'body', observer);
    });

    it('stops propagation bubbling to parent', function() {
      const one = event => assert.fail(event);
      const two = event => event.stopPropagation();
      on(document, 'test:bubble', '.js-test-parent', one);
      on(document, 'test:bubble', '.js-test-child', two);
      fire(this.child, 'test:bubble');
      off(document, 'test:bubble', '.js-test-parent', one);
      off(document, 'test:bubble', '.js-test-child', two);
    });

    it('stops immediate propagation', function() {
      const one = event => event.stopImmediatePropagation();
      const two = event => assert.fail(event);
      on(document, 'test:immediate', '.js-test-child', one);
      on(document, 'test:immediate', '.js-test-child', two);
      fire(this.child, 'test:immediate');
      off(document, 'test:immediate', '.js-test-child', one);
      off(document, 'test:immediate', '.js-test-child', two);
    });

    it('stops immediate propagation and bubbling', function() {
      const one = event => assert.fail(event);
      const two = event => event.stopImmediatePropagation();
      on(document, 'test:stop', '.js-test-parent', one);
      on(document, 'test:stop', '.js-test-child', two);
      fire(this.child, 'test:stop');
      off(document, 'test:stop', '.js-test-parent', one);
      off(document, 'test:stop', '.js-test-child', two);
    });

    it('calculates selector matches before dispatching event', function() {
      this.child.classList.add('inactive');

      const one = function(event) {
        event.target.classList.remove('inactive');
        event.target.classList.add('active');
        assert.ok(event);
      };

      const two = event => assert.fail(event);

      on(document, 'test:match', '.js-test-child.inactive', one);
      on(document, 'test:match', '.js-test-child.active', two);
      fire(this.child, 'test:match');
      off(document, 'test:match', '.js-test-child.inactive', one);
      off(document, 'test:match', '.js-test-child.active', two);

      this.child.classList.remove('active');
    });
  });

  function spy(fn) {
    const tracker = {calls: 0};
    const capture = function() {
      tracker.calls++;
      return fn.apply(this, arguments);
    };
    return [capture, tracker];
  }
});
