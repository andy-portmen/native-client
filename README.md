# native-client

Native Client [![Build Status](https://travis-ci.org/andy-portmen/native-client.svg?branch=master)](https://travis-ci.org/andy-portmen/native-client)

This [NodeJS](https://nodejs.org/)-based small client helps the following extensions to communicate with your operating system. To see the latest log visit [travis-ci.org](https://travis-ci.org/andy-portmen/native-client).

1. Open in Firefox [open Firefox browser with provided URL]
1. Open in Google Chrome [open Google Chrome browser with provided URL]
2. Open in IE [open Internet Explorer browser with provided URL]
3. Open in Chrome [open Chrome browser with provided URL]
4. Open in Edge [open Microsoft Edge browser with provided URL]
5. Open in Safari [open Safari browser with provided URL]
6. Open in GIMP photo editor [open GIMP photo editor with provided URL or a temporary local image file (data-url's are being converted to a temporary local files and then GIMP is called to open this file)]
7. Open in VLC media Player [open VLC media Player with provided URL]
8. Media Converter and Muxer [Download FFmpeg media converter, Open FFmpeg, Export media files to a temporary directory then call FFmpeg]

You can find the complete list as well as official IDs in the [config.js](https://github.com/andy-portmen/native-client/blob/master/config.js) file.

How to install

  * Windows: https://www.youtube.com/watch?v=yZAoy8SOd7o
  * Linux and Mac: https://www.youtube.com/watch?v=2asPoW2gJ-c

How to install using [`npm`](https://github.com/andy-portmen/native-client-npm)

```bash
npm install native-client
npm run install --prefix node_modules/native-client
```

Notes:

1. On Linux and Mac, installer script only copies node executable if it is not already defined in the PATH environment. Please make sure you have an up-to-date version of NodeJS
2. On Linux and Mac, you can define custom root directory by adding `--custom-dir=` to the installer script
  Example: `./install.sh --custom-dir=~/Desktop/`
3. Removing the native client [Linux and Mac]: As of version 0.2.1, the installer prints all the directories it creates or inserts scripts in. Basically on Linux and Mac, two JSON files are inserted to predefined directories and a root directory is created which contains all the files. To remove the program simply delete the root directory and delete the two generated manifest JSON files. Path to all these files will be printed during installation
4. Removing the native client [windows]: On Windows OS, a directory is created in the "%LocalAPPData;" and all the files are inserted in this directory. To remove the program, simply delete this directory. Also note that two registry entries are also added so that Chrome, Opera, and Firefox browsers can find the actual executable. Path to these registry entries are also printed during installation. You can use "uninstall.bat" to remove all files and registries.
5. If you don't remember where the files are, simply run the installer one more time. It just overwrites all the files.
