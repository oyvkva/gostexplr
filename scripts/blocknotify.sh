#!/bin/sh
cd $(dirname "$0")/..
npm run syncBlockchain >/dev/null 2>&1
