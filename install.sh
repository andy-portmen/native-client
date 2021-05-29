#!/usr/bin/env bash

cd "$(dirname "$0")/app"

which node 2>/dev/null
isNode=$?
echo NodeJS status = $isNode

if [ $isNode -eq 0 ]; then
  node -e "process.exit(Number(process.version.substr(1).split('.')[0]) > 5 ? 0 : 1)"
  isNode=$?
fi
if [ $isNode -eq 0 ]; then
  echo "Installer is using your system NodeJS."
  echo
  node install.js `which node` $1
else
  MACHINE_TYPE=`uname -m`
  echo "Installer is using the embedded NodeJS"
  echo
  if [[ $OSTYPE == 'darwin'* ]]; then
    ../node/x64/node install.js --add_node $1
  elif [ ${MACHINE_TYPE} == 'x86_64' ]; then
    ../node/x64/node install.js --add_node $1
  else
    ../node/x86/node install.js --add_node $1
  fi
fi
