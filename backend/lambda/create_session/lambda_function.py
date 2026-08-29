import json
import boto3
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta


dynamodb = boto3.resource(
    "dynamodb",
    region_name="ap-south-1"
)


table = dynamodb.Table("PresenceX-Sessions")

def lambda_handler(event, context):

    if "body" in event:
        body = event["body"]

        if isinstance(body, str):
            body = json.loads(body)

        event = body

    teacher_id = event.get("TeacherID")
    subject = event.get("subject")
    duration_minutes = event.get("durationMinutes")
    latitude = event.get("latitude")
    longitude = event.get("longitude")
    radius = event.get("radius")

   
    if (
        not teacher_id
        or not subject
        or duration_minutes is None
        or latitude is None
        or longitude is None
        or radius is None
    ):
        return {
            "statusCode": 400,
            "body": json.dumps({
                "success": False,
                "message": "TeacherID, subject, durationMinutes, latitude, longitude and radius are required"
            })
        }
    try:
        
        duration_minutes = int(duration_minutes)
        latitude = Decimal(str(latitude))
        longitude = Decimal(str(longitude))
        radius = Decimal(str(radius))
    except (ValueError, TypeError):
        return {
            "statusCode": 400,
            "body": json.dumps({
                "success": False,
                "message": "Invalid data type in session request"
            })
        }

    try:
        
        session_id = "SES-" + str(uuid.uuid4())[:8].upper()

        created_at = datetime.now(timezone.utc)

        expires_at = created_at + timedelta(minutes=duration_minutes)

        session = {
            "SessionID": session_id,
            "TeacherID": teacher_id,
            "subject": subject,
            "latitude": latitude,
            "longitude": longitude,
            "radius": radius,
            "durationMinutes": duration_minutes,
            "status": "ACTIVE",
            "createdAt": created_at.isoformat(),
            "expiresAt": expires_at.isoformat()
        }

        table.put_item(Item=session)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "success": True,
                "message": "Attendance session created successfully",
                "session": {
                    "SessionID": session_id,
                    "TeacherID": teacher_id,
                    "subject": subject,
                    "latitude": float(latitude),
                    "longitude": float(longitude),
                    "radius": float(radius),
                    "durationMinutes": duration_minutes,
                    "status": "ACTIVE",
                    "createdAt": created_at.isoformat(),
                    "expiresAt": expires_at.isoformat()
                }
            })
        }

    except Exception as error:

        print(f"Session creation error: {str(error)}")

        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": "Failed to create attendance session",
                "error": str(error)
            })
        }