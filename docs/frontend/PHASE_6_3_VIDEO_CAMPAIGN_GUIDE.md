# BIGCHAMP — Phase 6.3: Video Campaign System & Playback Guide

## 1. Overview

Phase 6.3 establishes high-performance **video campaign playback** across the BIGCHAMP storefront. Videos are treated as first-class media assets—not merely arbitrary external URLs—with poster fallbacks, bandwidth safeguards, browser autoplay compliance, and accessibility controls.

---

## 2. Supported Formats & File Specifications

| Specification | Standard | Notes |
|---|---|---|
| **Container Format** | MP4 (`.mp4`), WebM (`.webm`) | MP4 is universally supported across modern desktop and mobile browsers. |
| **Video Codec** | H.264 (AVC) Baseline / Main Profile | Ensures seamless hardware decoding without dropped frames. |
| **Audio Codec** | AAC-LC (Muted by default) | Default playback is muted; audio controls provided for user unmuting. |
| **Resolution** | 720p HD (1280×720) or 1080p Full HD (1920×1080) | 720p offers optimal visual clarity with minimal bandwidth consumption. |
| **Aspect Ratio** | 16:9 widescreen | Perfectly adapts to hero and seasonal campaign containers. |
| **Framerate** | 24 fps or 30 fps | Smooth motion playback suitable for athletic training and match footage. |
| **Bitrate** | 3.5 Mbps – 6.0 Mbps | Yields file sizes between 2.5 MB and 5.0 MB for 4-second looping sequences. |
| **Size Limit** | Maximum **50 MB** | Server-enforced in `StorageService`. |

---

## 3. Playback Architecture & Component Integration

Integrated into `frontend/src/components/home/HeroCampaign.jsx` and `frontend/src/components/home/SeasonalSaleBanner.jsx`:

### 3.1 Standard Video Element Attributes
```jsx
<video
  ref={videoRef}
  src={mediaUrl}
  poster={posterUrl}
  autoPlay
  muted={isMuted}
  loop
  playsInline
  preload="metadata"
  onError={() => setVideoError(true)}
  className="w-full h-full object-cover object-center scale-105 transition-opacity duration-1000"
/>
```

### 3.2 Autoplay Compliance & Muted State
Modern browsers (Chrome, Edge, Safari, Firefox) strictly restrict unmuted autoplay. The BIGCHAMP video component initializes with `muted={true}` and `playsInline={true}`. An accessible button in the bottom right corner enables the user to unmute audio at will.

### 3.3 Accessible Play/Pause Controls
A subtle, high-contrast control strip is anchored in the bottom-right corner of the video container:
- **Play / Pause Button**: Allows users to stop motion at any time (`aria-label="Pause video campaign"`).
- **Mute / Unmute Button**: Toggles audio tracks (`aria-label="Unmute audio"`).
- **HD Indicator**: Clear visual signal that the asset is high-definition video.

### 3.4 Reduced-Motion Safety (`prefers-reduced-motion`)
In compliance with WCAG 2.1 Success Criterion 2.2.2 (Pause, Stop, Hide) and 2.3.3 (Animation from Interactions):
```javascript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }
}, []);
```
When a visitor has enabled reduced motion in their operating system, video playback is immediately halted and the static high-resolution poster is displayed.

### 3.5 Graceful Failure Fallback
If video playback encounters a network error, missing codec, or data failure:
- The `onError` handler automatically sets `videoError = true`.
- The video tag unmounts seamlessly.
- The `posterUrl` image immediately renders with zero layout shift or broken UI boxes.

---

## 4. Authentic Campaign Video Assets

Generated and deployed in Phase 6.3:
1. `hero_campaign_track.mp4`:
   - **Resolution**: 1280×720 (720p HD)
   - **Duration**: 4.0 seconds (looping sequence)
   - **File Size**: 3,063,390 bytes
   - **Location**: `backend/uploads/media/videos/hero_campaign_track.mp4`
   - **Poster**: `/uploads/media/images/hero_campaign_banner_1793006420241.jpg`
2. `sale_campaign_team.mp4`:
   - **Resolution**: 1280×720 (720p HD)
   - **Duration**: 4.0 seconds (looping sequence)
   - **File Size**: 4,493,146 bytes
   - **Location**: `backend/uploads/media/videos/sale_campaign_team.mp4`
   - **Poster**: `/uploads/media/images/campaign_seasonal_sale_1793006596470.jpg`
