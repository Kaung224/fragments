const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info('Handling PUT /v1/fragments/:id request');

  const ownerId = req.user;
  const { id } = req.params;

  if (!ownerId) {
    logger.warn('Unauthenticated request to PUT /v1/fragments/:id');
    return res.status(401).json({ status: 'error', message: 'unauthenticated' });
  }

  if (!Buffer.isBuffer(req.body)) {
    logger.warn('PUT /v1/fragments/:id body is not a Buffer');
    return res.status(415).json({ status: 'error', message: 'Bad Request: missing body' });
  }

  let rawType, type;
  try {
    rawType = req.get('Content-Type');
    type = contentType.parse(rawType).type;
  } catch {
    return res.status(415).json({ status: 'error', message: 'Invalid Content-Type header' });
  }

  if (!Fragment.isSupportedType(type)) {
    return res.status(415).json({ status: 'error', message: `Unsupported Type: ${rawType}` });
  }

  let fragment;
  try {
    fragment = await Fragment.byId(ownerId, id);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ status: 'error', message: 'Fragment not found' });
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }

  const existingType = contentType.parse(fragment.type).type;
  if (type !== existingType) {
    logger.warn(`Content-Type mismatch: request=${type}, fragment=${existingType}`);
    return res.status(400).json({
      status: 'error',
      message: `Content-Type mismatch: fragment is ${fragment.type}, got ${rawType}`,
    });
  }

  try {
    fragment.size = req.body.length;

    await fragment.save();
    await fragment.setData(req.body);

    logger.debug(`Fragment updated successfully: ${JSON.stringify(fragment.toJSON())}`);
    res.status(200).json({ status: 'ok', fragment: fragment.toJSON() });
  } catch (err) {
    logger.error(`Error updating fragment: ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
