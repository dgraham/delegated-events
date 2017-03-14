/* @flow */

import {on, off, fire} from '../delegated-events';

function onButtonClick(event) {
  event.target;
}

on('click', '.js-button', onButtonClick);
off('click', 'js-button', onButtonClick);

on('robot:singularity', '.js-robot-image', function(event) {
  event.target;
  // event.detail.name
  // this.src
});

const image = document.querySelector('.js-robot-image');
if (image) {
  fire(image, 'robot:singularity', {name: 'Hubot'});
}
