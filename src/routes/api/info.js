const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const { id } = req.params;

  logger.info(`Handling GET /v1/fragments/${id}/info request`);

  if (!ownerId) {
    logger.warn(`Unauthenticated GET request for fragment ${id}/info`);
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    // Get the fragment metadata
    const fragment = await Fragment.byId(ownerId, id);

    logger.debug(`Fragment info retrieved: ${id}`);
    res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
  } catch (error) {
    if (error.message.includes('not found')) {
      logger.warn(`Fragment not found: ${id} for user ${ownerId}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err: error }, `Error getting fragment info ${id}`);
    res.status(500).json(createErrorResponse(500, 'Unable to get fragment'));
  }
};
