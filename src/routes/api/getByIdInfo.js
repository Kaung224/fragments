// src/routes/api/getByIdInfo.js
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const id = req.params.id;

  logger.info(`Handling GET /v1/fragments/${id}/info request`);

  if (!ownerId) {
    logger.warn('Unauthenticated GET request for fragments');
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    const fragment = await Fragment.byId(ownerId, id);

    return res.status(200).json(
      createSuccessResponse({
        fragment,
      })
    );
  } catch (err) {
    logger.warn({ err }, `Error getting fragment info for id ${id}`);
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
};
