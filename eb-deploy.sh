#!/bin/bash
# Elastic Beanstalk fast deployment script for NextLib Smart Library Management
# Prerequisites: AWS CLI configured, EB CLI installed (pip install awsebcli), Docker installed.

set -e

# 1. Initialize EB application (run only once)
if [ ! -d ".elasticbeanstalk" ]; then
  echo "Initializing Elastic Beanstalk application..."
  eb init -p docker nextlib-smartlibrary --region us-east-1
fi

# 2. Create or use environment
ENV_NAME="nextlib-env"
if eb status $ENV_NAME > /dev/null 2>&1; then
  echo "Environment $ENV_NAME already exists. Skipping creation."
else
  echo "Creating environment $ENV_NAME..."
  eb create $ENV_NAME --single --instance_type t2.micro --scale 1
fi

# 3. Set environment variables (replace <YOUR_MONGO_URI> with your actual connection string)
echo "Setting environment variables..."
eb setenv MONGO_URI=<YOUR_MONGO_URI>

# 4. Deploy latest code
echo "Deploying application..."
eb deploy $ENV_NAME

echo "✅ Deployment to Elastic Beanstalk completed. Visit the URL provided by EB."
