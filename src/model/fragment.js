// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) {
      throw new Error('ownerId is required');
    }
    if (!type || !Fragment.isSupportedType(type)) {
      throw new Error(`invalid or unsupported type: ${type}`);
    }

    if (size < 0 || typeof size !== 'number' || !Number.isInteger(size)) {
      throw new Error(`size must be a non-negative integer, got ${size}`);
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    // TODO
    const results = await listFragments(ownerId, expand);

    if (!results) {
      return [];
    }

    if (!expand) {
      return results;
    }

    return results.map((fragment) => {
      if (typeof fragment === 'string') {
        fragment = JSON.parse(fragment);
      }

      return new Fragment(fragment);
    });
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    // TODO
    // TIP: make sure you properly re-create a full Fragment instance after getting from db.
    const data = await readFragment(ownerId, id);
    if (!data) {
      throw new Error(`fragment not found for id=${id}`);
    }
    return new Fragment(data);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    // TODO
    return deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  save() {
    // TODO
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    // TODO
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    // TODO
    // TIP: make sure you update the metadata whenever you change the data, so they match
    if (!Buffer.isBuffer(data)) {
      throw new Error('data must be a Buffer');
    }

    this.size = data.length;
    this.updated = new Date().toISOString();

    await writeFragmentData(this.ownerId, this.id, data);
    return this.save();
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    // TODO
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // TODO
    const base = this.mimeType;
    if (base === 'text/plain') {
      return ['text/plain'];
    } else if (base === 'text/html') {
      return ['text/html', 'text/plain'];
    } else if (base === 'text/markdown') {
      return ['text/markdown', 'text/html', 'text/plain'];
    } else if (base === 'application/json') {
      return ['application/json'];
    } else if (base === 'image/jpeg') {
      return ['image/jpeg', 'image/png', 'image/webp'];
    } else if (base === 'image/png') {
      return ['image/png', 'image/jpeg', 'image/webp'];
    } else {
      return [base];
    }
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    // TODO
    const { type } = contentType.parse(value);

    const supportedTypes = [
      'text/plain',
      'text/html',
      'text/markdown',
      'application/json',
      'image/jpeg',
      'image/png',
    ];

    return supportedTypes.includes(type);
  }
}

module.exports.Fragment = Fragment;
