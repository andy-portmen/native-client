# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Native Client is a NodeJS-based application that enables browser extensions to communicate with the operating system through native messaging. It acts as a bridge between web browsers and native applications, allowing extensions to perform actions like opening URLs in specific browsers, launching media players, or running command-line tools.

## Architecture

### Core Components

- **host.js**: Main entry point that sets up the native messaging pipeline and handles various commands (spawn, exec, script execution, etc.)
- **messaging.js**: Chrome native messaging protocol implementation with Transform streams for Input, Output, Transform, and Debug
- **config.js**: Configuration file containing browser extension IDs that are allowed to communicate with the native client

### Message Processing Pipeline

The application uses Node.js streams to process native messages:
```
stdin -> Input -> Transform -> Output -> stdout
```

1. **Input**: Transforms raw bytes from stdin into JavaScript objects following Chrome's native messaging protocol
2. **Transform**: Processes message objects through the observe() function in host.js
3. **Output**: Transforms JavaScript response objects back into native message format

### Command System

The host supports several command types:
- `version`: Returns the current version
- `spec`: Returns environment information
- `spawn`: Spawns processes with real-time stdout/stderr streaming
- `exec`: Executes processes and returns complete output
- `script`: Executes JavaScript code in a sandboxed VM context
- `env`: Returns environment variables
- `clean-tmp`: Cleans temporary files

## Platform-Specific Structure

The repository is organized with platform-specific directories:
- **linux/**: Linux-specific files and installation scripts
- **mac/**: macOS-specific files and installation scripts  
- **windows/**: Windows-specific files and installation scripts

Each platform directory contains:
- `app/`: Core application files (host.js, messaging.js, config.js, install.js)
- `install.sh` (Linux/Mac) or `install.bat` (Windows): Platform-specific installation scripts
- `uninstall.sh` (Linux/Mac) or `uninstall.bat` (Windows): Uninstallation scripts

## Development Commands

### Installation
```bash
# Install using npm
npm install native-client
npm run install --prefix node_modules/native-client

# Manual installation (Linux/Mac)
./install.sh

# Custom installation directory (Linux/Mac)
./install.sh --custom-dir=~/Desktop/
```

### Building Release Packages
```bash
./prepare.sh
```
This script creates platform-specific zip files and a Debian package.

### Testing
The project uses Travis CI for automated builds and testing. Configuration is in `.travis.yml`.

## Installation Architecture

### macOS Installation (mac/app/install.js)
- Creates native messaging host manifest files for Chrome-based browsers and Firefox-based browsers
- Installs to `~/.config/com.add0n.node/` by default (configurable with `--custom-dir`)
- Creates browser-specific manifest files in appropriate Library directories
- Supports Chrome, Chromium, Vivaldi, Brave, Edge, Firefox, Waterfox, Tor Browser, and Thunderbird

### Node.js Management
The install script (install.sh) automatically:
- Detects if Node.js is globally available and version >= 6
- Downloads and installs a local Node.js binary if needed (v18.20.5)
- Supports multiple architectures (x64, ARM64, ARMv7l, etc.)

## Security Considerations

- Extensions must be explicitly whitelisted in config.js
- Script execution uses VM sandboxing with limited require() permissions
- Temporary files are automatically cleaned up on process exit
- Process spawning supports environment variable modification but runs with inherited permissions