const request = require('supertest');
const express = require('express');
const api = require('../../src/routes/api');

describe('GET /v1/fragments/:id', () => {
  const authedApp = express();
  const unauthedApp = express();

  authedApp.use((req, res, next) => {
    req.user = 'user123';
    next();
  });

  authedApp.use('/v1', api);
  unauthedApp.use('/v1', api);

  test('unauthenticated requests are denied', async () => {
    const res = await request(unauthedApp).get('/v1/fragments/abc');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(authedApp).get('/v1/fragments/does-not-exist');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('returns fragment data and correct Content-Type', async () => {
    // First create a fragment
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello Read Test');

    const fragmentId = postRes.body.fragment.id;

    // Now read the fragment
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toBe('Hello Read Test');
  });
});
