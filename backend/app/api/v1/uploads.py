from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.core.dependencies import get_current_admin
from app.services.storage_service import StorageService

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/image", summary="Upload product image (Admin)")
async def upload_product_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin),
):
    """Secure image upload endpoint for product catalog with Cloudinary support and signature verification."""
    content_type = file.content_type or ""
    file_bytes = await file.read()

    try:
        result = StorageService.upload_product_image(
            file_bytes=file_bytes,
            original_filename=file.filename or "uploaded_product.jpg",
            declared_mime=content_type,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
