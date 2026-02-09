const { describe } = require('node:test');
const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
} = require('../../src/model/data/index');

describe('Memory Data', () => {
  const ownerId = 'user123';
  const fragment = {
    id: 'frag1',
    ownerId,
    type: 'text/plain',
    size: 18,
  };

  const dataBuffer = Buffer.from('This is fragment data');

  beforeEach(async () => {
    const { metadata, data } = require('../../src/model/data/index');
    metadata.db = {};
    data.db = {};
  });

  test('writeFragment() stores fragment metadata And readFragment() returns the fragment metadata', async () => {
    await writeFragment(fragment);
    const result = await readFragment(ownerId, fragment.id);

    expect(result).toBeDefined();
    expect(result.id).toEqual(fragment.id);
    expect(result.ownerId).toEqual(ownerId);
    expect(result.type).toEqual('text/plain');
  });

  test('readFragment() returns undefined for missing id', async () => {
    const result = await readFragment(ownerId, 'invalid-id');
    expect(result).toBeUndefined();
  });

  test('writeFragmentData() stores fragment data And readFragmentData() returns the fragment data', async () => {
    await writeFragmentData(ownerId, fragment.id, dataBuffer);
    const result = await readFragmentData(ownerId, fragment.id);

    expect(result.toString()).toBe('This is fragment data');
  });

  test('readFragmentData() returns undefined for missing id', async () => {
    const result = await readFragmentData(ownerId, 'invalid-id');
    expect(result).toBeUndefined();
  });
});
