
export default {
  plugins: [
    ['../../index', {
      splitChunks: {
        minSize: 0,
      },
    }],
  ],
};
