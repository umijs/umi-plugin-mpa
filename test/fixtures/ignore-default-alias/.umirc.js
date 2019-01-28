
export default {
  plugins: [
    ['../../../dist/index', {
      entry: {
        entry: require.resolve('./src/entry'),
      },
      html: {}
    }],
  ],
};
