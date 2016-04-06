import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'test/bench.js',
  dest: 'build/bench.js',
  format: 'iife',
  plugins: [
    babel(),
    nodeResolve({jsnext: true})
  ]
};
