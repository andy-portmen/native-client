'use strict';

var fs = require('fs');
var path = require('path');

function exists (directory, callback) {
  fs.stat(directory, (e) => {

    if (e && e.code === 'ENOENT') {
      fs.mkdir(directory, callback);
    }
    else {
      callback(e);
    }
  });
}

var dir = path.join(process.argv[2], 'com.add0n.node');
var name = 'com.add0n.node';
var ids = require('./config.js').ids;

function manifest (type, callback) {
  exists(dir, (e) => {
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
    fs.writeFile(path.join(dir, 'manifest-' + type + '.json'), `{
  "name": "${name}",
  "description": "Node Host for Native Messaging",
  "path": "run.bat",
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
  fs.writeFile(path.join(dir, 'run.bat'), `@echo off\n\n"%~dp0node.exe" "%~dp0host.js"`, (e) => {
    if (e) {
      throw e;
    }
    fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
    fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
    fs.createReadStream('follow-redirects.js').pipe(fs.createWriteStream(path.join(dir, 'follow-redirects.js')));
    try {
      fs.createReadStream(process.argv[0]).pipe(fs.createWriteStream(path.join(dir, 'node.exe')));
    } catch (e) {}
    callback();
  });
}

function chrome (callback) {
  if (ids.chrome.length) {
    manifest('chrome', callback);
    console.error('.. Chrome Browser is supported');
  }
  else {
    callback();
  }
}
function firefox (callback) {
  if (ids.firefox.length) {
    manifest('firefox', callback);
    console.error('.. Firefox Browser is supported');
  }
  else {
    callback();
  }
}
chrome(() => firefox(() => {
  application(() => {
    console.error('.. Native Host is installed in', dir);
    console.error('\n\n>>> Application is ready to use <<<\n\n');
  });
}));
