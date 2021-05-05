#!/bin/sh

# This script builds libcurl using Emscripten.

set -ex

abspath=$($EMSCRIPTEN_EXEC pwd)
rm -rf installed
mkdir -p installed

$EMSCRIPTEN_EXEC emconfigure ./configure --disable-shared --without-ssl --without-gnutls
$EMSCRIPTEN_EXEC emmake make -C lib -j$(nproc) install DESTDIR="$abspath/installed"
$EMSCRIPTEN_EXEC emmake make -C include -j$(nproc) install DESTDIR="$abspath/installed"
