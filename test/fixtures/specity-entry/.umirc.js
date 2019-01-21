
export default {
  plugins: [
    ['../../../dist/index', {
      entry: {
        index: require.resolve('./index'),
      },
    }],
  ],
};
