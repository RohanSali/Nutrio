from imagekitio import ImageKit

from app.config import IMAGEKIT_PRIVATE_KEY


imagekit = ImageKit(
    private_key=IMAGEKIT_PRIVATE_KEY
)


def upload_image(
    file_data: bytes,
    file_name: str,
    folder: str
):

    response = imagekit.files.upload(
        file=file_data,
        file_name=file_name,
        folder=folder,
        use_unique_file_name=True,
    )

    return response