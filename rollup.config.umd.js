import babel from 'rollup-plugin-babel';

export default {
  input: 'delegated-events.js',
  name: 'delegated-events',
  output: {
    file: 'dist/index.umd.js',
    format: 'umd'
  },
  external: 'selector-set',
  plugins: [babel()]
};
