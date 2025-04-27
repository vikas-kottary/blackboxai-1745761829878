import json
import boto3
import os
import base64
from urllib.parse import unquote_plus

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'your-s3-bucket-name')

def lambda_handler(event, context):
    try:
        # Extract file content and metadata from event
        # Assuming event is a base64 encoded file upload via API Gateway proxy integration
        body = event.get('body')
        is_base64_encoded = event.get('isBase64Encoded', False)
        if is_base64_encoded:
            file_content = base64.b64decode(body)
        else:
            file_content = body.encode('utf-8')

        # Extract query parameters for mode and directory
        params = event.get('queryStringParameters') or {}
        mode = params.get('mode', 'temp')
        directory = params.get('directory', '') if mode == 'final' else 'temp'

        # Extract filename from headers or event (simplified)
        filename = event.get('headers', {}).get('filename', 'uploaded_file.pdf')

        # Construct S3 key
        s3_key = f"{directory}/{filename}"

        # Upload to S3
        s3.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=file_content)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'File uploaded successfully', 's3Directory': directory, 's3Key': s3_key})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
