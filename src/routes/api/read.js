const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const { id } = req.params;

  logger.info(`Handling GET /v1/fragments/${id} request`);

  if (!ownerId) {
    logger.warn(`Unauthenticated GET request for fragment ${id}`);
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    // Get the fragment
    const fragment = await Fragment.byId(ownerId, id);

    // Get the fragment data
    const data = await fragment.getData();
    if (!data) {
      logger.warn(`Fragment data not found: ${id}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    logger.debug(`Fragment retrieved: ${id}`);
    res.status(200);
    res.setHeader('Content-Type', fragment.type);
    res.send(data);
  } catch (error) {
    if (error.message.includes('not found')) {
      logger.warn(`Fragment not found: ${id} for user ${ownerId}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err: error }, `Error getting fragment ${id}`);
    res.status(500).json(createErrorResponse(500, 'Unable to get fragment'));
  }
};
