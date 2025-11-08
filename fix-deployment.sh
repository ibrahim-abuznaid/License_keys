#!/bin/bash

# Quick Fix Script for DigitalOcean Droplet Login Issue
# Run this script on your droplet after pulling the latest changes

echo "🔧 License Keys App - Deployment Fix Script"
echo "==========================================="
echo ""

# Check if .env.local exists and rename it
if [ -f .env.local ]; then
    echo "📝 Renaming .env.local to .env..."
    mv .env.local .env
    echo "✅ Done"
else
    echo "ℹ️  .env.local not found, checking for .env..."
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Creating .env template..."
    cat > .env << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Authentication (REQUIRED - Change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123

# Production Environment
NODE_ENV=production

# Optional: Set to true when you have HTTPS configured
# USE_SECURE_COOKIES=false
EOF
    echo "✅ Created .env template"
    echo "⚠️  IMPORTANT: Edit .env and set your actual credentials!"
    echo "   Run: nano .env"
    exit 1
fi

# Check if ADMIN_USERNAME and ADMIN_PASSWORD are set
if grep -q "ADMIN_USERNAME=" .env && grep -q "ADMIN_PASSWORD=" .env; then
    echo "✅ .env file exists with admin credentials"
else
    echo "⚠️  WARNING: ADMIN_USERNAME or ADMIN_PASSWORD not found in .env"
    echo "   Make sure to add them before continuing!"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the application
echo ""
echo "🏗️  Building application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🔄 Restarting application with PM2..."
    
    # Stop all PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start the application
    NODE_ENV=production pm2 start npm --name "license-keys" -- start
    
    # Save PM2 configuration
    pm2 save
    
    echo "✅ Application restarted with PM2"
    echo ""
    echo "📊 To view logs, run: pm2 logs"
else
    echo ""
    echo "ℹ️  PM2 not found. Starting application directly..."
    echo "⚠️  Note: You may want to install PM2 for better process management"
    echo "   Install with: npm install -g pm2"
    echo ""
    echo "Starting application on port 3000..."
    NODE_ENV=production npm start &
    echo "✅ Application started in background"
fi

echo ""
echo "=========================================="
echo "✅ Deployment fix complete!"
echo ""
echo "🔍 Next steps:"
echo "1. Open your browser and go to your site"
echo "2. Try to log in with your credentials"
echo "3. If it doesn't work, check logs:"
if command -v pm2 &> /dev/null; then
    echo "   pm2 logs"
else
    echo "   Check your process logs"
fi
echo ""
echo "4. Look for these debug messages:"
echo "   - 'Setting auth cookie:'"
echo "   - 'Validating credentials:'"
echo "   - 'Credentials valid: true'"
echo ""
echo "📚 For more help, see: QUICK_FIX_DROPLET.md"
echo "=========================================="

