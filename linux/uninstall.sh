#!/usr/bin/env bash

echo " -> Removing manifest file for Google Chrome"
rm -f ~/.config/google-chrome/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Chromium"
rm -f ~/.config/chromium/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Vivaldi"
rm -f ~/.config/vivaldi/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Brave"
rm -f ~/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Microsoft Edge"
rm -f ~/.config/microsoftedge/NativeMessagingHosts/com.add0n.node.json
echo " -> Removing manifest file for Mozilla Firefox"
rm -f ~/.mozilla/native-messaging-hosts/com.add0n.node.json
echo " -> Removing manifest file for Waterfox"
rm -f ~/.waterfox/native-messaging-hosts/com.add0n.node.json
echo " -> Removing manifest file for Tor"
rm -f ~/.tor-browser/app/Browser/TorBrowser/Data/Browser/.mozilla/native-messaging-hosts/com.add0n.node.json
echo " -> Removing manifest file for Thunderbird"
rm -f ~/.thunderbird/native-messaging-hosts/com.add0n.node.json
echo " -> Removing executables"
rm -f -r ~/.config/com.add0n.node

echo ">>> Native Client is removed <<<".
