'use strict';

const fs = require('fs');
const path = require('path');

let share = process.argv.filter(a => a.startsWith('--custom-dir='))
  .map(a => a.split('=')[1])[0] || path.resolve(process.env.HOME, '.config');
if (share[0] === '~') {
  share = path.join(process.env.HOME, share.slice(1));
}
share = path.resolve(share);
console.log(' -> Browser configuration directory is', '\x1b[32m' + share +'\x1b[0m\n');

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
const config = require('./config.js');

function manifest(root, type) {
  console.log(' -> Creating a directory at "' + root + '"');
  return new Promise((resolve, reject) => {
    exists(root, e => {
      if (e) {
        return reject(e);
      }

      const m = {
        name,
        description: config.description,
        path: path.join(dir, 'run.sh'),
        type: 'stdio'
      };
      if (type === 'chrome') {
        m.allowed_origins = config.ids.chrome.map(id => 'chrome-extension://' + id + '/');
      }
      else {
        m.allowed_extensions = config.ids.firefox;
      }

      fs.writeFile(path.join(root, name + '.json'), JSON.stringify(m, undefined, '  '), e => {
        if (e) {
          return reject(e);
        }
        resolve();
      });
    });
  });
}

function application(callback) {
  console.log('\n -> Application directory is', '\x1b[32m' + dir +'\x1b[0m');
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

        resolve();
      });
    });
  });
}

const support = (name, type = 'browser', e) => {
  if (e) {
    console.log(' -> \x1b[1m' + name + '\x1b[0m ' + type + ' is NOT supported - ' + e.message);
  }
  else {
    console.log(' -> \x1b[1m' + name + '\x1b[0m ' + type + ' is supported');
  }
};

async function chrome() {
  if (config.ids.chrome.length) {
    const LAS = 'Library/Application Support';
    await manifest(path.join(process.env.HOME, LAS, 'Google/Chrome/NativeMessagingHosts'), 'chrome')
      .then(() => support('Chrome')).catch(e => support('Chrome', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'Chromium/NativeMessagingHosts'), 'chrome')
      .then(() => support('Chromium')).catch(e => support('Chromium', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'Vivaldi/NativeMessagingHosts'), 'chrome')
      .then(() => support('Vivaldi')).catch(e => support('Vivaldi', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'BraveSoftware/Brave-Browser/NativeMessagingHosts'), 'chrome')
      .then(() => support('Brave')).catch(e => support('Brave', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'Microsoft Edge/NativeMessagingHosts'), 'chrome')
      .then(() => support('Microsoft Edge')).catch(e => support('Microsoft Edge', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'Comet/NativeMessagingHosts'), 'chrome')
      .then(() => support('Perplexity Comet')).catch(e => support('Perplexity Comet', 'browser', e));
  }
}
async function firefox() {
  if (config.ids.firefox.length) {
    const LAS = 'Library/Application Support';
    await manifest(path.join(process.env.HOME, LAS, 'Mozilla/NativeMessagingHosts'), 'firefox')
      .then(() => support('Firefox')).catch(e => support('Firefox', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'Waterfox/NativeMessagingHosts'), 'firefox')
      .then(() => support('Waterfox')).catch(e => support('Waterfox', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'TorBrowser-Data/Browser/Mozilla/NativeMessagingHosts'), 'firefox')
      .then(() => support('Tor')).catch(e => support('Tor', 'browser', e));
    await manifest(path.join(process.env.HOME, LAS, 'Thunderbird/NativeMessagingHosts'), 'firefox')
      .then(() => support('Thunderbird', 'email client')).catch(e => support('Thunderbird', 'email client', e));
  }
}

(async () => {
  try {
    await chrome();
    await firefox();
    await application();
    console.log('\n\n\x1b[1m>>> Native host is ready <<<\x1b[0m\n');
  }
  catch (e) {
    console.error(e);
    process.exit(-1);
  }
})();
