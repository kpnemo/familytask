#!/bin/bash
# Script to switch to production database configuration
# ⚠️  WARNING: Use only for production deployments!

echo "⚠️  WARNING: Switching to PRODUCTION database configuration"
echo "This should only be used for production deployments!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.production .env 2>/dev/null || {
        echo "❌ No .env.production found."
        echo "Please create .env.production with your production environment variables."
        echo "Refer to .env.example for required variables."
        exit 1
    }
    echo "✅ Switched to production database"
    echo "🌐 Using Neon PostgreSQL production database"
else
    echo "❌ Cancelled. Staying with current configuration."
fi