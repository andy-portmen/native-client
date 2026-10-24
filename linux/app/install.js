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
    await manifest(path.join(process.env.HOME, '.config/google-chrome/NativeMessagingHosts'), 'chrome')
      .then(() => support('Chrome')).catch(e => support('Chrome', 'browser', e));
    await manifest(path.join(process.env.HOME, '.config/chromium/NativeMessagingHosts'), 'chrome')
      .then(() => support('Chromium Browser')).catch(e => support('Chromium Browser', 'browser', e));
    await manifest(path.join(process.env.HOME, '.config/vivaldi/NativeMessagingHosts'), 'chrome')
      .then(() => support('Vivaldi')).catch(e => support('Vivaldi', 'browser', e));
    await manifest(path.join(process.env.HOME, '.config/BraveSoftware/Brave-Browser/NativeMessagingHosts'), 'chrome')
      .then(() => support('Brave')).catch(e => support('Brave', 'browser', e));
    await manifest(path.join(process.env.HOME, '.config/microsoftedge/NativeMessagingHosts'), 'chrome')
      .then(() => support('Microsoft Edge')).catch(e => support('Chrome', 'browser', e));
    await manifest(path.join(process.env.HOME, '.config/comet/NativeMessagingHosts'), 'chrome')
      .then(() => support('Perplexity Comet')).catch(e => support('Perplexity Comet', 'browser', e));
  }
}
async function firefox() {
  if (config.ids.firefox.length) {
    // Firefox 147+ follows the XDG Base Directory specification and looks for
    // native messaging manifests in $XDG_CONFIG_HOME/mozilla (formerly ~/.mozilla).
    // Write to both locations to support both old and new versions of Firefox.
    const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, '.config');
    await manifest(path.join(process.env.HOME, '.mozilla/native-messaging-hosts'), 'firefox')
      .then(() => support('Firefox (147-)')).catch(e => support('Firefox (147-)', 'browser', e));
    await manifest(path.join(xdgConfigHome, 'mozilla/native-messaging-hosts'), 'firefox')
      .then(() => support('Firefox (147+)')).catch(e => support('Firefox (147+)', 'browser', e));
    await manifest(path.join(process.env.HOME, '.waterfox/native-messaging-hosts'), 'firefox')
      .then(() => support('Waterfox')).catch(e => support('Waterfox', 'browser', e));
    await manifest(path.join(
      process.env.HOME, '.tor-browser/app/Browser/TorBrowser/Data/Browser/.mozilla/native-messaging-hosts'
    ), 'firefox').then(() => support('Tor')).catch(e => support('Tor', 'browser', e));
    await manifest(path.join(process.env.HOME, '.thunderbird/native-messaging-hosts'), 'firefox')
      .then(() => support('Thunderbird', 'email client')).catch(e => support('Thunderbird', 'email client', e));
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
    xdgPath: 'config/mozilla/native-messaging-hosts',
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
        const paths = [browser.path];
        // Firefox 147+ uses $XDG_CONFIG_HOME/mozilla instead of .mozilla
        if (browser.xdgPath) {
          paths.push(browser.xdgPath);
        }
        for (const browserPath of paths) {
          try {
            const manifestPath = path.join(
              process.env.HOME,
              '.var/app',
              appId,
              browserPath
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

