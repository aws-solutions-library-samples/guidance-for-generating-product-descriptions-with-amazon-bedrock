#! /usr/bin/env bash

set -eu


API_HOST="$(aws cloudformation describe-stacks --stack-name LambdaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text \
  | awk -F[/:] '{print $4}')"

API_REGION="$(echo $API_HOST | awk -F. '{print $3}')"
  
docker run --rm -ti \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN \
  -p 8080:8080 \
  public.ecr.aws/aws-observability/aws-sigv4-proxy:1.7 -v --host "$API_HOST" \
  --name execute-api --region "$API_REGION"