'use strict';

// Deprecated commands
const DEPRECATED = ['ifup', 'dir', 'save-data', 'net', 'copy', 'remove', 'move', 'clean-tmp', 'echo', 'version'];

const sprocess = [];
const sessions = {};

const config = {
  version: '1.1.3'
};
// closing node when parent process is killed
process.stdin.resume();
process.stdin.on('end', () => {
  for (const ps of sprocess) {
    try {
      ps.kill();
    }
    catch (e) {}
  }

  process.exit();
});

// process.on('uncaughtException', e => console.error(e));

function observe(msg, push, done) {
  if (msg.cmd === 'spec') {
    const os = require('os');
    const path = require('path');
    push({
      version: config.version,
      env: process.env,
      separator: path.sep,
      tmpdir: os.tmpdir()
    });
    done();
  }
  else if (msg.cmd === 'env') {
    push({
      env: process.env
    });
    done();
  }
  else if (msg.cmd === 'spawn') {
    const path = require('path');
    if (msg.env) {
      msg.env.forEach(n => process.env.PATH += path.delimiter + n);
    }
    const p = Array.isArray(msg.command) ? path.join(...msg.command) : msg.command;
    const spawn = require('child_process').spawn;
    const sp = spawn(p, msg.arguments || [], Object.assign({env: process.env}, msg.properties));

    if (msg.kill) {
      sprocess.push(sp);
    }

    sp.stdout.on('data', stdout => push({stdout}));
    sp.stderr.on('data', stderr => push({stderr}));
    sp.on('close', code => {
      push({
        cmd: msg.cmd,
        code
      });
      done();
    });
    sp.on('error', e => {
      push({
        code: 1007,
        error: e.message
      });
      done();
    });
    if (Array.isArray(msg.stdin)) {
      msg.stdin.forEach(c => sp.stdin.write(c));
      sp.stdin.end();
    }
  }
  else if (msg.cmd === 'exec') {
    const path = require('path');
    if (msg.env) {
      msg.env.forEach(n => process.env.PATH += path.delimiter + n);
    }
    const p = Array.isArray(msg.command) ? path.join(...msg.command) : msg.command;
    const spawn = require('child_process').spawn;
    const sp = spawn(p, msg.arguments || [], Object.assign({
      env: process.env,
      detached: true
    }, msg.properties));
    if (msg.kill) {
      sprocess.push(sp);
    }
    let stderr = '';
    let stdout = '';
    if (sp.stdout) {
      sp.stdout.on('data', data => stdout += data);
    }
    if (sp.stderr) {
      sp.stderr.on('data', data => stderr += data);
    }
    sp.on('close', code => {
      push({
        code,
        stderr,
        stdout
      });
      done();
    });
    if (sp.stdin) {
      if (Array.isArray(msg.stdin)) {
        msg.stdin.forEach(c => sp.stdin.write(c));
        sp.stdin.end();
      }
    }
    if (msg.unref) {
      sp.unref();
    }
  }
  // this is from openstyles/native-client
  else if ('script' in msg) {
    let close;
    const exception = e => {
      push({
        code: -1,
        type: 'exception',
        error: e.stack
      });
      close();
    };
    close = () => {
      process.removeListener('uncaughtException', exception);
      if (msg.uuid) {
        delete sessions[msg.uuid];
      }
      close = () => {};
    };
    process.addListener('uncaughtException', exception);

    const vm = require('vm');
    // only install observer if there is a uuid
    if (msg.uuid) {
      sessions[msg.uuid] = [];
    }
    const sandbox = {
      version: config.version,
      env: process.env,
      push,
      close,
      setTimeout,
      args: msg.args,
      // only allow internal modules that extension already requested permission for
      require: name => (msg.permissions || []).includes(name) ? require(name) : null,
      // install a new session listener
      connect: handle => sessions[msg.uuid].push(handle)
    };
    try {
      const script = new vm.Script(msg.script);
      const context = vm.createContext(sandbox);
      script.runInContext(context);
    }
    catch (e) {
      push({
        code: -1001,
        type: 'exception',
        error: e.message
      });
      close();
    }
    // release the message pipeline; the script context stays alive to receive post-messages
    done();
  }
  // communicate with sandboxed sessions later
  else if (msg.cmd === 'post-message') {
    if (msg.uuid in sessions) {
      if (sessions[msg.uuid]) {
        for (const f of sessions[msg.uuid]) {
          try {
            f(msg.data);
          }
          catch (e) {
            push({
              code: -1002,
              type: 'exception',
              error: e.message
            });
          }
        }
        push({
          type: 'report',
          sent: sessions[msg.uuid].length
        });
      }
      else {
        push({
          code: -1003,
          type: 'exception',
          error: 'no session with "' + msg.uuid + '" id'
        });
      }
    }
    else {
      push({
        code: -1004,
        type: 'exception',
        error: 'no listener of this uuid'
      });
    }
    done();
  }
  else {
    // Display warning about old unsupported commands
    if (DEPRECATED.includes(msg.cmd)) {
      const error = 'The "' + msg.cmd + '" command is no longer supported in this version of the native client. ' +
        'Downgrade to version 0.9.7 if your extension requires this command.';
      push({
        error,
        cmd: msg.cmd,
        code: -1005
      });
    }
    else {
      const error = 'This version of the native client does not support "' + msg.cmd + '" command. ' +
        'Check for updates...';
      push({
        error,
        cmd: msg.cmd,
        code: -1006
      });
    }
    done();
  }
}
/* message passing */
const {Input, Transform, Output} = require('./messaging');

process.stdin
  .pipe(new Input())
  .pipe(new Transform(observe))
  .pipe(new Output())
  .pipe(process.stdout);
