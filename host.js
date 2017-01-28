'use strict';

function lazyRequire (lib, name) {
  if (!name) {
    name = lib;
  }
  global.__defineGetter__(name, function () {
    return require(lib);
  });
  return global[name];
}

var spawn = require('child_process').spawn;
var fs = lazyRequire('fs');
var os = lazyRequire('os');
var path = lazyRequire('path');
var http = lazyRequire('./follow-redirects').http;
var https = lazyRequire('./follow-redirects').https;

var server, files = [];

var config = {
  version: '0.2.3'
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
  try {
    server.close();
    server.unref();
  }
  catch (e) {}
  process.exit();
});

/////////////////process.on('uncaughtException', e => console.error(e));

function observe (msg, push, done) {
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
    let sp = spawn(msg.command, msg.arguments || [], Object.assign({env: process.env}, msg.properties));
    sp.stdout.on('data', stdout => push({stdout}));
    sp.stderr.on('data', stderr => push({stderr}));
    sp.on('close', (code) => {
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
    server = http.createServer(function (req, res) {
      if (req.headers['api-key'] !== msg.key) {
        res.statusCode = 400;
        return res.end('HTTP/1.1 400 Bad API Key. Restarting application may fix this.');
      }
      if (req.method === 'PUT') {
        let filename = req.headers['file-path'];
        files.push(filename);
        let file = fs.createWriteStream(filename);
        req.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            res.statusCode = 200;
            res.end('File is stored locally');
          });
        });
        file.on('error', (e) => {
          console.error(e);
          res.statusCode = 400;
          res.end('HTTP/1.1 400 Bad Request');
        });
      }
    });
    server.on('error', (e) => {
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
    let sp = spawn(msg.command, msg.arguments || [], Object.assign({
      env: process.env,
      detached: true
    }, msg.properties));
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
  else if (msg.cmd === 'dir') {
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
  else if (msg.cmd === 'env') {
    push({
      env: process.env
    });
    done();
  }
  else if (msg.cmd === 'download') {
    let file = fs.createWriteStream(msg.filepath);
    let request = https.get({
      hostname: msg.hostname,
      port: msg.port,
      path: msg.path
    }, (response) => {
      let size = parseInt(response.headers['content-length'], 10);
      response.pipe(file);
      file.on('finish', () => {
        if (msg.chmod) {
          fs.chmodSync(msg.filepath, msg.chmod);
        }
        file.close(() => {
          let s = fs.statSync(msg.filepath).size;
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
    request.on('error', (err) => {
      fs.unlink(msg.filepath);
      push({
        error: err.message,
        code: 1001
      });
      done();
    });
    request.on('socket', function (socket) {
      socket.setTimeout(msg.timeout || 60000);
      socket.on('timeout', () => request.abort());
    });
  }
  else if (msg.cmd === 'save-data') {
    let matches = msg.data.match(/^data:.+\/(.+);base64,(.*)$/);
    if (matches && matches.length) {
      let ext = matches[1];
      let data = matches[2];
      let buffer = new Buffer(data, 'base64');

      fs.mkdtemp(os.tmpdir(), (err, folder) => {
        if (err) {
          push({
            error: err.message,
            code: 1007
          });
          done();
        }
        let file =  path.join(folder, 'image.' + ext);
        fs.writeFile(file, buffer, (err) => {
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
