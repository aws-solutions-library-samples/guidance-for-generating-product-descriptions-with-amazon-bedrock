from aws_cdk import (
    BundlingOptions,
    Duration,
    CfnOutput,
    Stack,
    aws_apigateway as apigw,
    aws_iam as iam,
    aws_lambda as cdk_lambda,
    aws_logs as logs
)
from constructs import Construct


class LambdaStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
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
        fn = cdk_lambda.Function(self, "Function",
            code=cdk_lambda.Code.from_asset(f"{__file__}/..", exclude=["cdk.out"],
                bundling=BundlingOptions(
                    image=cdk_lambda.Runtime.PYTHON_3_11.bundling_image,
                    command=["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp lambda_fn.py /asset-output"],
                )
            ),
            runtime=cdk_lambda.Runtime.PYTHON_3_11,
            handler="lambda_fn.handler",
            architecture=cdk_lambda.Architecture.X86_64,
            timeout=Duration.seconds(60),
            memory_size=1024,
            role=lambda_role
        )
        opts = apigw.MethodOptions(authorization_type=apigw.AuthorizationType.IAM)
        log_group = logs.LogGroup(self, "ApiLogs")
        api = apigw.LambdaRestApi(self, "api",
            handler=fn,
            default_method_options=opts,
            cloud_watch_role=True,
            deploy_options=apigw.StageOptions(access_log_destination=apigw.LogGroupLogDestination(log_group))
        )
        CfnOutput(scope=self, id="ApiUrl", value=api.url)