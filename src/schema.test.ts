import schema from './schema';
import AJV from 'ajv';

describe('schema', () => {
  const ajv = new AJV();

  it('entry', () => {
    expect(ajv.validate(schema, {
      entry: {},
    })).toEqual(true);
  });

  it('htmlName', () => {
    expect(ajv.validate(schema, {
      htmlName: 'foo',
    })).toEqual(true);
  });

  it('deepPageEntry', () => {
    expect(ajv.validate(schema, {
      deepPageEntry: true,
    })).toEqual(true);
  });

  it('splitChunks', () => {
    // boolean
    expect(ajv.validate(schema, {
      splitChunks: true,
    })).toEqual(true);
    // object
    expect(ajv.validate(schema, {
      splitChunks: {},
    })).toEqual(true);
    // additional properties
    expect(ajv.validate(schema, {
      splitChunks: {
        foo: 'bar',
      },
    })).toEqual(true);
  });

  it('html', () => {
    // object
    expect(ajv.validate(schema, {
      html: {},
    })).toEqual(true);
    // template only support .ejs extname
    expect(ajv.validate(schema, {
      html: {
        template: 'document.ejs',
      },
    })).toEqual(true);
    expect(ajv.validate(schema, {
      html: {
        template: 'document.html',
      },
    })).toEqual(false);
    // additional properties
    expect(ajv.validate(schema, {
      html: {
        foo: 'bar',
      },
    })).toEqual(true);
  });

  it('selectEntry', () => {
    // boolean
    expect(ajv.validate(schema, {
      selectEntry: true,
    })).toEqual(true);
    // object
    expect(ajv.validate(schema, {
      selectEntry: {},
    })).toEqual(true);
  });
});
