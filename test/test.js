describe('delegated event listeners', function() {
  it('fires custom events', function(done) {
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

  it('observes custom events', function(done) {
    const observer = function(event) {
      $.off('test:event', '*', observer);
      assert(event.bubbles);
      assert(event.cancelable);
      assert.equal(event.type, 'test:event');
      assert.deepEqual({id: 42, login: 'hubot'}, event.detail);
      assert.strictEqual(document.body, event.target);
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
