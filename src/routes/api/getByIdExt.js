const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

let markdownIt;
try {
  markdownIt = require('markdown-it')({ html: true, linkify: true, typographer: true });
} catch (err) {
  logger.warn('markdown-it not available: ' + err.message);
}

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  logger.warn('sharp not available: ' + err.message);
}

// Map extensions to mime types
const EXT_TO_MIME = {
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

module.exports = async (req, res) => {
  const ownerId = req.user;
  const id = req.params[0];
  const ext = req.params[1];

  logger.info(`Handling GET /v1/fragments/${id}.${ext} request`);

  if (!ownerId) {
    return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
  }

  try {
    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    if (!data) {
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    // Strip charset from fragment type for comparison
    const fragType = fragment.type.split(';')[0].trim();
    const targetMime = EXT_TO_MIME[ext];

    if (!targetMime) {
      return res.status(415).json(createErrorResponse(415, `Unsupported extension: .${ext}`));
    }

    let convertedData = data;
    let outputType = targetMime;

    // ── Image conversions ──
    if (IMAGE_TYPES.includes(fragType)) {
      if (!IMAGE_TYPES.includes(targetMime)) {
        return res
          .status(415)
          .json(createErrorResponse(415, `Cannot convert ${fragType} to ${targetMime}`));
      }
      if (!sharp) {
        return res
          .status(500)
          .json(createErrorResponse(500, 'Image conversion not available (sharp missing)'));
      }
      // If same type, just return as-is
      if (fragType === targetMime) {
        convertedData = data;
      } else {
        const format = ext === 'jpg' ? 'jpeg' : ext;
        convertedData = await sharp(data).toFormat(format).toBuffer();
      }

      // ── Text conversions ──
    } else if (ext === 'html') {
      if (fragType !== 'text/markdown') {
        return res
          .status(415)
          .json(createErrorResponse(415, `Cannot convert ${fragType} to text/html`));
      }
      if (!markdownIt) {
        return res.status(500).json(createErrorResponse(500, 'markdown-it not available'));
      }
      convertedData = markdownIt.render(data.toString());
    } else if (ext === 'txt') {
      if (!['text/plain', 'text/markdown', 'text/html'].includes(fragType)) {
        return res
          .status(415)
          .json(createErrorResponse(415, `Cannot convert ${fragType} to text/plain`));
      }
      convertedData = data;
    } else if (ext === 'md') {
      if (fragType !== 'text/markdown') {
        return res
          .status(415)
          .json(createErrorResponse(415, `Fragment is ${fragType}, not text/markdown`));
      }
    } else if (ext === 'json') {
      if (fragType !== 'application/json') {
        return res
          .status(415)
          .json(createErrorResponse(415, `Fragment is ${fragType}, not application/json`));
      }
    } else {
      return res
        .status(415)
        .json(createErrorResponse(415, `Unsupported conversion extension: .${ext}`));
    }

    logger.debug(`Fragment ${id} converted to ${outputType}`);
    res.setHeader('Content-Type', outputType);
    res.status(200).send(convertedData);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err: error }, `Error getting fragment ${id} with extension ${ext}`);
    res.status(500).json(createErrorResponse(500, 'Unable to get fragment'));
  }
};
