import base64
import json

import boto3


MODEL_CLAUDE = 'anthropic.claude-v2'
MODEL_TITAN = 'amazon.titan-tg1-large'
MODEL_AI21 = 'ai21.j2-grande-instruct'
MODEL_STABLE_DIFFUSION = 'stability.stable-diffusion-xl'


def invoke_bedrock(**kwargs):
    bedrock = boto3.client('bedrock-runtime')
    return bedrock.invoke_model(**kwargs)


def call_rekognition_api(payload):
    # Get the image file from the request
    b64image = payload['image']
    # Call Amazon Rekognition API to detect labels
    rekognition = boto3.client('rekognition')
    response = rekognition.detect_labels(
        Image={'Bytes': base64.b64decode(b64image)},
        MaxLabels=10
    )
    # Extract and return the labels from the response
    labels = [label['Name'] for label in response['Labels']]
    return {'labels': labels}


def predict_titan(payload):
    accept = 'application/json'
    contentType = 'application/json'
    input_text = payload['inputText']
    body = json.dumps({"inputText": input_text})
    response = invoke_bedrock(body=body, modelId=MODEL_TITAN, accept=accept, contentType=contentType)
    response_body = json.loads(response.get('body').read())
    result = {
        'output_text': response_body.get('results')[0].get('outputText')
    }
    return result


def predict_ai21(payload):
    request_body = json.dumps(payload)
    response = invoke_bedrock(
        body=request_body,
        modelId=MODEL_AI21, 
        accept='*/*',
        contentType='application/json'
    )
    response_body = json.loads(response.get('body').read())
    result = {
        'output_text': response_body.get('completions')[0]['data'].get('text')
    }
    return result


def call_stable_diffusion(payload):
    accept = 'application/json'
    contentType = 'application/json'
    response = invoke_bedrock(
        body=payload['body'], 
        modelId=MODEL_STABLE_DIFFUSION, 
        accept=accept,
        contentType=contentType
    )
    response_body = json.loads(response.get('body').read())
    return response_body


def predict_claude(payload):
    body = json.loads(payload['body'])
    prompt = '\n\nHuman: '+ body['prompt'] + ' \n\nAssistant:'
    body['prompt'] = prompt
    
    response = invoke_bedrock(
        body=json.dumps(body),
        modelId=MODEL_CLAUDE,
        accept='application/json',
        contentType='application/json'
    )
    response_body = json.loads(response.get('body').read())
    print(response_body)
    return response_body['completion']


def handler(event, context):
    path_method_fn = {
        ('/api/call-rekognition-api', 'POST'): call_rekognition_api,
        ('/api/conversation/predict-claude', 'POST'): predict_claude,
        ('/api/conversation/predict-titan', 'POST'): predict_titan,
        ('/api/conversation/predict-ai21', 'POST'): predict_ai21,
        ('/api/call-stablediffusion', 'POST'): call_stable_diffusion
    }
    payload = json.loads(event['body'])
    result = path_method_fn[(event['path'], event['httpMethod'])](payload)
    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }