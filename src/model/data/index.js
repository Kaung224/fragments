const logger = require('../../logger');

const { AWS_REGION } = process.env;

if (!AWS_REGION) {
  logger.warn('No AWS_REGION environment variable set. Using MemoryDB vs. AWS storage');
}

module.exports = AWS_REGION ? require('./aws') : require('./memory');
