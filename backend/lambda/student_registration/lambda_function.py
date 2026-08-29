import json
import boto3
from datetime import datetime, timezone



dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
rekognition = boto3.client("rekognition", region_name="ap-south-1")


table = dynamodb.Table("PresenceX-Students")

BUCKET_NAME = "presencex-face-storage-aditya-2004"
COLLECTION_ID = "PresenceX-Faces"


def lambda_handler(event, context):

    
    student_id = event.get("StudentID")
    name = event.get("name")
    email = event.get("email")
    image_key = event.get("imageKey")

    
    if not student_id or not name or not email or not image_key:
        return {
            "statusCode": 400,
            "body": json.dumps({
                "success": False,
                "message": "StudentID, name, email and imageKey are required"
            })
        }

    try:
    
        rekognition_response = rekognition.index_faces(
            CollectionId=COLLECTION_ID,
            Image={
                "S3Object": {
                    "Bucket": BUCKET_NAME,
                    "Name": image_key
                }
            },
            ExternalImageId=student_id,
            MaxFaces=1,
            QualityFilter="AUTO",
            DetectionAttributes=[]
        )

        
        face_records = rekognition_response.get("FaceRecords", [])

        if not face_records:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "No usable face detected in the image"
                })
            }

     
        face_id = face_records[0]["Face"]["FaceId"]

        student = {
            "StudentID": student_id,
            "name": name,
            "email": email,
            "faceId": face_id,
            "status": "ACTIVE",
            "createdAt": datetime.now(timezone.utc).isoformat()
        }

        table.put_item(Item=student)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "success": True,
                "message": "Student registered successfully",
                "student": student
            })
        }

    except Exception as error:

        print(f"Registration error: {str(error)}")

        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": "Student registration failed",
                "error": str(error)
            })
        }