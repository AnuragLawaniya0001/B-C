import os
import uuid
import re
from typing import Dict, Any, Optional, Tuple
try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
except ImportError:
    cloudinary = None

from app.core.config import settings

def is_cloudinary_configured() -> bool:
    """Verify and initialize Cloudinary SDK if credentials exist."""
    if not cloudinary:
        return False
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        return True
    return False

# Base uploads directory (Docker mounted at /app/backend/uploads)
UPLOAD_BASE_DIR = os.path.join(os.getcwd(), "uploads")
MEDIA_IMAGES_DIR = os.path.join(UPLOAD_BASE_DIR, "media", "images")
MEDIA_VIDEOS_DIR = os.path.join(UPLOAD_BASE_DIR, "media", "videos")
MEDIA_THUMBS_DIR = os.path.join(UPLOAD_BASE_DIR, "media", "thumbnails")

for d in [MEDIA_IMAGES_DIR, MEDIA_VIDEOS_DIR, MEDIA_THUMBS_DIR]:
    os.makedirs(d, exist_ok=True)

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

ALLOWED_IMAGE_MIMES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}

ALLOWED_VIDEO_MIMES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
}


def verify_file_signature(file_bytes: bytes, declared_mime: str) -> bool:
    """Validate true file signatures (magic bytes) to prevent spoofed MIME uploads."""
    if not file_bytes or len(file_bytes) < 4:
        return False

    # JPEG
    if declared_mime in ("image/jpeg", "image/jpg"):
        return file_bytes.startswith(b"\xff\xd8\xff")

    # PNG
    if declared_mime == "image/png":
        return file_bytes.startswith(b"\x89PNG\r\n\x1a\n")

    # GIF
    if declared_mime == "image/gif":
        return file_bytes.startswith(b"GIF87a") or file_bytes.startswith(b"GIF89a")

    # WEBP
    if declared_mime == "image/webp":
        return len(file_bytes) >= 12 and file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP"

    # SVG
    if declared_mime == "image/svg+xml":
        header_sample = file_bytes[:512].lower()
        return b"<svg" in header_sample or (b"<?xml" in header_sample and b"<svg" in file_bytes[:2048].lower())

    # MP4
    if declared_mime in ("video/mp4", "video/quicktime"):
        # Look for 'ftyp' box in first 32 bytes
        return b"ftyp" in file_bytes[:32] or b"moov" in file_bytes[:64]

    # WEBM
    if declared_mime == "video/webm":
        return file_bytes.startswith(b"\x1a\x45\xdf\xa3")

    return False


def inspect_image_dimensions(filepath: str) -> Tuple[Optional[int], Optional[int]]:
    """Extract width and height for image files using PIL if available."""
    if not Image:
        return None, None
    try:
        with Image.open(filepath) as img:
            return img.width, img.height
    except Exception:
        return None, None


def inspect_video_metadata(filepath: str) -> Tuple[Optional[int], Optional[int], Optional[float]]:
    """Extract width, height, and duration for video files using OpenCV."""
    if not cv2:
        return None, None, None
    try:
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            return None, None, None
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
        duration = round(frame_count / fps, 2) if fps > 0 else 0.0
        cap.release()
        return width, height, duration
    except Exception:
        return None, None, None


