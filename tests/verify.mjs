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
  if (!name.startsWith('_images/') && name !== 'demo.mp4' && name !== config.icon) assert.ok(!bytes.includes(0), 'Executable source must be readable');
  totalBytes += bytes.length;
}
assert.ok(totalBytes <= 2097152);
assert.ok(files.includes('LICENSE') && files.includes('README.md'));
assert.ok(files.includes(config.icon), 'The configured file icon must be included in the package');
assert.match(fs.readFileSync(new URL('../../popclip-directory.yaml', root), 'utf8'), /include: "source\/Twos\.popclipext"\nversionPrefix: v/);
assert.ok(fs.existsSync(new URL('../../LICENSE', root)));
assert.deepEqual(config.entitlements, ['network']);
assert.equal(config.after, 'show-status');
assert.equal(config.options.find(o => o.identifier === 'apikey').type, 'secret');
const picker = config.options.find(o => o.identifier === 'destination');
assert.equal(picker.defaultValue, 'today');
assert.equal(picker.allowOther, true);
const typePicker = config.options.find(o => o.identifier === 'thingtype');
assert.deepEqual(typePicker.values, ['dash', 'todo', 'bullet', 'number', 'none', 'sublist']);
assert.deepEqual(typePicker.valueLabels, ['Dash', 'To-do', 'Bullet', 'Number', 'Note', 'Sublist']);
assert.equal(typePicker.defaultValue, 'dash');
assert.equal(config.options.find(o => o.identifier === 'defaulttag').type, 'string');
assert.equal(config.options.find(o => o.identifier === 'defaulttag').defaultValue, '');
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
        return typeof response === 'function' ? response(args, calls.length) : response;
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
  assert.equal(body.type, 'dash');
  assert.equal(body.tags, undefined);
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

for (const type of ['dash', 'todo', 'bullet', 'number', 'none']) {
  const result = await run({thingtype: type});
  assert.equal(result.error, undefined);
  assert.equal(result.calls.length, 1);
  assert.equal(result.calls[0][1].type, type);
  assert.equal(result.calls[0][1].text, sample);
  count++;
}
for (const [input, expected] of [['reading', '#reading'], ['#reading', '#reading'], [' ##reading ', '#reading'], ['# reading', '#reading'], ['项目', '#项目'], ['cafe\u0301', '#café'], ['project_1-test', '#project_1-test']]) {
  const result = await run({defaulttag: input}, 'Capture');
  assert.equal(result.error, undefined);
  assert.equal(result.calls[0][1].text, 'Capture ' + expected);
  assert.deepEqual(result.calls[0][1].tags, [expected]);
  count++;
}
for (const input of ['', '  ']) {
  const result = await run({defaulttag: input});
  assert.equal(result.error, undefined);
  assert.equal(result.calls[0][1].text, sample);
  assert.equal(result.calls[0][1].tags, undefined);
  count++;
}
for (const input of ['#', '###', 'two words', 'work,home', 'work#home', 'work/notes']) {
  const result = await run({defaulttag: input});
  assert.match(result.error.message, /^Settings error:/);
  assert.equal(result.calls.length, 0);
  count++;
}
for (const type of ['', 'photo', 'unknown']) {
  const result = await run({thingtype: type});
  assert.match(result.error.message, /^Settings error:/);
  assert.equal(result.calls.length, 0);
  count++;
}
for (const text of ['Capture #Work', 'Capture (#work)', '#work, capture']) {
  const result = await run({defaulttag: '#work'}, text);
  assert.equal(result.error, undefined);
  assert.equal(result.calls[0][1].text, text);
  assert.deepEqual(result.calls[0][1].tags, ['#work']);
  count++;
}
for (const text of ['Capture https://example.org/#work', 'Capture #work-other', 'Capture word#work']) {
  const result = await run({defaulttag: 'work'}, text);
  assert.equal(result.error, undefined);
  assert.equal(result.calls[0][1].text, text + ' #work');
  count++;
}
const preservedTags = await run({defaulttag: 'capture'}, 'Capture #source');
assert.deepEqual(preservedTags.calls[0][1].tags, ['#source', '#capture']);
count++;
const trailingLineBreak = await run({defaulttag: 'work'}, 'Capture\n');
assert.equal(trailingLineBreak.calls[0][1].text, 'Capture\n#work');
count++;

const childId = '64f0c2a1e4b0a1234567890d';
const listResponse = {status: 201, data: {list: {id: childId}}};
const thingResponse = {status: 201, data: {thing: {id: 'saved-id'}}};
for (const destination of ['today', 'Projects', '64f0c2a1e4b0a1234567890a']) {
  for (const defaulttag of ['', 'travel']) {
    const result = await run({thingtype: 'sublist', destination, defaulttag}, '  Book\n the trip  ', (_args, index) => index === 1 ? listResponse : thingResponse);
    assert.equal(result.error, undefined);
    assert.equal(result.calls.length, 2);
    assert.equal(result.calls[0][0], 'https://www.twosapp.com/api/v1/lists');
    const title = defaulttag ? 'Book the trip #travel' : 'Book the trip';
    assert.deepEqual(result.calls[0][1], {title});
    const [url, body] = result.calls[1];
    assert.equal(url, 'https://www.twosapp.com/api/v1/things');
    assert.equal(body.list_ref, childId);
    assert.equal(body.text, title);
    assert.equal(body.type, undefined, 'Native sublist type comes from the referenced list');
    assert.equal(body.list ?? body.list_id, destination);
    assert.deepEqual(body.tags, defaulttag ? ['#travel'] : undefined);
    count++;
  }
}
for (const response of [
  {status: 401, data: {}}, {status: 403, data: {}}, {status: 400, data: {}},
  {status: 429, data: {}}, {status: 500, data: {}}, {status: 201, data: {}},
  {status: 201, data: {list: {id: 123}}},
]) {
  const result = await run({thingtype: 'sublist'}, 'A new list', response);
  assert.ok(result.error);
  assert.equal(result.calls.length, 1, 'Do not link an unconfirmed new list');
  if (response.status === 403) assert.match(result.error.message, /write:lists/);
  count++;
}
for (const response of [
  {status: 400, data: {}}, {status: 401, data: {}}, {status: 403, data: {}},
  {status: 404, data: {}}, {status: 429, data: {}}, {status: 500, data: {}},
  {status: 201, data: {}},
]) {
  const result = await run({thingtype: 'sublist'}, 'A new list', (_args, index) => index === 1 ? listResponse : response);
  assert.match(result.error.message, /new sublist was created/);
  assert.equal(result.calls.length, 2, 'Do not retry or delete after partial completion');
  if (response.status === 403) assert.match(result.error.message, /write:things/);
  count++;
}
for (const failAt of [1, 2]) {
  const result = await run({thingtype: 'sublist'}, 'A new list', (_args, index) => {
    if (index === failAt) throw new Error('private transport details ' + fakeKey);
    return listResponse;
  });
  assert.ok(result.error);
  assert.equal(result.calls.length, failAt);
  if (failAt === 2) assert.match(result.error.message, /new sublist was created/);
  count++;
}
console.log(`Passed ${count} mocked capture scenarios plus configuration checks. No live account data was changed.`);
