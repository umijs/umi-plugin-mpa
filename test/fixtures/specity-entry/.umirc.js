
export default {
  plugins: [
    ['../../../index', {
      entry: {
        index: require.resolve('./index'),
      },
    }],
  ],
};
