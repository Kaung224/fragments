const request = require('supertest');
const express = require('express');
const api = require('../../src/routes/api');

describe('GET /v1/fragments/:id/info', () => {
  const authedApp = express();
  const unauthedApp = express();

  authedApp.use((req, res, next) => {
    req.user = 'user123';
    next();
  });

  authedApp.use('/v1', api);
  unauthedApp.use('/v1', api);

  test('unauthenticated requests are denied', async () => {
    const res = await request(unauthedApp).get('/v1/fragments/abc/info');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(authedApp).get('/v1/fragments/does-not-exist/info');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('returns fragment metadata when fragment exists', async () => {
    // First create a fragment
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('hello');

    const fragmentId = postRes.body.fragment.id;

    // Now fetch its info
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}/info`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');

    const fragment = res.body.fragment;
    expect(fragment.id).toBe(fragmentId);
    expect(fragment.ownerId).toBe('user123');
    expect(fragment.type).toBe('text/plain');
    expect(fragment.size).toBe(5);
  });
});
