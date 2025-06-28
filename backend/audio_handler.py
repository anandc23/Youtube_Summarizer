import yt_dlp
import ffmpeg  # This must be ffmpeg-python, not ffmpeg
import os
import tempfile

def download_audio(url):
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, "video.webm")
    audio_path = os.path.join(temp_dir, "audio.wav")
    # Download best audio
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': video_path,
        'quiet': True,
        'noplaylist': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    # Convert to wav using ffmpeg
    ffmpeg.input(video_path).output(audio_path, ac=1, ar='16000').run(quiet=True, overwrite_output=True)
    return audio_path, temp_dir
