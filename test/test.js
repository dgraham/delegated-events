import {on, off, fire} from '../delegated-events';

describe('delegated event listeners', function() {
  describe('firing custom events', function() {
    it('fires custom events with detail', function() {
      const observer = function(event) {
        assert(event.bubbles);
        assert(event.cancelable);
        assert.equal(event.type, 'test:event');
        assert.deepEqual(event.detail, {id: 42, login: 'hubot'});
        assert.strictEqual(document.body, event.target);
        assert.instanceOf(event, CustomEvent);
      };
      document.addEventListener('test:event', observer);
      fire(document.body, 'test:event', {id: 42, login: 'hubot'});
      document.removeEventListener('test:event', observer);
    });

    it('fires custom events without detail', function() {
      const observer = function(event) {
        assert(event.detail === undefined || event.detail === null);
        assert.instanceOf(event, CustomEvent);
      };
      document.addEventListener('test:event', observer);
      fire(document.body, 'test:event');
      document.removeEventListener('test:event', observer);
    });

    it('returns canceled when default prevented', function() {
      const observer = (event) => event.preventDefault();
      document.addEventListener('test:event', observer);
      const canceled = !fire(document.body, 'test:event');
      assert.equal(canceled, true);
      document.removeEventListener('test:event', observer);
    });

    it('returns not canceled when default is not prevented', function() {
      const observer = (event) => assert.ok(event);
      document.addEventListener('test:event', observer);
      const canceled = !fire(document.body, 'test:event');
      assert.equal(canceled, false);
      document.removeEventListener('test:event', observer);
    });
  });

  describe('registering event observers', function() {
    it('observes custom events', function() {
      const observer = function(event) {
        assert(event.bubbles);
        assert(event.cancelable);
        assert.equal(event.type, 'test:event');
        assert.deepEqual({id: 42, login: 'hubot'}, event.detail);
        assert.strictEqual(document.body, event.target);
        assert.strictEqual(document.body, event.currentTarget);
        assert.strictEqual(document.body, this);
        assert.strictEqual(this, event.currentTarget);
        assert.instanceOf(event, CustomEvent);
      };
      on('test:event', 'body', observer);
      fire(document.body, 'test:event', {id: 42, login: 'hubot'});
      off('test:event', 'body', observer);
    });

    it('removes event observers', function() {
      const observer = (event) => assert.fail(event);
      on('test:event', '*', observer);
      off('test:event', '*', observer);
      fire(document.body, 'test:event');
    });


    it('can reregister after removing', function() {
      const [observer, trace] = spy((event) => assert.ok(event));
      on('test:event', 'body', observer);
      off('test:event', 'body', observer);
      on('test:event', 'body', observer);
      fire(document.body, 'test:event');
      off('test:event', 'body', observer);
      assert.equal(1, trace.calls);
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
      const one = function(event) {
        assert.strictEqual(child, event.target);
        assert.strictEqual(parent, event.currentTarget);
        assert.strictEqual(this, event.currentTarget);
        assert.strictEqual(this, parent);
        order.push(1);
      };

      const child = this.child;
      const two = function(event) {
        assert.strictEqual(child, event.target);
        assert.strictEqual(child, event.currentTarget);
        assert.strictEqual(this, event.currentTarget);
        assert.strictEqual(this, child);
        order.push(2);
      };

      on('test:event', '.js-test-parent', one);
      on('test:event', '.js-test-child', two);
      fire(this.child, 'test:event');
      off('test:event', '.js-test-parent', one);
      off('test:event', '.js-test-child', two);

      assert.deepEqual([2, 1], order);
    });

    it('stops propagation bubbling to parent', function() {
      const one = (event) => assert.fail(event);
      const two = (event) => event.stopPropagation();
      on('test:event', '.js-test-parent', one);
      on('test:event', '.js-test-child', two);
      fire(this.child, 'test:event');
      off('test:event', '.js-test-parent', one);
      off('test:event', '.js-test-child', two);
    });

    it('stops immediate propagation', function() {
      const one = (event) => event.stopImmediatePropagation();
      const two = (event) => assert.fail(event);
      on('test:event', '.js-test-child', one);
      on('test:event', '.js-test-child', two);
      fire(this.child, 'test:event');
      off('test:event', '.js-test-child', one);
      off('test:event', '.js-test-child', two);
    });

    it('stops immediate propagation but not bubbling', function() {
      const [one, trace] = spy((event) => assert.ok(event));
      const two = (event) => event.stopImmediatePropagation();
      on('test:event', '.js-test-parent', one);
      on('test:event', '.js-test-child', two);
      fire(this.child, 'test:event');
      assert.equal(1, trace.calls);
      off('test:event', '.js-test-parent', one);
      off('test:event', '.js-test-child', two);
    });

    it('calculates selector matches before dispatching event', function() {
      this.child.classList.add('inactive');

      const one = function(event) {
        event.target.classList.remove('inactive');
        event.target.classList.add('active');
        assert.ok(event);
      };

      const two = (event) => assert.fail(event);

      on('test:event', '.js-test-child.inactive', one);
      on('test:event', '.js-test-child.active', two);
      fire(this.child, 'test:event');
      off('test:event', '.js-test-child.inactive', one);
      off('test:event', '.js-test-child.active', two);

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
