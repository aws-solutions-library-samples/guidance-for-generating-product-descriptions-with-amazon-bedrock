#! /usr/bin/env bash

api_url="$(aws cloudformation describe-stacks \
    --stack-name LambdaStack \
    --query "Stacks[0].Outputs[?OutputKey==\`ApiUrl\`].OutputValue" \
    --output text)"
client_id="$(aws cloudformation describe-stacks \
    --stack-name LambdaStack \
    --query "Stacks[0].Outputs[?OutputKey==\`CognitoClientId\`].OutputValue" \
    --output text)"
user_pool_id="$(aws cloudformation describe-stacks \
    --stack-name LambdaStack \
    --query "Stacks[0].Outputs[?OutputKey==\`CognitoUserPoolId\`].OutputValue" \
    --output text)"

region="$(aws configure get region)"

root="$(git rev-parse --show-toplevel)"
cat <<EOF | tee "$root/source/frontend/src/config.js"
// begin generated code from update-config.sh
export const AWS_REGION = '$region'
export const USER_POOL_ID = '$user_pool_id'
export const USER_POOL_WEB_CLIENT_ID = '$client_id'
export const API_GATEWAY_URL = '$api_url'
// end generated code
EOF