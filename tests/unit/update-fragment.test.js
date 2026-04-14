const request = require('supertest');
const express = require('express');
const api = require('../../src/routes/api');

describe('PUT /v1/fragments/:id', () => {
  const authedApp = express();
  const unauthedApp = express();

  authedApp.use((req, res, next) => {
    req.user = 'user123';
    next();
  });

  authedApp.use('/v1', api);
  unauthedApp.use('/v1', api);

  test('unauthenticated requests are denied', async () => {
    const res = await request(unauthedApp)
      .put('/v1/fragments/abc123')
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(authedApp)
      .put('/v1/fragments/does-not-exist')
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('authenticated user can update an existing fragment', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    const putRes = await request(authedApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');
    expect(putRes.body.fragment.id).toBe(fragmentId);
  });

  test('updated fragment has correct size', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Short');

    const fragmentId = postRes.body.fragment.id;

    const updatedBody = 'This is much longer updated content';
    const putRes = await request(authedApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send(updatedBody);

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.fragment.size).toBe(Buffer.byteLength(updatedBody));
  });

  test('updated fragment has a newer updated timestamp', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original');

    const fragmentId = postRes.body.fragment.id;
    const originalUpdated = postRes.body.fragment.updated;

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const putRes = await request(authedApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Updated');

    expect(new Date(putRes.body.fragment.updated).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdated).getTime()
    );
  });

  test('returns 400 when Content-Type does not match existing fragment type', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    const putRes = await request(authedApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/markdown')
      .send('# Updated content');

    expect(putRes.statusCode).toBe(400);
    expect(putRes.body.status).toBe('error');
  });

  test('returns 415 for unsupported Content-Type', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    const putRes = await request(authedApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'application/x-unsupported')
      .send('some data');

    expect(putRes.statusCode).toBe(415);
    expect(putRes.body.status).toBe('error');
  });

  test('updated content can be retrieved after update', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Original content');

    const fragmentId = postRes.body.fragment.id;

    await request(authedApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    const getRes = await request(authedApp).get(`/v1/fragments/${fragmentId}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('Updated content');
  });

  test('user cannot update another user fragment', async () => {
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

    const putRes = await request(otherUserApp)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', 'text/plain')
      .send('Hacked content');

    expect(putRes.statusCode).toBe(404);
    expect(putRes.body.status).toBe('error');
  });
});
