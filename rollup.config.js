import babel from 'rollup-plugin-babel';

export default {
  input: 'delegated-events.js',
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'es'
    },
    {
      file: 'dist/index.umd.js',
      name: 'delegated-events',
      format: 'umd',
      globals: {
        'selector-set': 'SelectorSet'
      }
    }
  ],
  external: 'selector-set',
  plugins: [babel()]
};
