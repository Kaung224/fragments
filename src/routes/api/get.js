// src/routes/api/get.js

const { createSuccessResponse } = require('../../response');

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // For now, return an empty list of fragments
  res.status(200).json(
    createSuccessResponse({
      fragments: [],
    })
  );
};
