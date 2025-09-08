'use strict';

function lazyRequire(lib, name) {
  if (!name) {
    name = lib;
  }
  global.__defineGetter__(name, function() {
    return require(lib);
  });
  return global[name];
}

const spawn = require('child_process').spawn;
const fs = lazyRequire('fs');
const os = lazyRequire('os');
const path = lazyRequire('path');

let files = [];
const sprocess = [];

const config = {
  version: '1.0.4'
};
// closing node when parent process is killed
process.stdin.resume();
process.stdin.on('end', () => {
  files.forEach(file => {
    try {
      fs.unlink(file);
    }
    catch (e) {}
  });
  sprocess.forEach(ps => ps.kill());

  process.exit();
});

// process.on('uncaughtException', e => console.error(e));

function observe(msg, push, done) {
  if (msg.cmd === 'version') {
    push({
      version: config.version
    });
    done();
  }
  else if (msg.cmd === 'spec') {
    push({
      version: config.version,
      env: process.env,
      separator: path.sep,
      tmpdir: os.tmpdir()
    });
    done();
  }
  else if (msg.cmd === 'echo') {
    push(msg);
    done();
  }
  else if (msg.cmd === 'spawn') {
    if (msg.env) {
      msg.env.forEach(n => process.env.PATH += path.delimiter + n);
    }
    const p = Array.isArray(msg.command) ? path.join(...msg.command) : msg.command;
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
  else if (msg.cmd === 'clean-tmp') {
    files.forEach(file => {
      try {
        fs.unlink(file);
      }
      catch (e) {}
    });
    files = [];
    push({
      code: 0
    });
    done();
  }
  else if (msg.cmd === 'exec') {
    if (msg.env) {
      msg.env.forEach(n => process.env.PATH += path.delimiter + n);
    }
    const p = Array.isArray(msg.command) ? path.join(...msg.command) : msg.command;
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
  else if (msg.cmd === 'env') {
    push({
      env: process.env
    });
    done();
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
      done();
      close = () => {};
    };
    process.addListener('uncaughtException', exception);

    const vm = require('vm');
    const sandbox = {
      version: config.version,
      env: process.env,
      push,
      close,
      setTimeout,
      args: msg.args,
      // only allow internal modules that extension already requested permission for
      require: name => (msg.permissions || []).indexOf(name) === -1 ? null : require(name)
    };
    const script = new vm.Script(msg.script);
    const context = vm.createContext(sandbox);
    script.runInContext(context);
  }
  else {
    push({
      error: 'cmd is unknown',
      cmd: msg.cmd,
      code: 1000
    });
    done();
  }
}
/* message passing */
const nativeMessage = require('./messaging');

const input = new nativeMessage.Input();
const transform = new nativeMessage.Transform(observe);
const output = new nativeMessage.Output();

process.stdin
  .pipe(input)
  .pipe(transform)
  .pipe(output)
  .pipe(process.stdout);
