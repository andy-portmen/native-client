/* globals require, process */
'use strict';

var fs = require('fs');
var path = require('path');

var share = process.argv.filter(a => a.startsWith('--custom-dir='))
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

var dir = path.join(share, 'com.add0n.node');
var name = 'com.add0n.node';
var ids = require('./config.js').ids;

function manifest(root, type, callback) {
  console.log(' -> Creating a directory at', root);
  exists(root, e => {
    if (e) {
      throw e;
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
      throw e;
    }
    callback();
  });
  });
}
function application(callback) {
  console.log(' -> Creating a directory at', dir);
  exists(dir, e => {
    if (e) {
      console.log('\x1b[31m', `-> You dont have permission to use "${share}" directory.`, '\x1b[0m');
      console.log('\x1b[31m', '-> Use custom directory instead. Example:', '\x1b[0m');
      console.log('\x1b[31m', '-> ./install.sh --custom-dir=~/', '\x1b[0m');

      throw e;
    }
    const isNode = process.argv.filter(a => a === '--add_node').length === 0;
    const run = `#!/usr/bin/env bash\n${isNode ? process.argv[0] : './node'} host.js`;
    fs.writeFile(path.join(dir, 'run.sh'), run, e => {
      if (e) {
        throw e;
      }
      fs.chmodSync(path.join(dir, 'run.sh'), '0755');
      if (!isNode) {
        fs.createReadStream(process.argv[0]).pipe(fs.createWriteStream(path.join(dir, 'node')));
        fs.chmodSync(path.join(dir, 'node'), '0755');
      }
      fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
      fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
      fs.createReadStream('follow-redirects.js').pipe(fs.createWriteStream(path.join(dir, 'follow-redirects.js')));
      callback();
    });
  });
}
function chrome(callback) {
  if (ids.chrome.length) {
    const loc = path.join(
      process.env.HOME,
      '.config/google-chrome/NativeMessagingHosts'
    );
    manifest(loc, 'chrome', callback);
    console.error(' -> Chrome Browser is supported');
  }
  else {
    callback();
  }
}
function chromium(callback) {
  if (ids.chrome.length) {
    const loc = path.join(
      process.env.HOME,
      '.config/chromium/NativeMessagingHosts'
    );
    manifest(loc, 'chrome', callback);
    console.error(' -> Chromium Browser is supported');
  }
  else {
    callback();
  }
}
function vivaldi(callback) {
  if (ids.chrome.length) {
    const loc = path.join(
      process.env.HOME,
      '.config/vivaldi/NativeMessagingHosts'
    );
    manifest(loc, 'chrome', callback);
    console.error(' -> Vivaldi Browser is supported');
  }
  else {
    callback();
  }
}
function firefox(callback) {
  if (ids.firefox.length) {
    const loc = path.join(
      process.env.HOME,
      '.mozilla/native-messaging-hosts'
    );
    manifest(loc, 'firefox', callback);
    console.error(' -> Firefox Browser is supported');
  }
  else {
    callback();
  }
}
chrome(() => chromium(() => vivaldi(() => firefox(() => {
  application(() => {
    console.error(' => Native Host is installed in', dir);
    console.error('\n\n>>> Application is ready to use <<<\n\n');
  });
}))));
