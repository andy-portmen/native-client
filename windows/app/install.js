'use strict';

const fs = require('fs');
const path = require('path');

function exists(directory, callback) {
  fs.stat(directory, e => {
    if (e && e.code === 'ENOENT') {
      fs.mkdir(directory, callback);
    }
    else {
      callback(e);
    }
  });
}

const dir = path.join(process.argv[2], 'com.add0n.node');
const name = 'com.add0n.node';
const ids = require('./config.js').ids;

function manifest(type) {
  return new Promise((resolve, reject) => {
    exists(dir, e => {
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
      fs.writeFile(path.join(dir, 'manifest-' + type + '.json'), `{
    "name": "${name}",
    "description": "Node Host for Native Messaging",
    "path": "run.bat",
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
function application() {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.join(dir, 'run.bat'), `@echo off\n\n"%~dp0node.exe" "%~dp0host.js"`, e => {
      if (e) {
        return reject(e);
      }
      fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
      fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
      fs.createReadStream('follow-redirects.js').pipe(fs.createWriteStream(path.join(dir, 'follow-redirects.js')));
      try {
        fs.createReadStream(process.argv[0]).pipe(fs.createWriteStream(path.join(dir, 'node.exe')));
      }
      catch (e) {}
      resolve();
    });
  });
}

async function chrome() {
  if (ids.chrome.length) {
    await manifest('chrome');
    console.log('.. Chrome Browser is supported');
  }
}
async function firefox() {
  if (ids.firefox.length) {
    await manifest('firefox');
    console.log('.. Firefox Browser is supported');
  }
}

(async () => {
  try {
    await chrome();
    await firefox();
    await application();
    console.log('.. Native Host is installed in', dir);
    console.log('\n\n>>> host is ready <<<\n\n');
  }
  catch (e) {
    console.error(e);
    process.exit(-1);
  }
})();
