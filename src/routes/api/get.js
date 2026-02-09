// src/routes/api/get.js

const { createSuccessResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  logger.info('Handling GET /v1/fragments request');
  // For now, return an empty list of fragments
  res.status(200).json(
    createSuccessResponse({
      fragments: [],
    })
  );
};
