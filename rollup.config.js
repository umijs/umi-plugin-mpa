import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import fileSize from 'rollup-plugin-filesize';

export default {
  input: './src/index.ts',
  output: {
    file: './dist/index.js',
    format: 'cjs',
  },
  plugins: [
    typescript({
      clean: true,
    }),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.js', 'jsx', '.ts', '.tsx'],
    }),
    fileSize(),
  ],
};
