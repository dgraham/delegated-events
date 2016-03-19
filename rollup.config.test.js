import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'test/test.js',
  dest: 'build/test.js',
  format: 'iife',
  plugins: [
    babel(),
    nodeResolve({jsnext: true})
  ]
};
