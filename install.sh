#!/usr/bin/env sh

set -e

# Define Node.js version and base URL
NODE_VERSION="v18.20.5"
NODE_BASE_URL="https://nodejs.org/download/release/${NODE_VERSION}"

UNAME=$(uname | tr '[:upper:]' '[:lower:]')

# Config directory printed by the installer and used for unveil hints
CUSTOM_DIR=
case "$1" in
  --custom-dir=*) CUSTOM_DIR=${1#--custom-dir=} ;;
esac
: "${CUSTOM_DIR:=${HOME}/.config}"
# strip trailing slash (install.js resolves the path the same way)
CUSTOM_DIR=${CUSTOM_DIR%/}

# Check if Node.js is globally installed
IS_NODE_GLOBAL=1
if command -v node >/dev/null 2>&1; then
  if node -e "process.exit(Number(process.version.substr(1).split('.')[0]) > 5 ? 0 : 1)"; then
    IS_NODE_GLOBAL=0
  fi
fi

# OpenBSD ships no official Node binaries; use the package system instead
if [ "$IS_NODE_GLOBAL" -ne 0 ] && [ "${UNAME}" = "openbsd" ]; then
  echo "Node.js not found or version is less than 6." >&2
  echo "On OpenBSD official Node.js binaries are not available for download." >&2
  echo "Please install Node.js with the package system, then re-run this installer:" >&2
  echo "  doas pkg_add node" >&2
  exit 1
fi

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

# Chromium on OpenBSD runs confined; print the unveil rules needed for
# native messaging (same style as other native messaging ports, e.g. web-eid)
if [ "${UNAME}" = "openbsd" ]; then
  NODE_PATH=$(command -v node)
  echo
  echo "Note (OpenBSD): Chromium can only run the native host with unveil rules."
  echo "Add the following lines to /etc/chromium/unveil.main:"
  echo
  echo "  # native-client (com.add0n.node) native messaging host"
  echo "  ${NODE_PATH} rx"
  echo "  ${CUSTOM_DIR}/com.add0n.node rx"
fi
