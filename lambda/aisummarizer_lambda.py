import json
import boto3
import os

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'your-s3-bucket-name')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        s3_directory = body.get('s3Directory')
        if not s3_directory:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 's3Directory parameter is required'})
            }

        # List objects in the given S3 directory
        prefix = s3_directory if s3_directory.endswith('/') else s3_directory + '/'
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)

        if 'Contents' not in response:
            return {
                'statusCode': 200,
                'body': json.dumps({'summary': 'No files found in the specified directory.'})
            }

        # Simulate summary generation by listing file names
        file_names = [obj['Key'].split('/')[-1] for obj in response['Contents']]
        summary_text = f"Summary of files in {s3_directory}:\n" + "\n".join(file_names)

        return {
            'statusCode': 200,
            'body': json.dumps({'summary': summary_text})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
