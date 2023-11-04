#!/usr/bin/env python3
import os

import aws_cdk as cdk

from infra import LambdaStack


app = cdk.App()
LambdaStack(app, "LambdaStack")
app.synth()
