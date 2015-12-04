import babel from 'rollup-plugin-babel';

export default {
  entry: 'test/test.js',
  dest: 'build/test.js',
  format: 'iife',
  plugins: [ babel() ]
};
