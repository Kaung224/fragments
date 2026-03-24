const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info('Handling POST /v1/fragments request');

  const ownerId = req.user;
  if (!ownerId) {
    logger.warn('Unauthenticated request to POST /v1/fragments');
    return res.status(401).json({
      status: 'error',
      message: 'unauthenticated',
    });
  }

  if (!Buffer.isBuffer(req.body)) {
    logger.warn('POST /v1/fragments body is not a Buffer');
    return res.status(415).json({
      status: 'error',
      message: 'Bad Request: missing body',
    });
  }

  let rawType, parsed, type;

  try {
    rawType = req.get('Content-Type');
    parsed = contentType.parse(rawType);
    type = parsed.type; // stripped version for validation
    logger.debug(`Parsed Content-Type: ${rawType}`);
  } catch (err) {
    logger.warn(`Failed to parse Content-Type header: ${err.message}`);
    return res.status(415).json({
      status: 'error',
      message: 'Invalid Content-Type header',
    });
  }

  if (!Fragment.isSupportedType(type)) {
    logger.warn(`Unsupported Content-Type: ${rawType}`);
    return res.status(415).json({
      status: 'error',
      message: `Unsupported Type: ${rawType}`,
    });
  }

  const fragment = new Fragment({
    ownerId,
    type: rawType, // store full type including charset
    size: req.body.length,
  });

  try {
    await fragment.save();
    await fragment.setData(req.body);
    logger.info(`Fragment created with id=${fragment.id} for user=${ownerId}`);
  } catch (err) {
    logger.error(`Failed to save fragment: ${err.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save fragment',
    });
  }

  const base = process.env.API_URL || `http://${req.headers.host}`;
  const location = new URL(`/v1/fragments/${fragment.id}`, base).toString();

  logger.debug(`Setting Location header to: ${location}`);

  res.setHeader('Location', location);

  return res.status(201).json({
    status: 'ok',
    fragment: {
      id: fragment.id,
      ownerId: fragment.ownerId,
      type: fragment.type,
      size: fragment.size,
      created: fragment.created,
      updated: fragment.updated,
    },
  });
};
