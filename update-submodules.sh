#!/bin/bash
# 仅更新 r-markdown 两个 submodule 到远端最新，不做 commit/push
# 用法: bash update-submodules.sh
set -e
ROOT="/Users/xuepingmao/miclaw/project/r-markdown"
cd "$ROOT/src-tauri" && git fetch origin && git checkout origin/main
cd "$ROOT/src/extension" && git fetch origin && git checkout origin/main
cd "$ROOT/src/views-private" && git fetch origin && git checkout origin/main
echo "done — src-tauri + src/extension + src/views-private 已更新到远端最新"
