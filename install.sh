#!/bin/bash

cd ./app

if type node 2>/dev/null; then
  echo "Installer is using your system NodeJS; Please make sure your NodeJS is up-to-date."
  node install.js `which node` $1
else
  echo "Installer is using the attached NodeJS"
  ../node install.js --add_node $1
fi

