#!/bin/bash
read -p "Migration name: " name
bun run with-env prisma migrate dev --schema ./prisma --name "$(date +%Y%m%d_%H%M%S)_${name}"
