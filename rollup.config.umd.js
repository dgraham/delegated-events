import babel from 'rollup-plugin-babel';

export default {
  input: 'delegated-events.js',
  name: 'delegated-events',
  output: {
    file: 'dist/index.umd.js',
    format: 'umd',
    globals: {
      'selector-set': 'SelectorSet'
    }
  },
  external: 'selector-set',
  plugins: [babel()]
};
