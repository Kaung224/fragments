// src/routes/api/getByIdExt.js
const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

// Support markdown-it for markdown to HTML conversion
let markdownIt;
try {
  markdownIt = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true,
  });
} catch (err) {
  logger.warn('markdown-it not available: ' + err.message);
}

module.exports = async (req, res) => {
  const ownerId = req.user;
  const id = req.params[0];
  const ext = req.params[1];

  logger.debug(`ownerId: ${JSON.stringify(ownerId)}`);
  logger.debug(`parsed id: ${id}`);
  logger.debug(`parsed ext: ${ext}`);

  logger.info(`Handling GET /v1/fragments/${id}.${ext} request`);

  if (!ownerId) {
    logger.warn(`Unauthenticated GET request for fragment ${id} with extension ${ext}`);
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    const fragment = await Fragment.byId(ownerId, id);
    logger.debug(`Fragment retrieved: ${id}, type: ${fragment.type}`);

    let data = await fragment.getData();
    if (!data) {
      logger.warn(`Fragment data not found: ${id}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    let outputType;
    let convertedData = data;

    if (ext === 'html') {
      if (fragment.type === 'text/markdown') {
        logger.debug(`Converting markdown fragment ${id} to HTML`);
        if (!markdownIt) {
          logger.error('markdown-it not available for conversion');
          return res.status(500).json(createErrorResponse(500, 'markdown-it not available'));
        }
        convertedData = markdownIt.render(data.toString());
        outputType = 'text/html';
      } else {
        logger.warn(`Fragment ${id} is not markdown type, cannot convert to HTML`);
        return res
          .status(415)
          .json(createErrorResponse(415, `Cannot convert ${fragment.type} to text/html`));
      }
    } else if (ext === 'txt') {
      if (
        fragment.type === 'text/plain' ||
        fragment.type === 'text/markdown' ||
        fragment.type === 'text/html'
      ) {
        outputType = 'text/plain';
        convertedData = data;
      } else {
        return res
          .status(415)
          .json(createErrorResponse(415, `Cannot convert ${fragment.type} to text/plain`));
      }
    } else if (ext === 'md') {
      if (fragment.type === 'text/markdown') {
        outputType = 'text/markdown';
        convertedData = data;
      } else {
        return res
          .status(415)
          .json(createErrorResponse(415, `Fragment is ${fragment.type}, not text/markdown`));
      }
    } else if (ext === 'json') {
      if (fragment.type === 'application/json') {
        outputType = 'application/json';
        convertedData = data;
      } else {
        return res
          .status(415)
          .json(createErrorResponse(415, `Fragment is ${fragment.type}, not application/json`));
      }
    } else {
      return res
        .status(415)
        .json(createErrorResponse(415, `Unsupported conversion extension: .${ext}`));
    }

    logger.debug(`Fragment ${id} converted to ${outputType}`);
    res.status(200);
    res.setHeader('Content-Type', outputType);
    res.send(convertedData);
  } catch (error) {
    if (error.message.includes('not found')) {
      logger.warn(`Fragment not found: ${id} for user ${ownerId}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err: error }, `Error getting fragment ${id} with extension ${ext}`);
    res.status(500).json(createErrorResponse(500, 'Unable to get fragment'));
  }
};
