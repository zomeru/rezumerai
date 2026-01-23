#!/bin/bash
read -p "Migration name: " name
pnpm with-env prisma migrate dev --name "${name}_$(date +%Y%m%d_%H%M%S)"