class StorageService:
    """Storage abstraction for saving, replacing, and inspecting media assets.
    Designed for local filesystem with Docker volume persistence, readily extensible to S3/MinIO.
    """

    @staticmethod
    def save_media(
        file_bytes: bytes,
        original_filename: str,
        declared_mime: str,
    ) -> Dict[str, Any]:
        """Save an uploaded image or video, validate its signature, and extract dimensions."""
        is_image = declared_mime in ALLOWED_IMAGE_MIMES
        is_video = declared_mime in ALLOWED_VIDEO_MIMES

        if not is_image and not is_video:
            raise ValueError(f"Unsupported media MIME type '{declared_mime}'.")

        # Size enforcement
        max_size = MAX_IMAGE_SIZE_BYTES if is_image else MAX_VIDEO_SIZE_BYTES
        if len(file_bytes) > max_size:
            limit_mb = max_size // (1024 * 1024)
            raise ValueError(f"File size exceeds limit of {limit_mb} MB ({len(file_bytes)} bytes).")

        # Signature verification
        if not verify_file_signature(file_bytes, declared_mime):
            raise ValueError("File content does not match the declared file signature / format.")

        ext = (
            ALLOWED_IMAGE_MIMES.get(declared_mime)
            if is_image
            else ALLOWED_VIDEO_MIMES.get(declared_mime, ".mp4")
        )
        media_id = f"med_{uuid.uuid4().hex[:12]}"
        safe_name = f"{media_id}{ext}"

        subfolder = MEDIA_IMAGES_DIR if is_image else MEDIA_VIDEOS_DIR
        filepath = os.path.join(subfolder, safe_name)

        with open(filepath, "wb") as f:
            f.write(file_bytes)

        relative_url = f"/uploads/media/{'images' if is_image else 'videos'}/{safe_name}"

        width, height, duration = None, None, None
        if is_image:
            width, height = inspect_image_dimensions(filepath)
        elif is_video:
            width, height, duration = inspect_video_metadata(filepath)

        # Upload directly to Cloudinary if configured
        cloudinary_url = relative_url
        if is_cloudinary_configured():
            try:
                cloud_folder = "bigchamp/media/images" if is_image else "bigchamp/media/videos"
                cloud_res = cloudinary.uploader.upload(
                    filepath,
                    public_id=f"{cloud_folder}/{media_id}",
                    resource_type="image" if is_image else "video",
                    overwrite=True,
                )
                cloudinary_url = cloud_res.get("secure_url", relative_url)
                if is_image:
                    width = cloud_res.get("width", width)
                    height = cloud_res.get("height", height)
                elif is_video:
                    width = cloud_res.get("width", width)
                    height = cloud_res.get("height", height)
                    duration = cloud_res.get("duration", duration)
            except Exception as e:
                print(f"Cloudinary upload fallback to local: {e}")

        return {
            "media_id": media_id,
            "filename": safe_name,
            "original_filename": original_filename,
            "url": cloudinary_url,
            "filepath": filepath,
            "media_type": "image" if is_image else "video",
            "mime_type": declared_mime,
            "file_size": len(file_bytes),
            "width": width,
            "height": height,
            "duration_seconds": duration,
        }

    @staticmethod
    def upload_product_image(
        file_bytes: bytes,
        original_filename: str,
        declared_mime: str,
    ) -> Dict[str, Any]:
        """Upload product image to Cloudinary (folder 'bigchamp/products') with local persistence."""
        if declared_mime not in ALLOWED_IMAGE_MIMES:
            raise ValueError(f"Invalid image format '{declared_mime}'. Supported formats: JPEG, PNG, WEBP, GIF, SVG.")

        if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise ValueError(f"Image exceeds size limit of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.")

        if not verify_file_signature(file_bytes, declared_mime):
            raise ValueError("File content signature does not match declared image format.")

        ext = ALLOWED_IMAGE_MIMES[declared_mime]
        prod_id = f"prod_{uuid.uuid4().hex[:12]}"
        safe_name = f"{prod_id}{ext}"

        prod_dir = os.path.join(UPLOAD_BASE_DIR, "products")
        os.makedirs(prod_dir, exist_ok=True)
        filepath = os.path.join(prod_dir, safe_name)

        with open(filepath, "wb") as f:
            f.write(file_bytes)

        media_url = f"/uploads/products/{safe_name}"
        if is_cloudinary_configured():
            try:
                res = cloudinary.uploader.upload(
                    filepath,
                    public_id=f"bigchamp/products/{prod_id}",
                    resource_type="image",
                    overwrite=True,
                )
                media_url = res.get("secure_url", media_url)
            except Exception as e:
                print(f"Product Cloudinary upload fallback: {e}")

        return {
            "url": media_url,
            "filename": safe_name,
            "size": len(file_bytes),
            "content_type": declared_mime,
        }

    @staticmethod
    def replace_media_file(
        existing_url: str,
        new_file_bytes: bytes,
        declared_mime: str,
    ) -> Dict[str, Any]:
        """Replace file on disk and Cloudinary."""
        is_image = declared_mime in ALLOWED_IMAGE_MIMES
        is_video = declared_mime in ALLOWED_VIDEO_MIMES

        if not verify_file_signature(new_file_bytes, declared_mime):
            raise ValueError("Replacement file signature invalid.")

        width, height, duration = None, None, None

        # If it's a Cloudinary URL, upload directly
        new_url = existing_url
        if is_cloudinary_configured():
            try:
                res = cloudinary.uploader.upload(
                    new_file_bytes,
                    folder="bigchamp/media",
                    resource_type="image" if is_image else "video",
                    overwrite=True,
                )
                new_url = res.get("secure_url", existing_url)
                width = res.get("width")
                height = res.get("height")
                duration = res.get("duration")
            except Exception:
                pass

        return {
            "url": new_url,
            "file_size": len(new_file_bytes),
            "width": width,
            "height": height,
            "duration_seconds": duration,
        }

    @staticmethod
    def delete_media(relative_url: str) -> bool:
        """Safely delete file from local storage and Cloudinary."""
        if not relative_url:
            return False

        # If Cloudinary URL, remove from Cloudinary
        if "res.cloudinary.com" in relative_url and is_cloudinary_configured():
            try:
                # Extract public_id from Cloudinary URL
                # e.g., https://res.cloudinary.com/ibq3zgu8/image/upload/v1234/bigchamp/products/prod_123.jpg
                parts = relative_url.split("/upload/")
                if len(parts) > 1:
                    path_after_upload = parts[1]
                    # strip version e.g. v1234/
                    if path_after_upload.startswith("v") and "/" in path_after_upload:
                        path_after_upload = path_after_upload.split("/", 1)[1]
                    public_id = os.path.splitext(path_after_upload)[0]
                    is_video = any(relative_url.lower().endswith(ext) for ext in [".mp4", ".mov", ".webm"])
                    cloudinary.uploader.destroy(public_id, resource_type="video" if is_video else "image")
                    return True
            except Exception:
                pass

        try:
            cleaned = relative_url.lstrip("/")
            if cleaned.startswith("uploads/"):
                cleaned = cleaned[len("uploads/") :]
            disk_path = os.path.join(UPLOAD_BASE_DIR, cleaned)
            if os.path.exists(disk_path):
                os.remove(disk_path)
                return True
        except Exception:
            pass
        return False
