import os
import cv2
import numpy as np
from PIL import Image

def create_cinematic_clip(image_path, output_path, duration_sec=4.0, fps=24, target_w=1920, target_h=1080, zoom_factor=1.08):
    if not os.path.exists(image_path):
        print(f"Error: image not found at {image_path}")
        return False

    pil_img = Image.open(image_path).convert('RGB')
    orig_w, orig_h = pil_img.size

    # Fit into target aspect ratio by center crop
    target_aspect = target_w / target_h
    orig_aspect = orig_w / orig_h

    if orig_aspect > target_aspect:
        new_w = int(orig_h * target_aspect)
        left = (orig_w - new_w) // 2
        pil_img = pil_img.crop((left, 0, left + new_w, orig_h))
    else:
        new_h = int(orig_w / target_aspect)
        top = (orig_h - new_h) // 2
        pil_img = pil_img.crop((0, top, orig_w, top + new_h))

    base_frame = np.array(pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS))
    # Convert RGB to BGR for OpenCV
    base_bgr = cv2.cvtColor(base_frame, cv2.COLOR_RGB2BGR)

    total_frames = int(duration_sec * fps)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (target_w, target_h))

    for i in range(total_frames):
        # Progress from 0.0 to 1.0 and back to 0.0 for seamless loop
        t = np.sin((i / total_frames) * np.pi)
        current_zoom = 1.0 + (zoom_factor - 1.0) * t

        # Compute crop coordinates for current zoom
        crop_w = int(target_w / current_zoom)
        crop_h = int(target_h / current_zoom)
        x1 = (target_w - crop_w) // 2
        y1 = (target_h - crop_h) // 2

        cropped = base_bgr[y1:y1 + crop_h, x1:x1 + crop_w]
        frame = cv2.resize(cropped, (target_w, target_h), interpolation=cv2.INTER_LINEAR)
        out.write(frame)

    out.release()
    print(f"Created video: {output_path} ({os.path.getsize(output_path)} bytes, {duration_sec}s @ {fps}fps)")
    return True

def main():
    hero_img = 'frontend/public/images/hero/hero_main.jpg'
    sale_img = 'frontend/public/images/campaigns/sale_banner.jpg'

    targets = [
        (hero_img, 'backend/uploads/media/videos/hero_campaign_track.mp4'),
        (hero_img, 'frontend/public/uploads/media/videos/hero_campaign_track.mp4'),
        (sale_img, 'backend/uploads/media/videos/sale_campaign_team.mp4'),
        (sale_img, 'frontend/public/uploads/media/videos/sale_campaign_team.mp4'),
    ]

    for img_p, vid_p in targets:
        create_cinematic_clip(img_p, vid_p, duration_sec=4.0, fps=24, target_w=1280, target_h=720, zoom_factor=1.06)

if __name__ == '__main__':
    main()
