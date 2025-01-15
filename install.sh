#!/usr/bin/env bash

# Define Node.js version and base URL
NODE_VERSION="v18.20.5"
NODE_BASE_URL="https://nodejs.org/download/release/${NODE_VERSION}"
NODE_INSTALL_DIR="./node"

cd "$(dirname "$0")/app"

# Function to determine the appropriate Node.js binary
get_node_binary_url() {
  OS_TYPE=$(uname | tr '[:upper:]' '[:lower:]')
  MACHINE_TYPE=$(uname -m)

  case "${OS_TYPE}" in
    linux)
      case "${MACHINE_TYPE}" in
        x86_64) echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-x64.tar.gz" ;;
        *64)
          # If the machine type ends with '64' and is not x86_64, assume it's ARM64
          echo "${NODE_BASE_URL}/node-${NODE_VERSION}-linux-arm64.tar.gz" ;;
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
which node >/dev/null 2>&1
IS_NODE_GLOBAL=$?

if [ $IS_NODE_GLOBAL -eq 0 ]; then
  node -e "process.exit(Number(process.version.substr(1).split('.')[0]) > 5 ? 0 : 1)"
  IS_NODE_GLOBAL=$?
fi

if [ $IS_NODE_GLOBAL -eq 0 ]; then
  echo "Installer is using your system NodeJS."
  echo
  node install.js "$(which node)" "$1"
else
  echo "Node.js not found or version is less than 6. Downloading Node.js..."
  mkdir -p "${NODE_INSTALL_DIR}"

  NODE_URL=$(get_node_binary_url)
  NODE_ARCHIVE="${NODE_INSTALL_DIR}/node.tar.gz"

  echo "Downloading ${NODE_URL}..."
  curl -o "${NODE_ARCHIVE}" "${NODE_URL}"

  echo "Extracting Node.js..."
  tar -xzf "${NODE_ARCHIVE}" -C "${NODE_INSTALL_DIR}" --strip-components=1
  rm "${NODE_ARCHIVE}"

  echo "Running installer with embedded Node.js..."
  "${NODE_INSTALL_DIR}/bin/node" install.js --add_node "$1"
fi
