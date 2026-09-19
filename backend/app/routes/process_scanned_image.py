import random

from fastapi import APIRouter, File, Header, HTTPException, UploadFile

from app.routes.images import upload_user_image

router = APIRouter(
    prefix="/api",
    tags=["Image Processing"],
)


@router.post("/process_image")
async def process_image(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    processing_status = "Processing"

    try:
        upload_result = await upload_user_image(file, authorization)

        # Here main LLM code will be added!
        scores = {
            "calories": random.randint(0, 100),
            "nutrients": random.randint(0, 100),
            "healthImpact": random.randint(0, 100),
        }
        grade = random.choice(["A", "B", "C", "D", "F"])
        allergies_detected = random.sample(
            ["Milk", "Peanuts", "Soy", "Wheat"],
            k=random.randint(0, 2),
        )
        alternative_products = random.sample(
            ["Oat milk", "Almond yogurt", "Whole grain crackers", "Fruit bar"],
            k=random.randint(0, 2),
        )
        processed_findings = random.sample(
            ["High protein", "Low sodium", "Contains added sugar", "Good source of fiber"],
            k=random.randint(1, 3),
        )
        processing_status = "Success"

        return {
            **upload_result,
            "scores": scores,
            "grade": grade,
            "allergiesDetected": allergies_detected,
            "alternativeProducts": alternative_products,
            "processedFindings": processed_findings,
            "processingStatus": processing_status,
        }
    except HTTPException:
        raise
    except Exception as error:
        processing_status = "Failed"
        print("IMAGE PROCESSING ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to process image",
                "processingStatus": processing_status,
            },
        )
