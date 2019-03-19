import tslint from 'rollup-plugin-tslint';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'test/test.ts',
  output: {
    file: 'build/test.js',
    format: 'cjs'
  },
  plugins: [
    tslint(),
    resolve({ browser: true }),
    typescript(),
  ]
};
