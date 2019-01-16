
export default {
  plugins: [
    ['../../../index', {
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
        minChunks: 2,
        minSize: 0,
      },
      html: {
        chunks: ['vendors', '<%= page %>'],
      },
    }],
  ],
};
