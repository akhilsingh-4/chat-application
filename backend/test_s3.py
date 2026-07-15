# import boto3
# import os
# from dotenv import load_dotenv

from app.core.config import settings

# load_dotenv()

# s3 = boto3.client("s3",
#                   aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
#                   aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
#                   region_name=os.getenv("AWS_REGION"),
#                 )

# response = s3.list_buckets()

# print("Available Buckets:")
# for bucket in response["Buckets"]:
#     print(bucket["Name"])

print(repr(settings.AWS_ACCESS_KEY_ID))
print(repr(settings.AWS_SECRET_ACCESS_KEY))
print(repr(settings.AWS_S3_ENDPOINT_URL))
print(repr(settings.AWS_REGION))
print(repr(settings.AWS_S3_BUCKET_NAME))