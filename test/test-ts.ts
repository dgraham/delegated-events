import {on} from '../index';

on('click', '.hubot', function(event) {
  const e: MouseEvent = event;
  event.button;

  const self: Element = this;
  this.matches;

  const t: Element = event.currentTarget;
  event.currentTarget.matches;
});

on('custom:event', '.hubot', function(event) {
  const e: CustomEvent = event;
  event.detail;

  const self: Element = this;
  this.matches;

  const t: Element = event.currentTarget;
  event.currentTarget.matches;
});

document.addEventListener('click', handleEvent);
on('click', '.hubot', handleEvent);

function handleEvent(event: MouseEvent) {
  event.button;
  event.target;
}
