# native-client

Native Client [![Build Status](https://travis-ci.org/andy-portmen/native-client.svg?branch=master)](https://travis-ci.org/andy-portmen/native-client)

This [NodeJS](https://nodejs.org/) based small client helps the following extensions to communicate with your operation system. To see the latest log visit [travis-ci.org](https://travis-ci.org/andy-portmen/native-client).

1. Open in Firefox [open Firefox browser with provided URL]
1. Open in Google Chrome [open Google Chrome browser with provided URL]
2. Open in IE [open Internet Explorer browser with provided URL]
3. Open in Chrome [open Chrome browser with provided URL]
4. Open in Edge [open Microsoft Edge browser with provided URL]
5. Open in Safari [open Safari browser with provided URL]
6. Open in GIMP photo editor [open GIMP photo editor with provided URL or a temporary local image file (data-url's are being converted to a temporary local files and then GIMP is called to open this file)]
7. Open in VLC media Player [open VLC media Player with provided URL]
8. Media Converter and Muxer [Download FFmpeg media converter, Open FFmpeg, Export media files to a temporary directory then call FFmpeg]

You can find up-to-date list as well as IDs here: https://github.com/andy-portmen/native-client/blob/master/config.js

Notes:

1. On Linux and Mac, installer script only copies node executable if it is not already defined in the PATH enviroment. Please make sure you have an up-to-date version of NodeJS
2. On Linux and Mac, you can define custom root directory by adding `--custom-dir=` to the installer script
  Example: `./install.sh --custom-dir=~/Desktop/`
3. Removing the native client [Linux and Mac]: As of version 0.2.1, the installer prints all the directries it creates or inserts scripts in. Basically on Linux and Mac, two JSON files are inserted to predefined directories and a root directory is created which contains all the files. To remove the program simply delete the root directory and delete the two generated manifest JSON files. Path to all these files will be printed during installation
4. Removing the native client [windows]: On Windows OS, a directory is created in "Program Files" and all the files are inserted in this directory. To remove the program, simply delete this directory. Also note that two registry entries are also added so that Chrome, Opera, and Firefox browsers can find the actual executable. Path to these registry entries are also printed during installation
5. If you don't remember where the files are, simply run the installer one more time. It just overwrites all the files.
6. For the installer to be able to copy manifest files and to create the root directory, it needs administration (sudo) permission. If you are not comfortable to allow this permission, you can manually copy all the files
