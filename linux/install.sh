#!/bin/bash

cd ./app

if type node 2>/dev/null; then
  echo Installer is using your system node.js
  sudo node install.js
else
  echo Installer is using the attached node.js
  sudo ../node install.js --add_node
fi

