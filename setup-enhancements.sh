#!/bin/bash
# Setup script untuk optional enhancements
# Run: chmod +x setup-enhancements.sh && ./setup-enhancements.sh

echo "🚀 Setting up Optional Enhancements for Arianation..."

# Step 1: Install web-vitals
echo "📦 Installing web-vitals for performance monitoring..."
cd frontend
npm install web-vitals

# Step 2: Create .env.local if not exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local..."
  cat > .env.local << EOF
# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name-here

# Add more env vars as needed
EOF
  echo "✅ .env.local created. Update CLOUDINARY_CLOUD_NAME with your account"
fi

# Step 3: Backend compression
echo "📦 Ensuring compression middleware in backend..."
if ! grep -q "require('compression')" ../src/app.js; then
  echo "⚠️  Compression not found in backend. Run manually:"
  echo "npm install compression"
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update frontend/.env.local with your Cloudinary cloud name"
echo "2. Update LocalBusinessSchema.jsx with real business data"
echo "3. Create FAQ page with custom questions"
echo "4. Run mobile audit: npm test"
echo "5. Run Lighthouse: lighthouse https://arianation.com"
echo ""
echo "📚 Documentation: OPTIONAL_ENHANCEMENTS_GUIDE.md"
