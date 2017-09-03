import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'test/bench.js',
  output: {
    file: 'build/bench.js',
    format: 'iife'
  },
  plugins: [
    babel(),
    nodeResolve({jsnext: true})
  ]
};
