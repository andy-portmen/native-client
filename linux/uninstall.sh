#!/bin/bash
#
echo " -> Removing manifest file for Google Chrome"
rm -f ~/.config/google-chrome/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Chromium"
rm -f ~/.config/chromium/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Mozilla Firefox"
rm -f ~/.mozilla/native-messaging-hosts/com.add0n.node.json
echo " -> Removing executables"
rm -f -r ~/com.add0n.node

echo ">>> Native Client is removed <<<".
