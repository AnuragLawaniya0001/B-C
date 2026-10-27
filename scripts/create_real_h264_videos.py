import os
import subprocess
import shutil

def run():
    print("=== Generating High-Quality Browser-Compatible H.264 Web Campaign Videos ===")
    
    # Check if ffmpeg is available in container or host
    in_docker = os.path.exists('/app/backend/uploads')
    base_uploads = '/app/backend/uploads' if in_docker else os.path.abspath('backend/uploads')
    
    img_hero = os.path.join(base_uploads, 'media', 'images', 'hero_campaign_banner_1793006420241.jpg')
    img_sale = os.path.join(base_uploads, 'media', 'images', 'campaign_seasonal_sale_1793006596470.jpg')
    out_dir = os.path.join(base_uploads, 'media', 'videos')
    os.makedirs(out_dir, exist_ok=True)
    
    out_hero = os.path.join(out_dir, 'bigchamp_hero_campaign.mp4')
    out_sale = os.path.join(out_dir, 'bigchamp_seasonal_campaign.mp4')
    
    # 1. Hero Video: 1280x720, 30fps, 4s subtle cinematic zoompan, H.264 yuv420p, +faststart
    cmd_hero = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", img_hero,
        "-vf", "scale=1280:720,zoompan=z='min(zoom+0.0012,1.12)':d=120:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=30",
        "-c:v", "libx264",
        "-t", "4",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        out_hero
    ]
    
    print("Generating Hero Campaign Video (H.264)...")
    res1 = subprocess.run(cmd_hero, capture_output=True, text=True)
    if res1.returncode != 0:
        print(f"Error generating hero video: {res1.stderr}")
    else:
        print(f"Successfully generated: {out_hero} ({os.path.getsize(out_hero)} bytes)")
        # Also copy to hero_campaign_track.mp4 for backward compatibility
        track_path = os.path.join(out_dir, 'hero_campaign_track.mp4')
        shutil.copy2(out_hero, track_path)
        print(f"Mirrored to: {track_path}")
        
    # 2. Seasonal Sale Video: 1280x720, 30fps, 4s cinematic zoompan, H.264 yuv420p, +faststart
    cmd_sale = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", img_sale,
        "-vf", "scale=1280:720,zoompan=z='min(zoom+0.0015,1.14)':d=120:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=30",
        "-c:v", "libx264",
        "-t", "4",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        out_sale
    ]
    
    print("Generating Seasonal Sale Campaign Video (H.264)...")
    res2 = subprocess.run(cmd_sale, capture_output=True, text=True)
    if res2.returncode != 0:
        print(f"Error generating sale video: {res2.stderr}")
    else:
        print(f"Successfully generated: {out_sale} ({os.path.getsize(out_sale)} bytes)")
        team_path = os.path.join(out_dir, 'sale_campaign_team.mp4')
        shutil.copy2(out_sale, team_path)
        print(f"Mirrored to: {team_path}")

if __name__ == '__main__':
    run()
