#!/usr/bin/env bash

echo " -> Removing manifest file for Google Chrome"
rm -f ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Chromium"
rm -f ~/Library/Application\ Support/Chromium/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Vivaldi"
rm -f ~/Library/Application Support/Vivaldi/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Brave"
rm -f ~/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Microsoft Edge"
rm -f ~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Mozilla Firefox"
rm -f ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Waterfox"
rm -f ~/Library/Application\ Support/Waterfox/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Tor"
rm -f ~/Library/Application Support/TorBrowser-Data/Browser/Mozilla/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Thunderbird"
rm -f ~/Library/Application\ Support/Thunderbird/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing executables"
rm -f -r ~/.config/com.add0n.node

echo ">>> Native Client is removed <<<".
