#!/bin/bash

echo "========================================"
echo "   RESTART DEV SERVER - FIX PRINT VIEW"
echo "========================================"
echo ""

# Stop server
echo "Stopping current server..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clear cache
echo "Clearing cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "Cache cleared!"
fi

echo ""
echo "Starting server..."
echo ""

# Start server
npm run dev &

echo ""
echo "========================================"
echo "Server is restarting..."
echo "Please wait 10-15 seconds then refresh browser"
echo "========================================"
echo ""
