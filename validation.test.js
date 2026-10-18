const test = require('node:test');
const assert = require('node:assert');
const { validateVideo } = require('./validation');

const MAX = 20 * 60;

test('aceita vídeo normal dentro do limite', () => {
  const result = validateVideo({ isLiveContent: false, lengthSeconds: '300' }, MAX);
  assert.strictEqual(result.ok, true);
});

test('rejeita transmissão ao vivo', () => {
  const result = validateVideo({ isLiveContent: true, lengthSeconds: '100' }, MAX);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /vivo/);
});

test('rejeita vídeo acima do limite de duração', () => {
  const result = validateVideo({ isLiveContent: false, lengthSeconds: '1500' }, MAX);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /minutos/);
});

test('aceita vídeo exatamente no limite', () => {
  const result = validateVideo({ isLiveContent: false, lengthSeconds: String(MAX) }, MAX);
  assert.strictEqual(result.ok, true);
});
