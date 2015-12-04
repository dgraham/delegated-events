import babel from 'rollup-plugin-babel';

export default {
  entry: 'test/bench.js',
  dest: 'build/bench.js',
  format: 'iife',
  plugins: [ babel() ]
};
