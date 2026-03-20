import sys
import os
import shutil
import site
import importlib
import time
import yt_dlp
import traceback
import subprocess
import random
import string
import datetime
import re
import heapq

# --- Diagnostics ---
# Check if FFmpeg exists
if not shutil.which("ffmpeg"):
    raise EnvironmentError(
        "❌ FFmpeg is not installed or not in your PATH.\n"
        "Download it from https://www.gyan.dev/ffmpeg/builds/ and add /bin to your PATH."
    )

TEMP_DIR = "temp"
SHORTS_DIR = "downloads"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(SHORTS_DIR, exist_ok=True)

def safe_wait_for_file(filepath, max_wait=60, poll=1.0):
    """Wait until file exists and isn't being written to."""
    waited = 0
    while not os.path.exists(filepath):
        if waited > max_wait:
            raise RuntimeError(f"Timeout waiting for file: {filepath}")
        time.sleep(poll)
        waited += poll

def safe_delete(filepath):
    """Try to delete a file, ignoring errors."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except:
        pass

def analyze_engaging_segments(transcript, num_shorts=3, clip_duration=30):
    """Analyze transcript to pick the best segments based on 'hooks' and keywords."""
    hooks = [
        r"\b(wait till you see|this is unbelievable|incredible|shocking|amazing|crazy|listen to this|watch this|must see|secret|revealed)\b",
        r"\b(unexpected|surprising|unbelievable|breaking|exclusive)\b"
    ]
    # Simple word-per-second estimate
    words_per_sec = 2.5
    words = transcript.split()
    total_words = len(words)
    
    window_size = int(clip_duration * words_per_sec)
    stride = int(clip_duration // 2 * words_per_sec) 
    
    scored_segments = []
    for i in range(0, total_words - window_size, stride):
        window_text = " ".join(words[i:i+window_size]).lower()
        score = 0
        for pattern in hooks:
            if re.search(pattern, window_text):
                score += 5
        score += window_text.count("!") * 2
        score += window_text.count("?")
        
        start_sec = int(i / words_per_sec)
        end_sec = start_sec + clip_duration
        scored_segments.append((score, start_sec, end_sec, " ".join(words[i:i+10]) + "..."))

    # Pick top N highest scored segments, but ensure they don't overlap too much
    top_segments = []
    scored_segments.sort(key=lambda x: x[0], reverse=True)
    
    for score, start, end, preview in scored_segments:
        if len(top_segments) >= num_shorts: break
        # Minimal overlap check
        if all(abs(start - s["start"]) > clip_duration // 2 for s in top_segments):
            top_segments.append({
                "start": start,
                "end": end,
                "description": preview,
                "score": score
            })
            
    # Default to beginning if no segments found
    if not top_segments:
        top_segments.append({"start": 0, "end": clip_duration, "description": "Intro Clip", "score": 0})
        
    return top_segments

def generate_vertical_short(input_path, output_path, start_time, duration):
    """Uses FFmpeg directly for maximum speed and reliability to crop and subclip."""
    # 1. Get dimensions
    probe_cmd = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height", "-of", "csv=p=0", input_path
    ]
    probe = subprocess.run(probe_cmd, capture_output=True, text=True)
    in_w, in_h = [int(x) for x in probe.stdout.strip().split(",")]

    # 2. Calculate portrait crop (9:16)
    target_ar = 9 / 16
    in_ar = in_w / in_h
    
    if in_ar > target_ar:
        crop_w = int(in_h * target_ar)
        x = (in_w - crop_w) // 2
        vf = f"crop={crop_w}:{in_h}:{x}:0,scale=720:1280"
    else:
        crop_h = int(in_w / target_ar)
        y = (in_h - crop_h) // 2
        vf = f"crop={in_w}:{crop_h}:0:{y},scale=720:1280"

    # 3. Process
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-t", str(duration),
        "-i", input_path,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        output_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {res.stderr}")

def generate_shorts(url, num_shorts=3, clip_duration=30):
    from transcript_handler import get_transcript
    
    video_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    raw_video = os.path.join(TEMP_DIR, f"raw_{video_id}.mp4")
    shorts_list = []
    errors = []

    try:
        # Step 1: Download
        print(f"📥 Downloading video for shorts: {url}")
        # Note: On Windows, use 'nopart' to avoid WinError 32 during file renaming
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': os.path.join(TEMP_DIR, f"raw_{video_id}.%(ext)s"),
            'quiet': True,
            'noplaylist': True,
            'nopart': True, 
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            actual_filename = ydl.prepare_filename(info)
            
        # Move outside the with block to ensure yt-dlp has closed all handles
        if os.path.exists(actual_filename) and actual_filename != raw_video:
            # Overwrite if exists, but since video_id is unique it shouldn't
            shutil.move(actual_filename, raw_video)
        elif not os.path.exists(raw_video) and not os.path.exists(actual_filename):
            raise FileNotFoundError(f"Download failed: Could not find {raw_video}")
            
        # Step 2: Get Transcript for Analysis
        print("🤖 Analyzing content for hooks...")
        transcript = get_transcript(url)
        best_segments = analyze_engaging_segments(transcript, num_shorts, clip_duration)

        # Step 3: Slash and Crop
        for idx, seg in enumerate(best_segments):
            try:
                short_fn = f"short_{video_id}_{idx}.mp4"
                short_path = os.path.join(SHORTS_DIR, short_fn)
                thumb_fn = short_fn.replace(".mp4", ".jpg")
                thumb_path = os.path.join(SHORTS_DIR, thumb_fn)

                print(f"🎬 Creating Short #{idx+1} (Start: {seg['start']}s)")
                generate_vertical_short(raw_video, short_path, seg['start'], clip_duration)
                
                # Thumbnail
                subprocess.run([
                    "ffmpeg", "-y", "-i", short_path, "-ss", "00:00:00.5", 
                    "-vframes", "1", thumb_path
                ], capture_output=True)

                shorts_list.append({
                    "url": f"/downloads/{short_fn}",
                    "thumb": f"/downloads/{thumb_fn}",
                    "title": f"Clip #{idx+1}: {seg['description']}",
                    "time": str(datetime.timedelta(seconds=int(clip_duration)))
                })
            except Exception as e:
                errors.append(f"Short {idx+1} error: {str(e)}")

    finally:
        safe_delete(raw_video)

    return {
        "shorts": shorts_list,
        "status": "success" if shorts_list else "error",
        "errors": errors
    }