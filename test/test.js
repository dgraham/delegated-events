describe('delegated event listeners', function() {
  describe('firing custom events', function() {
    it('fires custom events with detail', function(done) {
      var observer = function(event) {
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
      var observer = function(event) {
        document.removeEventListener('test:event', observer);
        assert(event.detail === undefined || event.detail === null);
        assert.instanceOf(event, CustomEvent);
        done();
      };
      document.addEventListener('test:event', observer);
      $.fire(document.body, 'test:event');
    });

    it('returns canceled when default prevented', function() {
      var observer = function(event) { event.preventDefault(); };
      document.addEventListener('test:event', observer);
      var canceled = !$.fire(document.body, 'test:event');
      assert.equal(canceled, true);
    });

    it('returns not canceled when default is not prevented', function(done) {
      var observer = function(event) { assert.ok(event); done(); };
      document.addEventListener('test:event', observer);
      var canceled = !$.fire(document.body, 'test:event');
      assert.equal(canceled, false);
    });
  });

  describe('registering event observers', function() {
    it('observes custom events', function(done) {
      var observer = function(event) {
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
      var observer = function() { assert.fail(); };
      $.on('test:event', '*', observer);
      $.off('test:event', '*', observer);
      $.fire(document.body, 'test:event');
    });

    it('can reregister after removing', function(done) {
      var observer = function(event) {
        assert(true);
        done();
      };
      $.on('test:event', '*', observer);
      $.off('test:event', '*', observer);
      $.on('test:event', '*', observer);
      $.fire(document.body, 'test:event');
    });
  });

  describe('event propagation', function() {
    before(function() {
      this.parent = document.querySelector('.js-test-parent');
      this.child = document.querySelector('.js-test-child');
    });

    it('fires observers in tree order', function() {
      var order = [];

      var parent = this.parent;
      var one = function(event) {
        assert.strictEqual(this, parent);
        order.push(1);
      };

      var child = this.child;
      var two = function(event) {
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
      var one = function(event) { assert.fail(); };
      var two = function(event) { event.stopPropagation(); };
      $.on('test:event', '.js-test-parent', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-parent', one);
      $.off('test:event', '.js-test-child', two);
    });

    it('stops immediate propagation', function() {
      var one = function(event) { event.stopImmediatePropagation(); };
      var two = function(event) { assert.fail(); };
      $.on('test:event', '.js-test-child', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-child', one);
      $.off('test:event', '.js-test-child', two);
    });

    it('stops immediate propagation but not bubbling', function(done) {
      var one = function(event) { assert.ok(event); done(); };
      var two = function(event) { event.stopImmediatePropagation(); };
      $.on('test:event', '.js-test-parent', one);
      $.on('test:event', '.js-test-child', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-parent', one);
      $.off('test:event', '.js-test-child', two);
    });

    it('calculates selector matches before dispatching event', function(done) {
      this.child.classList.add('inactive');

      var one = function(event) {
        event.target.classList.remove('inactive');
        event.target.classList.add('active');
        assert.ok(event);
        done();
      };

      var two = function(event) {
        fail();
      };

      $.on('test:event', '.js-test-child.inactive', one);
      $.on('test:event', '.js-test-child.active', two);
      $.fire(this.child, 'test:event');
      $.off('test:event', '.js-test-child.inactive', one);
      $.off('test:event', '.js-test-child.active', two);

      this.child.classList.remove('active');
    });
  });
});
