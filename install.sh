#!/usr/bin/env bash

set -e

# Define Node.js version and base URL
NODE_VERSION="v18.20.5"
NODE_BASE_URL="https://nodejs.org/download/release/${NODE_VERSION}"

cd "$(dirname "$0")/app"

# Temporary directory for Node download/extraction
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Function to determine the appropriate Node.js binary
get_node_binary_url() {
  OS_TYPE=$(uname | tr '[:upper:]' '[:lower:]')
  MACHINE_TYPE=$(uname -m)

  case "${OS_TYPE}" in
    linux)
      case "${MACHINE_TYPE}" in
        x86_64) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-x64.tar.gz" ;;
        aarch64|arm64) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-arm64.tar.gz" ;;
        armv7l) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-armv7l.tar.gz" ;;
        ppc64le) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-ppc64le.tar.gz" ;;
        s390x) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-s390x.tar.gz" ;;
        *) echo "Unsupported architecture: ${MACHINE_TYPE}" >&2; exit 1 ;;
      esac
      ;;
    darwin)
      case "${MACHINE_TYPE}" in
        x86_64) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-darwin-x64.tar.gz" ;;
        arm64) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-darwin-arm64.tar.gz" ;;
        *) echo "Unsupported architecture: ${MACHINE_TYPE}" >&2; exit 1 ;;
      esac
      ;;
    *)
      echo "Unsupported OS: ${OS_TYPE}" >&2
      exit 1
      ;;
  esac
}

# Check if Node.js is globally installed
if command -v node >/dev/null 2>&1; then
  node -e "process.exit(Number(process.version.substr(1).split('.')[0]) > 5 ? 0 : 1)"
  IS_NODE_GLOBAL=$?
else
  IS_NODE_GLOBAL=1
fi

if [ "$IS_NODE_GLOBAL" -eq 0 ]; then
  echo "Installer is using your system NodeJS."
  echo
  node install.js "$(command -v node)" "$1"
else
  echo "Node.js not found or version is less than 6. Downloading Node.js..."

  NODE_URL=$(get_node_binary_url)
  NODE_ARCHIVE="${TMP_DIR}/node.tar.gz"
  NODE_DIR="${TMP_DIR}/node"

  mkdir -p "${NODE_DIR}"

  echo "Downloading ${NODE_URL}..."
  curl -fL -o "${NODE_ARCHIVE}" "${NODE_URL}"

  echo "Extracting Node.js..."
  tar -xzf "${NODE_ARCHIVE}" -C "${NODE_DIR}" --strip-components=1

  echo "Running installer with temporary Node.js..."
  "${NODE_DIR}/bin/node" install.js --add_node "$1"
fi
