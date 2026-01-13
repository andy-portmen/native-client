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
  version: '1.0.7'
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

// Helper function to wrap flatpak commands
// Detects Flatpak app IDs (contain dots, e.g., ru.yandex.Browser, com.google.Chrome)
function wrapFlatpakCommand(command, args) {
  if (command.includes('.') && fs.existsSync('/usr/bin/flatpak-spawn')) {
    return {
      command: 'flatpak-spawn',
      args: ['--host', 'flatpak', 'run', command].concat(args)
    };
  }
  return {command, args};
}

function observe(msg, push, done) {
  if (msg.cmd === 'version') {
    push({
      version: config.version
    });
    done();
  }
  if (msg.cmd === 'spec') {
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

    let p = Array.isArray(msg.command) ? path.join(...msg.command) : msg.command;
    let args = msg.arguments || [];

    // Auto-detect flatpak apps and wrap with flatpak-spawn --host
    const wrapped = wrapFlatpakCommand(p, args);
    p = wrapped.command;
    args = wrapped.args;

    const sp = spawn(p, args, Object.assign({env: process.env}, msg.properties));

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

    let p = Array.isArray(msg.command) ? path.join(...msg.command) : msg.command;
    let args = msg.arguments || [];

    // Auto-detect flatpak apps and wrap with flatpak-spawn --host
    const wrapped = wrapFlatpakCommand(p, args);
    p = wrapped.command;
    args = wrapped.args;

    const sp = spawn(p, args, Object.assign({
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
    let error = 'This version of the native client does not support "' + msg.cmd + '" command. Check for updates...';
    // Display warning about old unsupported commands
    if (['ifup', 'dir', 'save-data', 'net', 'copy', 'remove', 'move'].includes(msg.cmd)) {
      error = 'The "' + msg.cmd + '" command is no longer supported in this version of the native client. ' +
        'Downgrade to version 0.9.7 if your extension requires this command.';
    }
    push({
      error,
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
