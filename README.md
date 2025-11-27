# DevOps CI/CD Stack References

A modern, responsive static website providing comprehensive DevOps CI/CD stack references with build commands, test commands, Dockerfile templates, Jenkinsfile examples, ArgoCD manifests, and common gotchas.

## Features

- 🔍 **Searchable Interface**: Fast, real-time search across all stack configurations
- 🏷️ **Smart Filtering**: Filter by language type (Backend/Frontend/ML) and build tools
- 📋 **One-Click Copy**: Copy-to-clipboard functionality for all code snippets and commands
- 🌓 **Dark Mode**: Toggle between light and dark themes with system preference detection
- 📱 **Mobile Responsive**: Optimized for all device sizes
- ⚡ **Zero Build Process**: Pure HTML/CSS/JS - ready to deploy to S3 instantly

## Supported Stacks

### Comprehensive Templates
- **Java** (Maven & Gradle)
- **Python** (pip/poetry)
- **Node.js** (npm/yarn)
- **Rust** (Cargo)

### Additional Stacks
- .NET Core
- React
- Vue.js
- Angular
- Next.js
- Go
- Ruby
- PHP
- Scala
- Kotlin
- Elixir

## Tech Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Font Awesome 6
- **Data**: JSON configuration file
- **Hosting**: AWS S3 Static Website Hosting

## Quick Start

1. **Clone or download the files**:
   ```bash
   git clone <repository-url>
   cd devops-stack-references
   ```

2. **Serve locally** (optional):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**:
   ```
   http://localhost:8000
   ```

## AWS S3 Deployment

### Prerequisites

1. **AWS CLI installed and configured**:
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS credentials
   aws configure
   ```

2. **S3 bucket created with static website hosting enabled**

### Step 1: Create S3 Bucket

```bash
# Replace 'your-bucket-name' with your desired bucket name
export BUCKET_NAME="devops-stack-references-$(date +%s)"

# Create bucket
aws s3 mb s3://$BUCKET_NAME

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
```

### Step 2: Configure Bucket Policy (Public Access)

Create a bucket policy file:

```bash
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }
    ]
}
EOF

# Replace BUCKET_NAME in the policy file
sed -i "s/BUCKET_NAME/$BUCKET_NAME/g" bucket-policy.json

# Apply the bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Enable public access
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Step 3: Deploy the Website

```bash
# Sync all files to S3
aws s3 sync . s3://$BUCKET_NAME --exclude "*.git/*" --exclude "*.md" --exclude "bucket-policy.json"

# Set correct content types
aws s3 cp index.html s3://$BUCKET_NAME/index.html --content-type "text/html"
aws s3 cp app.js s3://$BUCKET_NAME/app.js --content-type "application/javascript"
aws s3 cp stacks.json s3://$BUCKET_NAME/stacks.json --content-type "application/json"

# Get the website URL
echo "Website URL: http://$BUCKET_NAME.s3-website-$(aws configure get region).amazonaws.com"
```

### Step 4: Custom Domain (Optional)

If you want to use a custom domain:

1. **Create Route 53 hosted zone**:
   ```bash
   aws route53 create-hosted-zone --name your-domain.com --caller-reference $(date +%s)
   ```

2. **Create CloudFront distribution**:
   ```bash
   # Create distribution configuration
   cat > cloudfront-config.json << 'EOF'
   {
       "CallerReference": "$(date +%s)",
       "Origins": {
           "Quantity": 1,
           "Items": [
               {
                   "Id": "S3-origin",
                   "DomainName": "BUCKET_NAME.s3-website-REGION.amazonaws.com",
                   "CustomOriginConfig": {
                       "HTTPPort": 80,
                       "HTTPSPort": 443,
                       "OriginProtocolPolicy": "http-only"
                   }
               }
           ]
       },
       "DefaultCacheBehavior": {
           "TargetOriginId": "S3-origin",
           "ViewerProtocolPolicy": "redirect-to-https",
           "TrustedSigners": {
               "Enabled": false,
               "Quantity": 0
           },
           "ForwardedValues": {
               "QueryString": false,
               "Cookies": {"Forward": "none"}
           },
           "MinTTL": 0
       },
       "Comment": "DevOps Stack References",
       "Enabled": true
   }
   EOF
   ```

