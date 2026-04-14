const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info('Handling PUT /v1/fragments/:id request');

  const ownerId = req.user;
  const { id } = req.params;

  if (!ownerId) {
    logger.warn('Unauthenticated request to PUT /v1/fragments/:id');
    return res.status(401).json({
      status: 'error',
      message: 'unauthenticated',
    });
  }

  if (!Buffer.isBuffer(req.body)) {
    logger.warn('PUT /v1/fragments/:id body is not a Buffer');
    return res.status(415).json({
      status: 'error',
      message: 'Bad Request: missing body',
    });
  }

  let rawType, parsed, type;

  try {
    rawType = req.get('Content-Type');
    parsed = contentType.parse(rawType);
    type = parsed.type; // stripped version for validation
    logger.debug(`Parsed Content-Type: ${rawType}`);
  } catch (err) {
    logger.warn(`Failed to parse Content-Type header: ${err.message}`);
    return res.status(415).json({
      status: 'error',
      message: 'Invalid Content-Type header',
    });
  }

  if (!Fragment.isSupportedType(type)) {
    logger.warn(`Unsupported Content-Type: ${rawType}`);
    return res.status(415).json({
      status: 'error',
      message: `Unsupported Type: ${rawType}`,
    });
  }

  logger.debug(`Owner ID: ${ownerId}`);
  logger.debug(`Fragment ID: ${id}`);
  logger.info(`[PUT DEBUG] Attempting to find fragment - ownerId: ${ownerId}, id: ${id}`);

  let fragment; // Declare fragment outside the try block

  try {
    fragment = await Fragment.byId(ownerId, id);

    if (!fragment) {
      logger.warn(`Fragment with ID ${id} not found for owner ${ownerId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Fragment not found',
      });
    }
  } catch (err) {
    if (err.message.includes('not found')) {
      logger.warn(`Fragment with ID ${id} not found for owner ${ownerId}: ${err.message}`);
      return res.status(404).json({
        status: 'error',
        message: 'Fragment not found',
      });
    }
    logger.error(`Error fetching fragment by ID: ${err.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }

  logger.debug(`Fragment found: ${JSON.stringify(fragment.toJSON())}`);

  try {
    logger.debug(`Request Body Type: ${typeof req.body}`);
    logger.debug(`Request Body Size: ${req.body.length}`);
    logger.debug(`Content-Type Header: ${rawType}`);

    // Update the fragment's type
    fragment.type = rawType;

    // Before saving the fragment
    logger.debug(`Preparing to save fragment with ID: ${id}`);
    logger.debug(`New Fragment Type: ${rawType}`);
    logger.debug(`New Fragment Data Size: ${req.body.length}`);

    // Save metadata first, then data (like in post.js)
    await fragment.save();
    await fragment.setData(req.body);

    logger.debug(`Fragment updated successfully: ${JSON.stringify(fragment.toJSON())}`);

    res.status(200).json({
      status: 'ok',
      fragment: fragment.toJSON(),
    });
  } catch (err) {
    logger.error(`Error updating fragment: ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};
