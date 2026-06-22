#!/bin/sh

# Decode Oracle Wallet if provided (for self-hosted deployments)
if [ -n "$ORACLE_WALLET_BASE64" ]; then
  echo "Decoding Oracle Wallet..."
  mkdir -p /tmp/wallet
  echo "$ORACLE_WALLET_BASE64" | base64 -d > /tmp/wallet/wallet.zip
  cd /tmp/wallet
  unzip -o wallet.zip
  cd /app
  export TNS_ADMIN=/tmp/wallet
fi

# Execute the main command
exec "$@"