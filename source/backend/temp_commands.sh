aws cognito-idp admin-create-user \
    --user-pool-id us-west-2_QiGR0U5Cq \
    --username marshbun@amazon.com \
    --user-attributes Name="email",Value="marshbun@amazon.com" Name="family_name",Value="Foobar" \
    --region us-west-2

# get temp password from email

aws cognito-idp admin-confirm-sign-up \
    --user-pool-id us-west-2_9pLputrWN \
    --username marshbun@amazon.com \
    --region us-west-2

