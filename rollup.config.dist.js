import babel from 'rollup-plugin-babel';

export default {
  entry: 'delegated-events.js',
  dest: 'dist/delegated-events.js',
  format: 'amd',
  external: 'selector-set',
  plugins: [
    babel()
  ]
};
