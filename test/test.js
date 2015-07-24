describe('delegated event listeners', function() {
  describe('firing custom events', function() {
    it('fires custom events with detail', function(done) {
      const observer = function(event) {
        document.removeEventListener('test:event', observer);
        assert(event.bubbles);
        assert(event.cancelable);
        assert.equal(event.type, 'test:event');
        assert.deepEqual(event.detail, {id: 42, login: 'hubot'});
        assert.strictEqual(document.body, event.target);
        assert.instanceOf(event, CustomEvent);
        done();
      };
      document.addEventListener('test:event', observer);
      $.fire(document.body, 'test:event', {id: 42, login: 'hubot'});
    });

    it('fires custom events without detail', function(done) {
      const observer = function(event) {
        document.removeEventListener('test:event', observer);
        assert.isUndefined(event.detail);
        assert.instanceOf(event, CustomEvent);
        done();
      };
      document.addEventListener('test:event', observer);
      $.fire(document.body, 'test:event');
    });
  });

  describe('registering event observers', function() {
    it('observes custom events', function(done) {
      const observer = function(event) {
        $.off('test:event', '*', observer);
        assert(event.bubbles);
        assert(event.cancelable);
        assert.equal(event.type, 'test:event');
        assert.deepEqual({id: 42, login: 'hubot'}, event.detail);
        assert.strictEqual(document.body, event.target);
        assert.strictEqual(document.body, this);
        assert.instanceOf(event, CustomEvent);
        done();
      };
      $.on('test:event', '*', observer);
      $.fire(document.body, 'test:event', {id: 42, login: 'hubot'});
    });

    it('removes event observers', function() {
      const observer = function() { assert.fail(); };
      $.on('test:event', '*', observer);
      $.off('test:event', '*', observer);
      $.fire(document.body, 'test:event');
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
        assert.strictEqual(this, parent);
        order.push(1);
      };

      const child = this.child;
      const two = function(event) {
        assert.strictEqual(this, child);
        order.push(2);
      };

      $.on('test:event', '.js-test-parent', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-parent', one);
      $.off('test:event', '.js-test-child', two);

      assert.deepEqual([2, 1], order);
    });

    it('stops propagation bubbling to parent', function() {
      const one = function(event) { assert.fail(); };
      const two = function(event) { event.stopPropagation(); };
      $.on('test:event', '.js-test-parent', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-parent', one);
      $.off('test:event', '.js-test-child', two);
    });

    it('stops immediate propagation', function() {
      const one = function(event) { event.stopImmediatePropagation(); };
      const two = function(event) { assert.fail(); };
      $.on('test:event', '.js-test-child', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-child', one);
      $.off('test:event', '.js-test-child', two);
    });

    it('stops immediate propagation but not bubbling', function(done) {
      const one = function(event) { assert.ok(event); done(); };
      const two = function(event) { event.stopImmediatePropagation(); };
      $.on('test:event', '.js-test-parent', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-parent', one);
      $.off('test:event', '.js-test-child', two);
    });
  });
});
