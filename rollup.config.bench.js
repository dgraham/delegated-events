import tslint from 'rollup-plugin-tslint';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'test/bench.ts',
  output: {
    file: 'build/bench.js',
    format: 'cjs'
  },
  plugins: [
    tslint(),
    resolve({ browser: true }),
    typescript(),
  ]
};
