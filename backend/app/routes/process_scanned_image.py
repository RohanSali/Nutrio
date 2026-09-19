import asyncio
import random

from fastapi import APIRouter, BackgroundTasks, File, Header, HTTPException, UploadFile

from app.routes.images import upload_user_image
from app.services.firebase import get_firestore_client

router = APIRouter(
    prefix="/api",
    tags=["Image Processing"],
)


async def run_scan_processing(scan_id: str):
    scan_reference = get_firestore_client().collection("scans").document(scan_id)

    try:
        await asyncio.sleep(random.uniform(0.4, 1.0))
        scan_reference.update({"processingStatus": "processing"})

        # Here main LLM code will be added!
        await asyncio.sleep(random.uniform(0.5, 1.2))
        scores = {
            "calories": random.randint(0, 100),
            "nutrients": random.randint(0, 100),
            "healthImpact": random.randint(0, 100),
        }
        grade = random.choice(["A", "B", "C", "D", "E"])
        veg = random.choice([True, False])
        food_detected = random.choice([
            "Breakfast cereal", "Snack bar", "Potato chips", "Fruit drink", "Paneer", "Chicken Tikka Masala"
        ])
        allergies_detected = random.sample(
            ["Egg allergy", "Peanut allergy", "Soy allergy", "Wheat allergy", "Fish allergy", "Lactose intolerance"], k=random.randint(0, 2)
        )
        alternative_products = [
            {
                "name": product,
                "imageUrl": None,
                "grade": random.choice(["A", "B", "C"]),
                "reason": "A randomly selected alternative for this demo.",
                "highlights": ["Demo recommendation"],
            }
            for product in random.sample(
                ["Oat milk", "Almond yogurt", "Whole grain crackers", "Fruit bar"],
                k=random.randint(0, 2),
            )
        ]
        constituents_breakdown = {
            name: {
                "name": name,
                "level": level,
                "summary": f"{name} detected in the product.",
                "details": "Detailed constituent analysis will be added with the main LLM.",
                "isAdditive": is_additive,
                "isDiseaseProne": is_disease_prone,
                "conditions": ["Diabetes"] if is_disease_prone else [],
            }
            for name, level, is_additive, is_disease_prone in random.sample(
                [("Sugar", "High", False, True), ("Sodium", "Medium", False, True),
                 ("INS 211", "Low", True, False), ("Fiber", "Good", False, False)],
                k=random.randint(1, 3),
            )
        }
        await asyncio.sleep(random.uniform(0.5, 1.2))
        scan_reference.update({
            "veg": veg,
            "foodDetected": food_detected,
            "scores": scores,
            "grade": grade,
            "allergiesDetected": allergies_detected,
            "constituentsBreakdown": constituents_breakdown,
            "alternativeProducts": alternative_products,
        })
        await asyncio.sleep(random.uniform(0.4, 1.0))
        scan_reference.update({"processingStatus": "complete"})
    except Exception as error:
        print("IMAGE PROCESSING ERROR:", repr(error))
        scan_reference.set({"processingStatus": "failed"}, merge=True)


@router.post("/process_image")
async def process_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    upload_result = await upload_user_image(file, authorization)
    firestore_client = get_firestore_client()
    scan_id = upload_result["scanId"]
    uid = upload_result["uid"]

    firestore_client.collection("scans").document(scan_id).set({
        "userId": uid,
        "veg": None,
        "foodDetected": None,
        "imageUrl": upload_result["url"],
        "scores": {"calories": None, "nutrients": None, "healthImpact": None},
        "grade": None,
        "allergiesDetected": [],
        "constituentsBreakdown": {},
        "alternativeProducts": [],
        "processingStatus": "pending",
    })
    firestore_client.collection("history", uid, "scans").document(scan_id).set({
        "scanId": scan_id,
    })
    background_tasks.add_task(run_scan_processing, scan_id)

    return {**upload_result, "processingStatus": "pending"}
