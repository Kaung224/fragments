// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  const ownerId = req.user;
  
  logger.info('Handling GET /v1/fragments request');

  if (!ownerId) {
    logger.warn('Unauthenticated GET request for fragments');
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    // Check if user wants expanded fragment data
    const expand = req.query.expand === '1';
    
    // Get fragments for this user
    const fragments = await Fragment.byUser(ownerId, expand);
    
    logger.debug(`Found ${fragments.length} fragments for user ${ownerId}`);
    
    res.status(200).json(
      createSuccessResponse({
        fragments: fragments,
      })
    );
  } catch (error) {
    logger.error({ err: error }, 'Error getting fragments');
    res.status(500).json(createErrorResponse(500, 'Unable to get fragments'));
  }
};
