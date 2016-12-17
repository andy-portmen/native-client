'use strict';

var fs = require('fs');
var path = require('path');

function exists (directory, callback) {
  let root = '/';
  let dirs = directory.split('/');
  function one () {
    root = path.join(root, dirs.shift());
    fs.stat(root, (e) => {
      if (!e && dirs.length) {
        one();
      }
      else if (e && e.code === 'ENOENT') {
        fs.mkdir(root, (e) => {
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

var dir = path.join('/usr/share', 'com.add0n.node');
var name = 'com.add0n.node';
var ids = require('./config.js').ids;

function manifest (root, type, callback) {
  exists(root, (e) => {
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
  }`, (e) => {
      if (e) {
        throw e;
      }
      callback();
    });

  });
}
function application (callback) {
  exists(dir, (e) => {
    if (e) {
      throw e;
    }
    let isNode = process.argv[2] !== '--add_node';
    let run = isNode ? `#!/bin/bash\n${process.argv[2]} host.js` : '#!/bin/bash\n./node host.js';
    fs.writeFile(path.join(dir, 'run.sh'), run, (e) => {
      if (e) {
        throw e;
      }
      fs.chmodSync(path.join(dir, 'run.sh'), '0755');
      if (!isNode) {
        fs.createReadStream('../node').pipe(fs.createWriteStream(path.join(dir, 'node')));
        fs.chmodSync(path.join(dir, 'node'), '0755');
      }
      fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
      fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
      fs.createReadStream('follow-redirects.js').pipe(fs.createWriteStream(path.join(dir, 'follow-redirects.js')));
      callback();
    });
  });
}
function chrome (callback) {
  if (ids.chrome.length) {
    manifest('/etc/opt/chrome/native-messaging-hosts', 'chrome', callback);
    console.error('Chrome Browser is supported');
  }
  else {
    callback();
  }
}
function firefox (callback) {
  if (ids.firefox.length) {
    manifest('/usr/lib/mozilla/native-messaging-hosts', 'firefox', callback);
    console.error('Firefox Browser is supported');
  }
  else {
    callback();
  }
}
chrome(() => firefox(() => {
  application(() => {
    console.error('Native Host is installed in', dir);
    console.error('>> Application is ready to use <<');
  });
}));
