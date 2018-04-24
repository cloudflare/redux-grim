import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: [
    {
      file: `dist/redux-grim${ isProd ? '.min' : ''}.js`,
      format: 'umd',
      name: 'redux-grim',
      sourcemap: true,
      globals: { 'seamless-immutable' : 'Immutable' }
    },
    {
      file: `dist/redux-grim.es${ isProd ? '.min' : ''}.js`,
      format: 'es',
      name: 'redux-grim',
      sourcemap: true,
      globals: { 'seamless-immutable' : 'Immutable' }
    },
  ],
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs({
      namedExports: {
        'node_modules/seamless-immutable/seamless-immutable.development.js': [ 'static' ]
      }
    }),
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    }),
    isProd && uglify(),
  ]
};
