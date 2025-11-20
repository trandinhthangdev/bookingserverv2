#!/bin/bash
# Deploy bookingserver to VPS
VPS_USER=root
VPS_HOST=14.225.212.29
VPS_PATH=/root/bookingserver


# Upload source code (không đẩy node_modules)
rsync -av --exclude 'node_modules' --exclude '.git' ./ $VPS_USER@$VPS_HOST:$VPS_PATH
# Đẩy file .env lên server
rsync -av .env $VPS_USER@$VPS_HOST:$VPS_PATH/.env

# SSH and install dependencies, restart server
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
cd /root/bookingserver
npm install
pm install -g pm2 || true
pm2 restart bookingserver || pm2 start index.js --name bookingserver
ENDSSH

echo "Deploy completed!"
