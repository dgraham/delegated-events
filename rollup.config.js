import typescript from 'rollup-plugin-typescript2';
import tslint from 'rollup-plugin-tslint';

export default {
  input: 'delegated-events.ts',
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
  plugins: [
    tslint(),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          declarationDir: './types',
        },
      },
    }),
  ]
};
