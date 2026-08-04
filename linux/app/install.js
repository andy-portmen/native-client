'use strict';

const fs = require('fs');
const path = require('path');

let share = process.argv.filter(a => a.startsWith('--custom-dir='))
  .map(a => a.split('=')[1])[0] || path.resolve(process.env.HOME, '.config');
if (share[0] === '~') {
  share = path.join(process.env.HOME, share.slice(1));
}
share = path.resolve(share);
console.log(' -> Browser configuration directory is', '\x1b[32m' + share +'\x1b[0m\n');

function exists(directory, callback) {
  let root = '/';
  const dirs = directory.split('/');
  function one() {
    root = path.join(root, dirs.shift());
    fs.stat(root, e => {
      if (!e && dirs.length) {
        one();
      }
      else if (e && e.code === 'ENOENT') {
        fs.mkdir(root, e => {
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

const dir = path.join(share, 'com.add0n.node');
const name = 'com.add0n.node';
const config = require('./config.js');

function manifest(root, type, executable = path.join(dir, 'run.sh')) {
  console.log(' -> Creating a directory at', root);
  return new Promise((resolve, reject) => {
    exists(root, e => {
      if (e) {
        return reject(e);
      }
      const m = {
        name,
        description: config.description,
        path: executable,
        type: 'stdio'
      };
      if (type === 'chrome') {
        m.allowed_origins = config.ids.chrome.map(id => 'chrome-extension://' + id + '/');
      }
      else {
        m.allowed_extensions = config.ids.firefox;
      }

      fs.writeFile(path.join(root, name + '.json'), JSON.stringify(m, undefined, '  '), e => {
        if (e) {
          return reject(e);
        }
        resolve();
      });
    });
  });
}
function application() {
  console.log('\n -> Application directory is', '\x1b[32m' + dir +'\x1b[0m');
  return new Promise((resolve, reject) => {
    exists(dir, e => {
      if (e) {
        console.log('\x1b[31m', `-> You don't have permission to use "${share}" directory.`, '\x1b[0m');
        console.log('\x1b[31m', '-> Use custom directory instead. Example:', '\x1b[0m');
        console.log('\x1b[31m', '-> ./install.sh --custom-dir=~/', '\x1b[0m');

        return reject(e);
      }
      const isNode = process.argv.filter(a => a === '--add_node').length === 0;

      const run = `#!/usr/bin/env bash\n${isNode ? process.argv[0] : './node'} $(dirname "$0")/host.js`;
      fs.writeFile(path.join(dir, 'run.sh'), run, e => {
        if (e) {
          return reject(e);
        }
        fs.chmodSync(path.join(dir, 'run.sh'), '0755');
        if (!isNode) {
          const stream = fs.createReadStream(process.argv[0]);
          stream.on('close', () => {
            fs.chmodSync(path.join(dir, 'node'), '0755');
          });
          stream.pipe(fs.createWriteStream(path.join(dir, 'node')));
        }
        fs.createReadStream('host.js').pipe(fs.createWriteStream(path.join(dir, 'host.js')));
        fs.createReadStream('messaging.js').pipe(fs.createWriteStream(path.join(dir, 'messaging.js')));
        resolve();
      });
    });
  });
}

const support = (name, type = 'browser') => {
  console.log(' -> \x1b[1m' + name + '\x1b[0m ' + type + ' is supported');
};

async function chrome() {
  if (config.ids.chrome.length) {
    await manifest(path.join(process.env.HOME, '.config/google-chrome/NativeMessagingHosts'), 'chrome');
    support('Chrome');
    await manifest(path.join(process.env.HOME, '.config/chromium/NativeMessagingHosts'), 'chrome');
    support('Chromium Browser');
    await manifest(path.join(process.env.HOME, '.config/vivaldi/NativeMessagingHosts'), 'chrome');
    support('Vivaldi');
    await manifest(path.join(process.env.HOME, '.config/BraveSoftware/Brave-Browser/NativeMessagingHosts'), 'chrome');
    support('Brave');
    await manifest(path.join(process.env.HOME, '.config/microsoftedge/NativeMessagingHosts'), 'chrome');
    support('Microsoft Edge');
    await manifest(path.join(process.env.HOME, '.config/comet/NativeMessagingHosts'), 'chrome');
    support('Perplexity Comet');
  }
}
async function firefox() {
  if (config.ids.firefox.length) {
    await manifest(path.join(process.env.HOME, '.mozilla/native-messaging-hosts'), 'firefox');
    support('Firefox');
    await manifest(path.join(process.env.HOME, '.waterfox/native-messaging-hosts'), 'firefox');
    support('Waterfox');
    await manifest(path.join(
      process.env.HOME, '.tor-browser/app/Browser/TorBrowser/Data/Browser/.mozilla/native-messaging-hosts'
    ), 'firefox');
    support('Tor');
    await manifest(path.join(process.env.HOME, '.thunderbird/native-messaging-hosts'), 'firefox');
    support('Thunderbird', 'email client');
  }
}

// Flatpak browser support
const FLATPAK_BROWSERS = {
  // Chromium-based browsers
  'com.google.Chrome': {
    path: 'config/google-chrome/NativeMessagingHosts',
    type: 'chrome',
    name: 'Google Chrome (Flatpak)'
  },
  'org.chromium.Chromium': {
    path: 'config/chromium/NativeMessagingHosts',
    type: 'chrome',
    name: 'Chromium (Flatpak)'
  },
  'com.opera.Opera': {
    path: 'config/google-chrome/NativeMessagingHosts',
    type: 'chrome',
    name: 'Opera (Flatpak)'
  },
  'com.brave.Browser': {
    path: 'config/BraveSoftware/Brave-Browser/NativeMessagingHosts',
    type: 'chrome',
    name: 'Brave (Flatpak)'
  },
  'com.microsoft.Edge': {
    path: 'config/microsoftedge/NativeMessagingHosts',
    type: 'chrome',
    name: 'Microsoft Edge (Flatpak)'
  },
  'com.vivaldi.Vivaldi': {
    path: 'config/vivaldi/NativeMessagingHosts',
    type: 'chrome',
    name: 'Vivaldi (Flatpak)'
  },
  'io.github.ungoogled_software.ungoogled_chromium': {
    path: 'config/chromium/NativeMessagingHosts',
    type: 'chrome',
    name: 'Ungoogled Chromium (Flatpak)'
  },
  // Firefox-based browsers
  'org.mozilla.firefox': {
    path: '.mozilla/native-messaging-hosts',
    type: 'firefox',
    name: 'Firefox (Flatpak)'
  },
  'io.gitlab.librewolf-community': {
    path: '.librewolf/native-messaging-hosts',
    type: 'firefox',
    name: 'LibreWolf (Flatpak)'
  }
};

function getInstalledFlatpaks() {
  const {execSync} = require('child_process');
  try {
    const output = execSync('/usr/bin/flatpak list --app --columns=application', {encoding: 'utf8'});
    return output.trim().split('\n').filter(line => line.length > 0);
  }
  catch (e) {
    // flatpak not installed or no apps
    return [];
  }
}

async function flatpak() {
  const installed = getInstalledFlatpaks();
  let count = 0;

  for (const appId of installed) {
    const browser = FLATPAK_BROWSERS[appId];
    if (browser) {
      // Check if we should install for this browser type
      if ((browser.type === 'chrome' && config.ids.chrome.length) ||
          (browser.type === 'firefox' && config.ids.firefox.length)) {
        try {
          const manifestPath = path.join(
            process.env.HOME,
            '.var/app',
            appId,
            browser.path
          );

          // write wrapper
          const run = `#!/bin/sh

flatpak-spawn --host sh -c '
  cd ${dir}/ || exit 1
  exec ./run.sh
'`;
          const exe = path.join(manifestPath, `${name}.sh`);
          await new Promise((resolve, reject) => fs.writeFile(exe, run, e => {
            if (e) {
              return reject(e);
            }
            fs.chmodSync(exe, '0755');
            resolve();
          }));

          await manifest(manifestPath, browser.type, exe);
          support(browser.name);
          count++;
        }
        catch (e) {
          console.error(` -> Warning: Failed to install manifest for ${browser.name}:`, e.message);
        }
      }
    }
  }

  if (count > 0) {
    console.log(` -> Installed manifests for ${count} Flatpak browser(s)`);
  }
}

(async () => {
  try {
    await chrome();
    await firefox();
    await flatpak();
    await application();
    console.log('\n\n\x1b[1m>>> Native host is ready <<<\x1b[0m\n');
  }
  catch (e) {
    console.error(e);
    process.exit(-1);
  }
})();

