#!/usr/bin/env bash

cd linux
zip ../linux.zip -9 -r * -x "*.DS_Store"
cd ../mac
zip ../mac.zip -9 -r * -x "*.DS_Store"
cd ../windows
zip ../windows.zip -9 -r * -x "*.DS_Store"

cd ..
zip "src_no_node.zip" -9 --symlinks -r * -x "*.DS_Store" -x "*/node/*/node" "windows/node/*/node.exe" "*.zip"

# debian package
unzip linux.zip -d apt/opt/native-client/
cp apt/opt/native-client/uninstall.sh apt/DEBIAN/postrm
dpkg-deb --build apt
mv apt.deb linux.deb
