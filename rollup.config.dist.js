import babel from 'rollup-plugin-babel';

export default {
  input: 'delegated-events.js',
  output: {
    file: 'dist/delegated-events.js',
    format: 'amd'
  },
  external: 'selector-set',
  plugins: [babel()]
};
