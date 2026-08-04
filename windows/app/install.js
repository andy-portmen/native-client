'use strict';

const fs = require('fs');
const path = require('path');

process.chdir(__dirname);

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

const name = 'com.add0n.node';
const dir = path.join(process.argv[2], name);

const config = require(path.join(__dirname, 'config.js'));

function manifest(type) {
  return new Promise((resolve, reject) => {
    exists(dir, e => {
      if (e) {
        return reject(e);
      }
      const m = {
        name,
        description: config.description,
        path: 'run.bat',
        type: 'stdio'
      };
      if (type === 'chrome') {
        m.allowed_origins = config.ids.chrome.map(id => 'chrome-extension://' + id + '/');
      }
      else {
        m.allowed_extensions = config.ids.firefox;
      }
      fs.writeFile(path.join(dir, 'manifest-' + type + '.json'), JSON.stringify(m, undefined, '  '), e => {
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
    // do we use global nodejs
    const copyNode = process.argv[0].includes('Program Files') === false;

    fs.writeFile(path.join(dir, 'run.bat'), `@echo off

${copyNode ? '"%~dp0node.exe"' : 'node.exe'} "%~dp0host.js"`, e => {
      if (e) {
        return reject(e);
      }
      fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
      fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
      if (copyNode) {
        try {
          fs.createReadStream(process.argv[0]).pipe(fs.createWriteStream(path.join(dir, 'node.exe')));
        }
        catch (e) {
          console.error('Cannot copy NodeJS', e);
        }
      }
      resolve();
    });
  });
}

async function chrome() {
  if (config.ids.chrome.length) {
    await manifest('chrome');
    console.log('.. Chrome Browser is supported');
  }
}
async function firefox() {
  if (config.ids.firefox.length) {
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
  }
  catch (e) {
    console.error(e);
    process.exit(-1);
  }
})();
