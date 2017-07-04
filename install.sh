#!/bin/bash

cd ./app

if type node 2>/dev/null; then
  echo "Installer is using your system NodeJS; Please make sure your NodeJS is up-to-date."
  node install.js `which node` $1
else
  MACHINE_TYPE=`uname -m`
  echo "Installer is using the attached NodeJS"
  if [ ${MACHINE_TYPE} == 'x86_64' ]; then
    ../node/x64/node install.js --add_node $1
  else
    ../node/x86/node install.js --add_node $1
  fi
fi
