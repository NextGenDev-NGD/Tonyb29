#!/bin/bash
pkill -f vite 2>/dev/null
sleep 1
nohup npx vite --port 3000 --force > /tmp/vite-fresh.log 2>&1 &
sleep 5
tail -4 /tmp/vite-fresh.log
