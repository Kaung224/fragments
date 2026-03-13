const request = require('supertest');
const express = require('express');
const api = require('../../src/routes/api');

describe('DELETE /v1/fragments/:id', () => {
  const authedApp = express();
  const unauthedApp = express();

  authedApp.use((req, res, next) => {
    req.user = 'user123';
    next();
  });

  authedApp.use('/v1', api);
  unauthedApp.use('/v1', api);

  test('unauthenticated requests are denied', async () => {
    const res = await request(unauthedApp).delete('/v1/fragments/abc123');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(authedApp).delete('/v1/fragments/does-not-exist');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('authenticated user can delete an existing fragment', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello, World!');

    const fragmentId = postRes.body.fragment.id;

    const deleteRes = await request(authedApp).delete(`/v1/fragments/${fragmentId}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');
  });

  test('cannot access fragment after deletion', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('To be deleted');

    const fragmentId = postRes.body.fragment.id;

    await request(authedApp).delete(`/v1/fragments/${fragmentId}`);

    const getRes = await request(authedApp).get(`/v1/fragments/${fragmentId}`);

    expect(getRes.statusCode).toBe(404);
  });

  test('cannot delete fragment twice', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Test delete twice');

    const fragmentId = postRes.body.fragment.id;

    const firstDelete = await request(authedApp).delete(`/v1/fragments/${fragmentId}`);
    expect(firstDelete.statusCode).toBe(200);

    const secondDelete = await request(authedApp).delete(`/v1/fragments/${fragmentId}`);
    expect(secondDelete.statusCode).toBe(404);
  });

  test('user can only delete their own fragments', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Secret fragment');

    const fragmentId = postRes.body.fragment.id;

    const otherUserApp = express();
    otherUserApp.use((req, res, next) => {
      req.user = 'user456';
      next();
    });
    otherUserApp.use('/v1', api);

    const deleteRes = await request(otherUserApp).delete(`/v1/fragments/${fragmentId}`);

    expect(deleteRes.statusCode).toBe(404);
  });
});
