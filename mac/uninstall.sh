#!/bin/bash
#
rm ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.add0n.node.json
rm ~/Library/Application\ Support/Chromium/NativeMessagingHosts/com.add0n.node.json
rm ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/com.add0n.node.json
rm -r ~/com.add0n.node

echo ">>> Native Client is removed <<<".
