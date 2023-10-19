# Building Product Descriptions with AWS Bedrock and Rekognition

This solution contains a flask backend and ReactJS front-end application which creates product descriptions from images, images and product descriptions from text input, enhances and translates product descriptions using Amazon Web Services (AWS) new, managed LLM-provider service, Amazon Bedrock.

## Prerequisites

You'll need to install all prerequisites on your local operating machine.
    
For the Lambda backend, you'll need to have:
1. [Python 3.8 or higher](https://www.python.org/downloads/macos/)
2. Install the AWS CDK Toolkit (the `cdk` command) as documented [here](https://docs.aws.amazon.com/cdk/v2/guide/cli.html). You will also need to run `cdk bootstrap` if you haven't used the CDK before in your account as discussed [here](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html).
3. The [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
4. [Docker](https://www.docker.com/) is required to allow the CDK to package the Lambda code together with the necessary Python dependencies
5. If you get a cdk nag error run this `pip3 install cdk-nag`

For the React frontend, you'll need to install the following:
1. [Node.js & npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
2. Install the NPM dependencies with `npm install`

Finally, in order to allow the frontend to authenticate to the backend:
1. You will need [Docker](https://www.docker.com/) to run the [aws-sigv4-proxy](https://github.com/awslabs/aws-sigv4-proxy/tree/master).
2. You will need to export AWS API authentication information via environment variables as documented [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) (other authentication methods will not be passed to the proxy)

**NOTE:** Docker must be installed and _running_. You can ensure that the Docker daemon is running by ensuring that a command like `docker ps` runs without error. If no containers are running, then `docker ps` should return an empty list of containers like this:

```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

## IAM Permission

The CDK and CloudFormation will provision an IAM user with the credentials necessary to invoke Amazon Rekognition and Amazon Bedrock from Lambda. You will be asked to confirm creation of this role when running `cdk deploy`.

## How to Run

1. First, deploy the AWS infrastructure by running `cd backend && cdk deploy`
2. Next, register to the Cognito User Pool. The user-pool-id will have outputted from the CDK execution. Modify the following code snippet to use the user_pool_id and your email.

```
aws cognito-idp admin-create-user \
    --user-pool-id <<user_pool_uid>> \
    --username <<email_address>> \
    --user-attributes Name="email",Value="<<email_address>>" Name="family_name",Value="Foobar" \
    --region us-west-2
```

3. You'll receive a temporary password in your email shortly. You'll need to use that to sign into the application for the first time, after which you'll be asked to change your password.
 
4. Configure the front end application with the outputs from the CDK execution. In `./src/config.js`, replace each value with those printed as outputs from CDK.
   
```
Fill these out using exports from CDK exeuction
export const AWS_REGION = ''
export const USER_POOL_ID = ''
export const USER_POOL_WEB_CLIENT_ID = ''
export const API_GATEWAY_URL = ''
```

5. In another terminal session, run `npm start`
6. When finished, you can clean up AWS resources by running `cd backend && cdk destroy`

## Costs for running the sample code

Note that this sample project will incur costs in your AWS account, including:

- Data transfer costs
- API Gateway API Calls
- Lambda function invocation
- CloudWatch log collection and storage
- Amazon Rekognition usage
- Amazon Bedrock usage

All resources provisioned by the solution can be deleted from your account by running `cdk destroy` with the exception of CloudWatch logs. Logs can be found by searching CloudWatch log groups for the CDK stack name (`LambdaStack` by default) and deleting the groups.