const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const { id } = req.params;

  logger.info(`Handling DELETE /v1/fragments/${id} request`);

  if (!ownerId) {
    logger.warn(`Unauthenticated DELETE request for fragment ${id}`);
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    // Get the fragment to verify it exists and belongs to the user
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      logger.warn(`Fragment not found: ${id} for user ${ownerId}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Delete the fragment
    await Fragment.delete(ownerId, id);
    logger.debug(`Fragment deleted: ${id}`);

    res.status(200).json(createSuccessResponse());
  } catch (error) {
    logger.error({ err: error }, `Error deleting fragment ${id}`);
    res.status(500).json(createErrorResponse(500, 'Unable to delete fragment'));
  }
};
