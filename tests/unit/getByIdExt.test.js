const request = require('supertest');
const express = require('express');
const api = require('../../src/routes/api');

describe('GET /v1/fragments/:id.ext', () => {
  const authedApp = express();
  const unauthedApp = express();

  authedApp.use((req, res, next) => {
    req.user = 'user123';
    next();
  });

  authedApp.use('/v1', api);
  unauthedApp.use('/v1', api);

  test('unauthenticated requests are denied', async () => {
    const res = await request(unauthedApp).get('/v1/fragments/abc123.html');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(authedApp).get('/v1/fragments/does-not-exist.html');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  // Markdown to HTML conversion tests
  test('can convert markdown fragment to HTML', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Hello World');

    const fragmentId = postRes.body.fragment.id;

    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.html`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1>Hello World</h1>');
  });

  test('markdown conversion includes proper HTML structure', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Title\n\nParagraph with **bold** and *italic*');

    const fragmentId = postRes.body.fragment.id;

    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.html`);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('<h1>Title</h1>');
    expect(res.text).toContain('<strong>bold</strong>');
    expect(res.text).toContain('<em>italic</em>');
  });

  test('returns 415 when trying to convert non-markdown to html', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Just plain text');

    const fragmentId = postRes.body.fragment.id;

    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.html`);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // Plain text conversion tests (identity conversion for text types)
  test('can get text/plain fragment as .txt', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Plain text content');

    const fragmentId = postRes.body.fragment.id;

    // Get as .txt
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.txt`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toBe('Plain text content');
  });

  test('can convert markdown to .txt', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Title\n\nContent');

    const fragmentId = postRes.body.fragment.id;

    // Convert to .txt
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.txt`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });

  test('returns 415 when trying to convert JSON to txt', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ key: 'value' }));

    const fragmentId = postRes.body.fragment.id;

    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.txt`);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // Markdown extension tests
  test('can get markdown fragment as .md', async () => {
    // Create a markdown fragment
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown\n\n## Subtitle');

    const fragmentId = postRes.body.fragment.id;

    // Get as .md
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.md`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/markdown/);
    expect(res.text).toContain('# Markdown');
  });

  test('returns 415 when trying to get non-markdown as .md', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Plain text');

    const fragmentId = postRes.body.fragment.id;

    // Try to get as .md (should fail)
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.md`);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // JSON extension tests
  test('can get JSON fragment as .json', async () => {
    const jsonData = { name: 'test', value: 123 };

    // Create a JSON fragment
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    const fragmentId = postRes.body.fragment.id;

    // Get as .json
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.json`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(jsonData);
  });

  test('returns 415 when trying to get non-JSON as .json', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown');

    const fragmentId = postRes.body.fragment.id;

    // Try to get as .json (should fail)
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.json`);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // Unsupported extension tests
  test('returns 415 for unsupported file extensions', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Content');

    const fragmentId = postRes.body.fragment.id;

    // Try with unsupported extension
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.pdf`);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('returns 415 for .xml extension', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Content');

    const fragmentId = postRes.body.fragment.id;

    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.xml`);

    expect(res.statusCode).toBe(415);
  });

  // Different users test
  test('user can only retrieve their own fragments with extensions', async () => {
    // Create fragment with user123
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Secret');

    const fragmentId = postRes.body.fragment.id;

    // Create app for different user
    const otherUserApp = express();
    otherUserApp.use((req, res, next) => {
      req.user = 'user456';
      next();
    });
    otherUserApp.use('/v1', api);

    // Try to access with different user
    const res = await request(otherUserApp).get(`/v1/fragments/${fragmentId}.html`);

    expect(res.statusCode).toBe(404);
  });

  // Content-Type verification tests
  test('markdown to HTML returns correct content-type', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# Test');

    const fragmentId = postRes.body.fragment.id;
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.html`);

    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  test('text/plain returns correct content-type for .txt', async () => {
    const postRes = await request(authedApp)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Test');

    const fragmentId = postRes.body.fragment.id;
    const res = await request(authedApp).get(`/v1/fragments/${fragmentId}.txt`);

    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });
});
