import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../source/Twos.popclipext/', import.meta.url);
const config = JSON.parse(fs.readFileSync(new URL('Config.json', root), 'utf8'));
const source = fs.readFileSync(new URL(config.javaScriptFile, root), 'utf8');
for (const field of ['name', 'identifier', 'description']) {
  assert.equal(typeof config[field], 'string');
  assert.ok(config[field].trim());
}
assert.match(config.identifier, /^[A-Za-z0-9.-]+$/);
assert.ok(!config.identifier.startsWith('com.pilotmoon.'));
assert.ok(Number.isInteger(config.popclipVersion) && config.popclipVersion > 0);
assert.equal(config.app.name, 'Twos');
assert.equal(config.app.link, 'https://www.twosapp.com/');
assert.equal(typeof config.keywords, 'string');
assert.equal(config.shellScript, undefined);
assert.equal(config.shellScriptFile, undefined);
function packageFiles(folder, prefix = '') {
  return fs.readdirSync(folder, {withFileTypes: true}).flatMap(entry => {
    const name = prefix + entry.name;
    return entry.isDirectory()
      ? packageFiles(new URL(entry.name + '/', folder), name + '/')
      : [name];
  });
}
const files = packageFiles(root);
assert.ok(files.length <= 100);
let totalBytes = 0;
for (const name of files) {
  const path = new URL(name, root);
  const bytes = fs.readFileSync(path);
  assert.ok(bytes.length <= 1048576);
  if (!name.startsWith('_images/') && name !== 'demo.mp4') assert.ok(!bytes.includes(0), 'Executable source must be readable');
  totalBytes += bytes.length;
}
assert.ok(totalBytes <= 2097152);
assert.ok(files.includes('LICENSE') && files.includes('README.md'));
assert.match(fs.readFileSync(new URL('../../popclip-directory.yaml', root), 'utf8'), /include: "source\/Twos\.popclipext"\nversionPrefix: v/);
assert.ok(fs.existsSync(new URL('../../LICENSE', root)));
assert.deepEqual(config.entitlements, ['network']);
assert.equal(config.after, 'show-status');
assert.equal(config.options.find(o => o.identifier === 'apikey').type, 'secret');
const picker = config.options.find(o => o.identifier === 'destination');
assert.equal(picker.defaultValue, 'today');
assert.equal(picker.allowOther, true);
const fakeKey = 'twos_TEST_KEY_NOT_REAL';
const sample = '  “Hello” ✌️ 中文\nA & B? #tag + 100% / \\ "quote"\n$(never execute) `literal`  ';

async function run(options = {}, text = sample, response = {status: 201, data: {thing: {id: 'saved-id'}}}, networkError = false) {
  const calls = [];
  const context = {
    popclip: {input: {text}, options: {apikey: fakeKey, ...options}},
    require(name) {
      assert.equal(name, 'axios');
      return {async post(...args) {
        // Round-trip through JSON, as the real HTTP client does.
        calls.push(JSON.parse(JSON.stringify(args)));
        assert.equal(args[2].validateStatus(401), true);
        if (networkError) throw new Error('sensitive transport details ' + fakeKey);
        return response;
      }};
    },
  };
  let error;
  try { await vm.runInNewContext(`(async () => {\n${source}\n})()`, context); }
  catch (e) { error = e; }
  if (error) assert.ok(!error.message.includes(fakeKey));
  return {calls, error};
}

let count = 0;
for (const destination of [undefined, 'today', 'Work notes', '  Work notes  ', '明天 & ideas', 'tomorrow', 'yesterday', '2026-11-10', '64f0c2a1e4b0a1234567890a']) {
  const result = await run({destination});
  assert.equal(result.error, undefined);
  assert.equal(result.calls.length, 1);
  const [url, body, request] = result.calls[0];
  assert.equal(url, 'https://www.twosapp.com/api/v1/things');
  assert.equal(body.text, sample);
  const target = (destination ?? 'today').trim();
  if (/^[a-f0-9]{24}$/i.test(target)) {
    assert.equal(body.list_id, target);
    assert.equal(body.list, undefined);
  } else {
    assert.equal(body.list, target);
    assert.equal(body.list_id, undefined);
  }
  assert.equal(request.headers.Authorization, 'Bearer ' + fakeKey);
  assert.equal(request.timeout, 20000);
  count++;
}
for (const [options, text] of [[{apikey: ''}, sample], [{apikey: '  '}, sample], [{destination: ''}, sample], [{destination: ' '}, sample], [{}, ' \n\t']]) {
  const result = await run(options, text);
  assert.ok(result.error);
  assert.equal(result.calls.length, 0);
  count++;
}
for (const status of [400, 401, 403, 404, 429, 500, 302, 200]) {
  const result = await run({}, sample, {status, data: {error: 'do not expose ' + fakeKey}});
  assert.ok(result.error);
  assert.equal(result.calls.length, 1);
  if ([400, 401, 403, 404].includes(status)) assert.match(result.error.message, /^Settings error:/);
  count++;
}
for (const response of [{status: 201, data: {}}, {status: 201, data: '<html>'}]) {
  const result = await run({}, sample, response);
  assert.match(result.error.message, /Check Twos before trying again/);
  assert.equal(result.calls.length, 1);
  count++;
}
const offline = await run({}, sample, undefined, true);
assert.match(offline.error.message, /Check Twos before trying again/);
assert.equal(offline.calls.length, 1);
count++;
console.log(`Passed ${count} mocked capture scenarios plus configuration checks. No live account data was changed.`);
