'use strict';

const fs = require('fs');
const path = require('path');

let share = process.argv.filter(a => a.startsWith('--custom-dir='))
  .map(a => a.split('=')[1])[0] || path.resolve(process.env.HOME, '.config');
if (share[0] === '~') {
  share = path.join(process.env.HOME, share.slice(1));
}
share = path.resolve(share);
console.log(' -> Root directory is', share);

function exists(directory, callback) {
  let root = '/';
  const dirs = directory.split('/');
  function one() {
    root = path.join(root, dirs.shift());
    fs.stat(root, e => {
      if (!e && dirs.length) {
        one();
      }
      else if (e && e.code === 'ENOENT') {
        fs.mkdir(root, e => {
          if (e) {
            callback(e);
          }
          else if (dirs.length) {
            one();
          }
          else {
            callback();
          }
        });
      }
      else {
        callback(e);
      }
    });
  }
  one();
}

const dir = path.join(share, 'com.add0n.node');
const name = 'com.add0n.node';
const ids = require('./config.js').ids;

function manifest(root, type) {
  console.log(' -> Creating a directory at', root);
  return new Promise((resolve, reject) => {
    exists(root, e => {
      if (e) {
        return reject(e);
      }

      let origins;
      if (type === 'chrome') {
        origins = '"allowed_origins": ' + JSON.stringify(ids.chrome.map(id => 'chrome-extension://' + id + '/'));
      }
      else {
        origins = '"allowed_extensions": ' + JSON.stringify(ids.firefox);
      }
      fs.writeFile(path.join(root, name + '.json'), `{
    "name": "${name}",
    "description": "Node Host for Native Messaging",
    "path": "${path.join(dir, 'run.sh')}",
    "type": "stdio",
    ${origins}
  }`, e => {
        if (e) {
          return reject(e);
        }
        resolve();
      });
    });
  });
}

function application(callback) {
  console.log(' -> Creating a directory at', dir);
  return new Promise((resolve, reject) => {
    exists(dir, e => {
      if (e) {
        console.log('\x1b[31m', `-> You dont have permission to use "${share}" directory.`, '\x1b[0m');
        console.log('\x1b[31m', '-> Use custom directory instead. Example:', '\x1b[0m');
        console.log('\x1b[31m', '-> ./install.sh --custom-dir=~/', '\x1b[0m');

        return reject(e);
      }

      const isNode = process.argv.filter(a => a === '--add_node').length === 0;
      const run = `#!/usr/bin/env bash\n${isNode ? process.argv[0] : './node'} host.js`;

      fs.writeFile(path.join(dir, 'run.sh'), run, e => {
        if (e) {
          return reject(e);
        }
        fs.chmodSync(path.join(dir, 'run.sh'), '0755');
        if (!isNode) {
          const stream = fs.createReadStream(process.argv[0]);
          stream.on('close', () => {
            fs.chmodSync(path.join(dir, 'node'), '0755');
          });
          stream.pipe(fs.createWriteStream(path.join(dir, 'node')));
        }
        fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
        fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
        fs.createReadStream('follow-redirects.js').pipe(fs.createWriteStream(path.join(dir, 'follow-redirects.js')));

        resolve();
      });
    });
  });
}

async function chrome() {
  if (ids.chrome.length) {
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Google/Chrome/NativeMessagingHosts'
    ), 'chrome');
    console.log(' -> Chrome Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Chromium/NativeMessagingHosts'
    ), 'chrome');
    console.log(' -> Chromium Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Vivaldi/NativeMessagingHosts'
    ), 'chrome');
    console.log(' -> Vivaldi Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts'
    ), 'chrome');
    console.log(' -> Brave Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Microsoft Edge/NativeMessagingHosts'
    ), 'chrome');
    console.log(' -> Microsoft Edge Browser is supported');
  }
}
async function firefox() {
  if (ids.firefox.length) {
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Mozilla/NativeMessagingHosts'
    ), 'firefox');
    console.log(' -> Firefox Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Waterfox/NativeMessagingHosts'
    ), 'firefox');
    console.log(' -> Waterfox Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/TorBrowser-Data/Browser/Mozilla/NativeMessagingHosts'
    ), 'firefox');
    console.log(' -> Tor Browser is supported');
    await manifest(path.join(
      process.env.HOME,
      'Library/Application Support/Thunderbird/NativeMessagingHosts'
    ), 'firefox');
    console.log(' -> Thunderbird Email Client is supported');
  }
}

(async () => {
  try {
    await chrome();
    await firefox();
    await application();
    console.log(' -> Native Host is installed in', dir);
    console.log('\n\n>>> host is ready <<<\n\n');
  }
  catch (e) {
    console.error(e);
    process.exit(-1);
  }
})();
