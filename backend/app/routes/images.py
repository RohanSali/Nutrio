from uuid import uuid4
import json
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Header,
    HTTPException,
)
from app.services.imagekit import upload_image as upload_to_imagekit
from app.services.firebase import verify_firebase_token

router = APIRouter(
    prefix="/api/images",
    tags=["Images"]
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


@router.post("/uploadImage")
async def upload_user_image(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):

    # Check Authorization header
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required",
        )

    if not authorization.startswith(
        "Bearer "
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    id_token = authorization.replace(
        "Bearer ",
        "",
        1
    )

    # Verify Firebase user
    try:
        decoded_token = verify_firebase_token(id_token)
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase token",
        )

    # Validate file type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG and WebP images are allowed",
        )

    # Read file
    file_data = await file.read()

    # Validate file size
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 100 MB",
        )

    if len(file_data) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty",
        )

    # Generate server-controlled path
    scan_id = str(uuid4())
    original_name = file.filename or "image.jpg"
    extension = original_name.split(".")[-1].lower()
    file_name = f"{scan_id}.{extension}"
    folder = f"/users/{uid}"

    # Upload to ImageKit
    try:
        result = upload_to_imagekit(
            file_data=file_data,
            file_name=file_name,
            folder=folder,
        )

    except Exception as e:
        print(
            "IMAGEKIT UPLOAD ERROR:",
            repr(e)
        )
        raise HTTPException(
            status_code=502,
            detail="Failed to upload image to ImageKit",
        )


    # Return ImageKit information
    return {
        "success": True,
        "scanId": scan_id,
        "uid": uid,
        "fileId": result.file_id,
        "filePath": result.file_path,
        "url": result.url,
        "fileName": result.name,
    }