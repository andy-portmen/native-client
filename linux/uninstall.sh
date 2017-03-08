#!/bin/bash
#
rm ~/.config/google-chrome/NativeMessagingHosts/com.add0n.node.json
rm ~/.config/chromium/NativeMessagingHosts/com.add0n.node.json
rm ~/.mozilla/native-messaging-hosts/com.add0n.node.json
rm -r ~/com.add0n.node

echo ">>> Native Client is removed <<<".
