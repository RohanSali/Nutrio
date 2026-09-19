from fastapi import FastAPI

from app.routes.images import router as images_router
from app.routes.process_scanned_image import router as process_scanned_image_router


app = FastAPI(
    title="Nutrio Backend Server",
    version="1.0.0"
)


app.include_router(images_router)
app.include_router(process_scanned_image_router)


@app.get("/")
def root():

    return {
        "message": "Nutrio Backend Server is running"
    }