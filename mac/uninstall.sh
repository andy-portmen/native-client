#!/usr/bin/env bash

echo " -> Removing manifest file for Google Chrome"
rm -f ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Chromium"
rm -f ~/Library/Application\ Support/Chromium/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Mozilla Firefox"
rm -f ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Waterfox"
rm -f ~/Library/Application\ Support/Waterfox/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Thunderbird"
rm -f ~/Library/Application\ Support/Thunderbird/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing executables"
rm -f -r ~/.config/com.add0n.node

echo ">>> Native Client is removed <<<".
