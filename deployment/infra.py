from aws_cdk import (
    BundlingOptions,
    Duration,
    CfnOutput,
    Stack,
    aws_apigateway as _apigw,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_cognito as _cognito,
    Aspects
)
from constructs import Construct
import cdk_nag


class LambdaStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        ## userpool for api access
        api_userpool = _cognito.UserPool(
            self, "APIPool",
            advanced_security_mode=_cognito.AdvancedSecurityMode.ENFORCED,
            password_policy=_cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_digits=True,
                require_symbols=True,
                require_uppercase=True
            )
        )

        ## api pool client for registration
        api_pool_client = api_userpool.add_client("app-client")

        ## authentication authorizer for apiGW
        api_auth = _apigw.CognitoUserPoolsAuthorizer(
            self, 'api_authorizer',
            cognito_user_pools=[api_userpool]
        )

        ## output user pool ID for user sign up
        CfnOutput(
            self, 'CognitoUserPoolId',
            value=api_userpool.user_pool_id
        )

        ## output client ID for user sign up
        CfnOutput(
            self, 'CognitoClientId',
            value=api_pool_client.user_pool_client_id
        )

        fn_policy_doc = iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=["bedrock:InvokeModel"],
                        resources=[f"arn:{self.partition}:bedrock:{self.region}::foundation-model/*"]),
                        iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=["rekognition:DetectLabels"],
                        # No specific resources for DetectLabels
                        resources=["*"]),
                        iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                        ],
                        resources=[f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/LambdaStack-*"])
                    ]
                )
        
        lambda_role = iam.Role(self, "fn-role", assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
                        inline_policies={"fn-policy": fn_policy_doc})
        
        # Lambda
        fn = _lambda.Function(self, "Function",
            code=_lambda.Code.from_asset(f"{__file__}/../..", exclude=["cdk.out"],
                bundling=BundlingOptions(
                    image=_lambda.Runtime.PYTHON_3_11.bundling_image,
                    command=["bash", "-c", "pip install -r source/backend/requirements.txt -t /asset-output && cp source/backend/lambda_fn.py /asset-output"],
                )
            ),
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="lambda_fn.handler",
            architecture=_lambda.Architecture.X86_64,
            timeout=Duration.seconds(60),
            memory_size=1024,
            role=lambda_role
        )

        ## base API for post requests from front end
        front_end_api = _apigw.RestApi(
            self, 'bedrock_lambda_api',
            rest_api_name='bedrock_lambda_api'
        )
        CfnOutput(self, "ApiUrl", value=front_end_api.url)

        api_validator = _apigw.RequestValidator(
            self, "feValidator",
            rest_api=front_end_api,
            validate_request_body=True,
            validate_request_parameters=True
        )

        ## this adds /bedrock onto the api and enables cors
        api_resource = front_end_api.root.add_resource(
            'bedrock',
            default_cors_preflight_options=_apigw.CorsOptions(
                allow_methods=['GET', 'OPTIONS', 'POST'],
                allow_origins=_apigw.Cors.ALL_ORIGINS)
        )

        ## this makes the resource integrate with our _lambda
        api_lambda_integration = _apigw.LambdaIntegration(
            fn,
            proxy=False,
            integration_responses=[
                _apigw.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                )
            ]
        )

        ## this adds a POST method on our resource
        api_resource.add_method(
            'POST', api_lambda_integration,
            method_responses=[
                _apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        'method.response.header.Access-Control-Allow-Origin': True
                    }
                )
            ],
            authorizer=api_auth,
            authorization_type=_apigw.AuthorizationType.COGNITO
        )


        _NagSuppressions = cdk_nag.NagSuppressions()

        # Add Nag Suppressions here

        _NagSuppressions.add_resource_suppressions(
            lambda_role,
            suppressions=[
                {
                    "id": "AwsSolutions-IAM5",
                    "reason": "The wildcard exists to allow the lambda function to invoke any foundational model in Bedrock. Users must explicitly enable access to all foundational models in the Amazon Bedrock Web Console first."
                }
            ],
            apply_to_children=True
        )

        _NagSuppressions.add_resource_suppressions(
            fn,
            suppressions=[
                {
                    "id": "AwsSolutions-L1",
                    "reason": "The Lambda function is using the latest available runtime for the targeted language."
                }
            ],
            apply_to_children=True
        )

        _NagSuppressions.add_resource_suppressions(
            front_end_api,
            suppressions=[
                {
                    "id": "AwsSolutions-APIG1",
                    "reason": "All remaining methods which do not have logging enabled are OPTIONS methods."
                },
                {
                    "id": "AwsSolutions-APIG4",
                    "reason": "All remaining methods which do not have logging enabled are OPTIONS methods."
                },
                {
                    "id": "AwsSolutions-COG4",
                    "reason": "All remaining methods which do not have logging enabled are OPTIONS methods."
                },
                {
                    "id": "AwsSolutions-APIG6",
                    "reason": "All remaining methods which do not have logging enabled are OPTIONS methods."
                }
            ],
            apply_to_children=True
        )

        Aspects.of(self).add(cdk_nag.AwsSolutionsChecks(verbose=True))

        