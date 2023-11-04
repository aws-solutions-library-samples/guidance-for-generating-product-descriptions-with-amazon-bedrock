#! /usr/bin/env bash

email_address="$1"

if [ -z $email_address ]; then
    echo "Email address must be provided as an argument to this script"
    echo "Example:"
    echo "  deployment/create-user.sh foo@example.com"
    exit 1
fi

user_pool_id="$(aws cloudformation describe-stacks \
    --stack-name LambdaStack \
    --query "Stacks[0].Outputs[?OutputKey==\`CognitoUserPoolId\`].OutputValue" \
    --output text)"

aws cognito-idp admin-create-user \
    --user-pool-id $user_pool_id \
    --username $email_address \
    --user-attributes Name="email",Value="$email_address"