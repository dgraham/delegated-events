import {on, off, fire} from '../delegated-events';

describe('delegated event listeners', function() {
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
      const observer = (event) => event.preventDefault();
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
      on('test:on', 'body', observer);
      fire(document.body, 'test:on', {id: 42, login: 'hubot'});
      off('test:on', 'body', observer);
    });

    it('removes event observers', function() {
      const observer = (event) => assert.fail(event);
      on('test:off', '*', observer);
      off('test:off', '*', observer);
      fire(document.body, 'test:off');
    });

    it('removes delegated event observers', function() {
      const observer = (event) => assert.fail(event);
      on('test:off', '*', observer, {capture: true});
      off('test:off', '*', observer, {capture: true});
      fire(document.body, 'test:off');
    });

    it('can reregister after removing', function() {
      const [observer, trace] = spy(event => assert.ok(event));
      on('test:register', 'body', observer);
      off('test:register', 'body', observer);
      on('test:register', 'body', observer);
      fire(document.body, 'test:register');
      off('test:register', 'body', observer);
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

      on('test:order', '.js-test-parent', one, {capture: true});
      on('test:order', '.js-test-child', two, {capture: true});
      on('test:order', '.js-test-parent', three);
      on('test:order', '.js-test-child', four);
      fire(this.child, 'test:order');
      off('test:order', '.js-test-parent', one, {capture: true});
      off('test:order', '.js-test-child', two, {capture: true});
      off('test:order', '.js-test-parent', three);
      off('test:order', '.js-test-child', four);

      assert.deepEqual([1, 2, 4, 3], order);
    });

    it('clears currentTarget after propagation', function() {
      const [observer, trace] = spy(event => assert.ok(event.currentTarget));
      const event = new CustomEvent('test:clear', {bubbles: true});

      on('test:clear', 'body', observer);
      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);
      assert.isNull(event.currentTarget);
      off('test:clear', 'body', observer);
    });

    it('prevents redispatch after propagation is stopped', function() {
      const [observer, trace] = spy(event => event.stopPropagation());
      const event = new CustomEvent('test:redispatch', {bubbles: true});

      on('test:redispatch', 'body', observer);

      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);

      document.body.dispatchEvent(event);
      assert.equal(trace.calls, 1);

      off('test:redispatch', 'body', observer);
    });

    it('stops propagation bubbling to parent', function() {
      const one = (event) => assert.fail(event);
      const two = (event) => event.stopPropagation();
      on('test:bubble', '.js-test-parent', one);
      on('test:bubble', '.js-test-child', two);
      fire(this.child, 'test:bubble');
      off('test:bubble', '.js-test-parent', one);
      off('test:bubble', '.js-test-child', two);
    });

    it('stops immediate propagation', function() {
      const one = (event) => event.stopImmediatePropagation();
      const two = (event) => assert.fail(event);
      on('test:immediate', '.js-test-child', one);
      on('test:immediate', '.js-test-child', two);
      fire(this.child, 'test:immediate');
      off('test:immediate', '.js-test-child', one);
      off('test:immediate', '.js-test-child', two);
    });

    it('stops immediate propagation and bubbling', function() {
      const one = (event) => assert.fail(event);
      const two = (event) => event.stopImmediatePropagation();
      on('test:stop', '.js-test-parent', one);
      on('test:stop', '.js-test-child', two);
      fire(this.child, 'test:stop');
      off('test:stop', '.js-test-parent', one);
      off('test:stop', '.js-test-child', two);
    });

    it('calculates selector matches before dispatching event', function() {
      this.child.classList.add('inactive');

      const one = function(event) {
        event.target.classList.remove('inactive');
        event.target.classList.add('active');
        assert.ok(event);
      };

      const two = (event) => assert.fail(event);

      on('test:match', '.js-test-child.inactive', one);
      on('test:match', '.js-test-child.active', two);
      fire(this.child, 'test:match');
      off('test:match', '.js-test-child.inactive', one);
      off('test:match', '.js-test-child.active', two);

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
