/* globals global, require, process, Buffer */
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

var spawn = require('child_process').spawn;
var fs = lazyRequire('fs');
var net = lazyRequire('net');
var os = lazyRequire('os');
var path = lazyRequire('path');
var http = lazyRequire('./follow-redirects').http;
var https = lazyRequire('./follow-redirects').https;

var server;
var files = [];
var sprocess = [];

var config = {
  version: '0.4.4'
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
  try {
    server.close();
    server.unref();
  }
  catch (e) {}
  process.exit();
});

/////////////////process.on('uncaughtException', e => console.error(e));

function observe(msg, push, done) {
  if (msg.cmd === 'version') {
    push({
      version: config.version,
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
  else if (msg.cmd === 'ifup') {
    server = http.createServer(function(req, res) {
      if (req.headers['api-key'] !== msg.key) {
        res.statusCode = 400;
        return res.end('HTTP/1.1 400 Bad API Key. Restarting application may fix this.');
      }
      if (req.method === 'PUT') {
        let filename = req.headers['file-path'];
        if (filename.startsWith('enc:')) {
          filename = decodeURIComponent(filename.substr(4));
        }
        files.push(filename);
        const file = fs.createWriteStream(filename);
        req.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            res.statusCode = 200;
            res.end('File is stored locally');
          });
        });
        file.on('error', e => {
          console.error(e);
          res.statusCode = 400;
          res.end('HTTP/1.1 400 Bad Request');
        });
      }
    });
    server.on('error', e => {
      push({
        error: e.message,
        code: 1006
      });
      done();
    });
    server.listen(msg.port, () => {
      push({
        code: 0,
        msg: 'Server listening on: http://localhost:' + msg.port
      });
      done();
    });
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
    sp.stdout.on('data', data => stdout += data);
    sp.stderr.on('data', data => stderr += data);
    sp.on('close', code => {
      push({
        code,
        stderr,
        stdout
      });
      done();
    });
  }
  else if (msg.cmd === 'dir') {
    const files = [];
    const folders = [];
    const walk = (dir, depth = 0) => {
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          folders.push(file);
          if (depth < msg.depth) {
            return walk(file, depth + 1);
          }
        }
        else {
          files.push(file);
        }
      });
      return;
    };
    if (msg.recursive) {
      try {
        walk(msg.path);
        const rtn = {
          code: 0,
          folders,
          separator: path.sep
        };
        if (msg.files) {
          rtn.files = files;
        }
        push(rtn);
      }
      catch (e) {
        push({
          error: e.message,
          code: 1003
        });
      }
      done();
    }
    else {
      fs.readdir(msg.path, (error, files) => {
        if (error) {
          push({
            error: `Cannot open directory; number=${error.errno}, code=${error.code}`,
            code: 1002
          });
        }
        else {
          push({
            files,
            folders: files.filter(file => fs.statSync(path.join(msg.path, file)).isDirectory()),
            separator: path.sep
          });
        }
        done();
      });
    }
  }
  else if (msg.cmd === 'env') {
    push({
      env: process.env
    });
    done();
  }
  else if (msg.cmd === 'download') {
    const file = fs.createWriteStream(msg.filepath);
    const request = https.get({
      hostname: msg.hostname,
      port: msg.port,
      path: msg.path
    }, response => {
      const size = parseInt(response.headers['content-length']);
      response.pipe(file);
      file.on('finish', () => {
        if (msg.chmod) {
          fs.chmodSync(msg.filepath, msg.chmod);
        }
        file.close(() => {
          const s = fs.statSync(msg.filepath).size;
          push({
            size,
            path: msg.filepath,
            code: s === size ? 0 : 1004,
            error: s !== size ? `file-size (${s}) does not match the header content-length (${size}).
              Link: ${msg.hostname}/${msg.path}` : null
          });
          done();
        });
      });
    });
    request.on('error', err => {
      fs.unlink(msg.filepath);
      push({
        error: err.message,
        code: 1001
      });
      done();
    });
    request.on('socket', function(socket) {
      socket.setTimeout(msg.timeout || 60000);
      socket.on('timeout', () => request.abort());
    });
  }
  else if (msg.cmd === 'save-data') {
    const matches = msg.data.match(/^data:.+\/(.+);base64,(.*)$/);
    if (matches && matches.length) {
      const ext = matches[1];
      const data = matches[2];
      const buffer = new Buffer(data, 'base64');

      fs.mkdtemp(os.tmpdir(), (err, folder) => {
        if (err) {
          push({
            error: err.message,
            code: 1007
          });
          done();
        }
        const file = path.join(folder, 'image.' + ext);
        fs.writeFile(file, buffer, err => {
          if (err) {
            push({
              error: err.message,
              code: 1006
            });
            done();
          }
          else {
            push({
              code: 0,
              file
            });
            done();
          }
        });
      });
    }
    else {
      push({
        error: 'cannot parse data-uri',
        code: 1005
      });
      done();
    }
  }
  else if (msg.cmd === 'net') {
    let stdout = '';
    const connection = net.connect({
      port: msg.port,
      host: msg.host,
      persistent: false
    });
    connection.on('end', () => {
      push(stdout);
      done();
    });
    connection.on('data', data => {
      data = data.toString();
      stdout += data;
    });
    msg.commands.forEach(cmd => connection.write(cmd));
  }
  else if (msg.cmd === 'copy') {
    let cbCalled = false;
    const end = error => {
      if (cbCalled === false) {
        push(error ? {
          error,
          code: 1010
        } : {
          code: 0,
          target: msg.target
        });
        done();
        cbCalled = true;
      }
    };
    const rd = fs.createReadStream(msg.source);
    rd.on('error', e => end(e));
    const wr = fs.createWriteStream(msg.target);
    wr.on('error', e => end(e));
    wr.on('finish', () => {
      if (msg.chmod) {
        fs.chmodSync(msg.target, msg.chmod);
      }
      if (msg.delete) {
        fs.unlink(msg.source, error => {
          if (error) {
            return end(error);
          }
          end();
        });
      }
      else {
        end();
      }
    });
    rd.pipe(wr);
  }
  else if (msg.cmd === 'remove') {
    const unlink = file => new Promise((resolve, reject) => {
      fs.unlink(file, error => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
    Promise.all(msg.files.map(file => unlink(file))).then(
      () => {
        push({
          code: 0
        });
        done();
      },
      error => {
        push({
          error,
          code: 1011
        });
        done();
      }
    );
  }
  else if (msg.cmd === 'move') {
    const one = () => {
      const obj = msg.pairs.shift();
      if (obj) {
        let destination = obj.destination;
        if (msg.guess) {
          destination = path.join(destination, path.parse(obj.file).base);
        }
        const is = fs.createReadStream(obj.file);
        const os = fs.createWriteStream(destination);
        is.on('end', () => {
          fs.unlinkSync(obj.file);
          one();
        });
        is.on('error', error => {
          push({
            error,
            code: 1020
          });
          done();
        });
        is.pipe(os);
      }
      else {
        push({
          code: 0
        });
        done();
      }
    };
    one();
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
var nativeMessage = require('./messaging');

var input = new nativeMessage.Input();
var transform = new nativeMessage.Transform(observe);
var output = new nativeMessage.Output();

process.stdin
    .pipe(input)
    .pipe(transform)
    .pipe(output)
    .pipe(process.stdout);
