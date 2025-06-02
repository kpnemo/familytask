#!/bin/bash
# Script to switch to development database configuration
# This ensures you're working with local database and not production

echo "Switching to development database configuration..."

# Backup current .env if it's production
if grep -q "neondb" .env; then
    echo "Backing up production .env to .env.production"
    cp .env .env.production
fi

# Copy development configuration
cp .env.local .env

echo "✅ Switched to development database"
echo "🗄️  Using local PostgreSQL: familytasks_dev"
echo ""
echo "To switch back to production, run: ./scripts/switch-to-prod.sh"