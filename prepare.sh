#!/bin/bash

cd linux
zip ../linux.zip -9 -r * -x "*.DS_Store"
cd ../mac
zip ../mac.zip -9 -r * -x "*.DS_Store"
cd ../windows
zip ../windows.zip -9 -r * -x "*.DS_Store"

cd ..
zip "Source code (no node).zip" -9 -r * -x "*.DS_Store" -x "*/node/*/node" "windows/node/*/node.exe"