### Automated Deployment Script

Create a deployment script for easier updates:

```bash
cat > deploy.sh << 'EOF'
#!/bin/bash

# Configuration
BUCKET_NAME="your-bucket-name"
REGION="us-east-1"

echo "🚀 Deploying DevOps Stack References to S3..."

# Sync files
echo "📁 Syncing files..."
aws s3 sync . s3://$BUCKET_NAME \
    --exclude "*.git/*" \
    --exclude "*.md" \
    --exclude "*.sh" \
    --exclude "bucket-policy.json" \
    --delete

# Set content types
echo "🔧 Setting content types..."
aws s3 cp index.html s3://$BUCKET_NAME/index.html --content-type "text/html"
aws s3 cp app.js s3://$BUCKET_NAME/app.js --content-type "application/javascript"
aws s3 cp stacks.json s3://$BUCKET_NAME/stacks.json --content-type "application/json"

# Invalidate CloudFront cache (if using CloudFront)
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "☁️ Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
fi

echo "✅ Deployment complete!"
echo "🌐 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
EOF

chmod +x deploy.sh
```

### GitHub Actions Deployment (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to S3

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to S3
      run: |
        aws s3 sync . s3://${{ secrets.S3_BUCKET_NAME }} --delete --exclude "*.git/*" --exclude "*.md"
        aws s3 cp index.html s3://${{ secrets.S3_BUCKET_NAME }}/index.html --content-type "text/html"
        aws s3 cp app.js s3://${{ secrets.S3_BUCKET_NAME }}/app.js --content-type "application/javascript"
        aws s3 cp stacks.json s3://${{ secrets.S3_BUCKET_NAME }}/stacks.json --content-type "application/json"
```

## File Structure

```
devops-stack-references/
├── index.html          # Main HTML file
├── app.js             # JavaScript functionality
├── stacks.json        # Stack configurations
├── deploy.sh          # Deployment script
└── README.md          # This file
```

## Customization

### Adding New Stacks

1. **Edit `stacks.json`**:
   ```json
   {
     "id": "new-stack",
     "name": "New Stack",
     "icon": "fab fa-icon",
     "type": "backend|frontend|ml",
     "buildTool": "tool-name",
     "description": "Stack description",
     "buildCommands": ["command1", "command2"],
     "testCommands": ["test1", "test2"],
     "dockerfile": "Dockerfile content...",
     "jenkinsfile": "Pipeline content...",
     "argocdManifest": "Kubernetes manifest...",
     "gotchas": ["tip1", "tip2"]
   }
   ```

2. **Deploy changes**:
   ```bash
   ./deploy.sh
   ```

### Customizing Styles

The website uses Tailwind CSS via CDN. To customize:

1. **Modify Tailwind config** in `index.html`:
   ```javascript
   tailwind.config = {
       theme: {
           extend: {
               colors: {
                   primary: '#your-color',
               }
           }
       }
   }
   ```

2. **Add custom CSS** in the `<style>` section of `index.html`

## Performance Optimizations

- ✅ **CDN Assets**: Tailwind and Font Awesome loaded from CDN
- ✅ **Lazy Loading**: Stack cards rendered on demand
- ✅ **Debounced Search**: Prevents excessive filtering
- ✅ **Minified Output**: Clean, optimized code
- ✅ **Mobile First**: Responsive design patterns

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Add your stack configuration to `stacks.json`
3. Test locally
4. Submit a pull request

## License

MIT License - feel free to use for your own projects!

## Support

For issues or feature requests, please create an issue in the repository.

---

Built with ❤️ for the DevOps community