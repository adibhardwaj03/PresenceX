import json
import boto3
import uuid
from datetime import datetime, timezone, timedelta

dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")

table = dynamodb.Table("PresenceX-Sessions")

def lambda_handler(event, context):
    
    teacher_id = event.get("TeacherID")
    subject = event.get("subject")
    duration_minutes = event.get("durationMinutes")
    latitude = event.get("latitude")
    longitude = event.get("longitude")
    radius = event.get("radius")

    if not all([
        teacher_id,
        subject,
        duration_minutes,
        latitude is not None,
        longitude is not None,
        radius is not None
    ]):
        return {
            "statusCode": 400,
            "body": json.dumps({
                "success": False,
                "message": "TeacherID, subject, durationMinutes, latitude, longitude and radius are required"
            })
        }

    try:
        
        duration_minutes = int(duration_minutes)
        latitude = float(latitude)
        longitude = float(longitude)
        radius = float(radius)

           
        if duration_minutes <= 0:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Duration must be greater than 0"
                })
            }

        if not (-90 <= latitude <= 90):
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid latitude"
                })
            }

        if not (-180 <= longitude <= 180):
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid longitude"
                })
            }

        if radius <= 0:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Radius must be greater than 0"
                })
            }

        
        session_id = f"SES-{uuid.uuid4().hex[:8].upper()}"
       
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
                "session": session
            })
        }

    except (ValueError, TypeError):
        return {
            "statusCode": 400,
            "body": json.dumps({
                "success": False,
                "message": "Invalid data type in session request"
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