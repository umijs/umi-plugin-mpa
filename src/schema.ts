
export default {
  type: 'object',
  additionalProperties: false,
  properties: {
    entry: {
      type: 'object'
    },
    htmlName: {
      type: 'string',
      minLength: 1,
    },
    deepPageEntry: {
      type: 'boolean',
    },
    splitChunks: {
      anyOf: [
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    html: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          minLength: 1,
          pattern: '.ejs$',
        },
      },
    },
    selectEntry: {
      anyOf: [
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
  },
};
