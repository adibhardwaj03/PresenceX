import json
import math
import boto3
from datetime import datetime, timezone
from decimal import Decimal


dynamodb = boto3.resource("dynamodb")

sessions_table = dynamodb.Table("PresenceX-Sessions")
attendance_table = dynamodb.Table("PresenceX-Attendance")


def response(status_code, data):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(data, default=float)
    }


def calculate_distance(lat1, lon1, lat2, lon2):

    earth_radius = 6371000

    lat1 = math.radians(float(lat1))
    lon1 = math.radians(float(lon1))
    lat2 = math.radians(float(lat2))
    lon2 = math.radians(float(lon2))

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius * c


def lambda_handler(event, context):

    try:

        method = event.get("requestContext", {}).get("http", {}).get("method")

        if method == "OPTIONS":
            return response(200, {"success": True})

        body = event.get("body", {})

        if isinstance(body, str):
            body = json.loads(body)

        session_id = body.get("SessionID")
        student_id = body.get("StudentID")
        student_latitude = body.get("latitude")
        student_longitude = body.get("longitude")

        if not session_id:
            return response(400, {
                "success": False,
                "message": "SessionID is required"
            })

        if not student_id:
            return response(400, {
                "success": False,
                "message": "StudentID is required"
            })

        if student_latitude is None or student_longitude is None:
            return response(400, {
                "success": False,
                "message": "Student location is required"
            })

        student_latitude = float(student_latitude)
        student_longitude = float(student_longitude)

        result = sessions_table.get_item(
            Key={"SessionID": session_id}
        )

        session = result.get("Item")

        if not session:
            return response(404, {
                "success": False,
                "message": "Attendance session not found"
            })

        if session.get("status") != "ACTIVE":
            return response(400, {
                "success": False,
                "message": "Attendance session is not active"
            })

        expires_at = session.get("expiresAt")

        if expires_at:
            expiry_time = datetime.fromisoformat(
                expires_at.replace("Z", "+00:00")
            )

            if datetime.now(timezone.utc) >= expiry_time:
                return response(400, {
                    "success": False,
                    "message": "Attendance session has expired"
                })

        teacher_latitude = session.get("latitude")
        teacher_longitude = session.get("longitude")
        radius = session.get("radius")

        if (
            teacher_latitude is None
            or teacher_longitude is None
            or radius is None
        ):
            return response(500, {
                "success": False,
                "message": "Session location information is incomplete"
            })

        distance = calculate_distance(
            teacher_latitude,
            teacher_longitude,
            student_latitude,
            student_longitude
        )

        if distance > float(radius):
            return response(403, {
                "success": False,
                "message": "You are outside the allowed attendance area",
                "distanceMeters": round(distance, 2),
                "allowedRadiusMeters": float(radius)
            })

        attendance_id = f"{session_id}#{student_id}"

        attendance_record = {
            "AttendanceID": attendance_id,
            "SessionID": session_id,
            "StudentID": student_id,
            "status": "PRESENT",
            "markedAt": datetime.now(timezone.utc).isoformat(),
            "latitude": Decimal(str(student_latitude)),
            "longitude": Decimal(str(student_longitude)),
            "distanceMeters": Decimal(str(round(distance, 2))),
            "verification": "QR + LOCATION"
        }

        attendance_table.put_item(
            Item=attendance_record,
            ConditionExpression="attribute_not_exists(AttendanceID)"
        )

        return response(200, {
            "success": True,
            "message": "Attendance marked successfully",
            "attendance": attendance_record
        })

    except Exception as error:

        if "ConditionalCheckFailedException" in str(error):
            return response(409, {
                "success": False,
                "message": "Attendance has already been marked for this session"
            })

        print("Error:", str(error))

        return response(500, {
            "success": False,
            "message": "Internal server error"
        })