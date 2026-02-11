const request = require('supertest');
const express = require('express');
const api = require('../../src/routes/api');
const { describe } = require('node:test');

describe('POST /v1/fragments', () => {
  const authedApp = express();

  authedApp.use((req, res, next) => {
    req.user = 'user123';
    next();
  });

  authedApp.use('/v1', api);

  const unauthedApp = express();

  unauthedApp.use('/v1', api);

  test('unauthenticated requests are denied', async () => {
    const res = await request(unauthedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello, World!');
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('authenticated user can create a text/plain fragment', async () => {
    const res = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello, World!');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const fragment = res.body.fragment;
    expect(fragment).toBeDefined();
    expect(fragment.id).toBeDefined();
    expect(fragment.ownerId).toBe('user123');
    expect(fragment.type).toBe('text/plain');
  });

  test('response includes location header with URL to access the fragment', async () => {
    const res = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello, World!');

    expect(res.header.location).toMatch(/\/v1\/fragments\/.+/);
  });

  test('unsupported types are rejected', async () => {
    const res = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'application/xml')
      .send('{"key": "value"}');

    expect(res.statusCode).toBe(415);
  });

  test('Invalid Content-Type header is rejected', async () => {
    const res = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'invalid/content-type')
      .send('{"key": "value"}');

    expect(res.statusCode).toBe(415);
  });

  test('request body must be a Buffer', async () => {
    const res = await request(authedApp)
      .post('/v1/fragments')
      .send(JSON.stringify({ not: 'a buffer' }));

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });
});
