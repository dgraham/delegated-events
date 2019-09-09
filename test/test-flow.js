/* @flow strict */

import {on, off, fire} from '../delegated-events';

function onButtonClick(event) {
  event.target;
  event.target.closest('.foo');
}

on(document, 'click', '.js-button', onButtonClick);
off(document, 'click', 'js-button', onButtonClick);

on(document, 'robot:singularity', '.js-robot-image', function(event) {
  event.target;
  event.target.closest('.foo');
  // event.detail.name
  // this.src
});

const image = document.querySelector('.js-robot-image');
if (image) {
  fire(image, 'robot:singularity', {name: 'Hubot'});
}
