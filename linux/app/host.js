'use strict';

var spawn = require('child_process').spawn;

var config = {
  version: '0.1.0',
  isWin: /^win/.test(process.platform)
};

function observe (msg, push, done) {
  if (msg.cmd === 'version') {
    push({
      version: config.version
    });
    done();
  }
  else if (msg.cmd === 'echo') {
    push(msg);
    done();
  }
  else if (msg.cmd === 'spawn') {
    let sp = spawn(msg.command, msg.arguments);
    sp.stdout.on('data', stdout => push({stdout}));
    sp.stderr.on('data', stderr => push({stderr}));
    sp.on('close', (code) => {
      push({code});
      done();
    });
  }
  else if (msg.cmd === 'exec') {
    let sp = spawn(msg.command, msg.arguments);
    let stderr = '', stdout = '';
    sp.stdout.on('data', data => stdout += data);
    sp.stderr.on('data', data => stderr += data);
    sp.on('close', (code) => {
      push({
        code,
        stderr,
        stdout
      });
      done();
    });
  }
  else if (msg.cmd === 'env') {
    push({
      env: process.env
    });
    done();
  }
  else {
    push({
      error: 'cmd is unknown',
      cmd: msg.cmd
    });
    done();
  }
}
/* message passing */
var nativeMessage = require('./messaging');

var input = new nativeMessage.Input();
var transform = new nativeMessage.Transform(observe);
var output = new nativeMessage.Output();

process.stdin
    .pipe(input)
    .pipe(transform)
    .pipe(output)
    .pipe(process.stdout);
