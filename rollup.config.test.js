import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'test/test.js',
  output: {
    file: 'build/test.js',
    format: 'iife'
  },
  plugins: [babel(), nodeResolve({jsnext: true})]
};
