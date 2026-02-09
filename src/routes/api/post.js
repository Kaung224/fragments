const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');

module.exports = async (req, res) => {
  const ownerId = req.user;
  if (!ownerId) {
    return res.status(401).json({
      status: 'error',
      message: 'unauthenticated',
    });
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(415).json({
      status: 'error',
      message: 'Bad Request: missing body',
    });
  }

  let type;
  try {
    type = contentType.parse(req).type;
  } catch {
    return res.status(415).json({
      status: 'error',
      message: 'Invalid Content-Type header',
    });
  }

  if (!Fragment.isSupportedType(type)) {
    return res.status(415).json({
      status: 'error',
      message: `Unsupported Type: ${type}`,
    });
  }

  const fragment = new Fragment({
    ownerId,
    type,
    size: req.body.length,
  });

  await fragment.save();
  await fragment.setData(req.body);

  const base = process.env.API_URL || `http://${req.headers.host}`;
  const location = new URL(`/v1/fragments/${fragment.id}`, base).toString();

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
