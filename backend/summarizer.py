import os
import tempfile
import yt_dlp
import whisper
from transformers import pipeline, AutoTokenizer
import glob
import shutil
import re

# Load models once at startup
whisper_model = whisper.load_model("base")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

EN_MODEL = "facebook/bart-large-cnn"
tokenizer = AutoTokenizer.from_pretrained(EN_MODEL)
en_summarizer = pipeline("summarization", model=EN_MODEL, tokenizer=tokenizer)

def download_audio(youtube_url, temp_dir):
    import glob
    audio_path_template = os.path.join(temp_dir, "audio.%(ext)s")
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': audio_path_template,
        'quiet': True,
        'noplaylist': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        audio_files = glob.glob(os.path.join(temp_dir, "audio.*"))
        if not audio_files:
            raise RuntimeError("Audio file was not created by yt-dlp.")
        return audio_files[0]
    except Exception as e:
        raise RuntimeError(f"Failed to download audio with yt-dlp: {e}")

def transcribe_audio(audio_path):
    try:
        result = whisper_model.transcribe(audio_path)
        return result['text']
    except Exception as e:
        raise RuntimeError(f"Failed to transcribe audio: {e}")

def chunk_text(text, tokenizer, max_tokens=1024):
    # Split text into sentences and accumulate until max_tokens is reached
    import re
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current_chunk = ""
    current_tokens = 0
    for sentence in sentences:
        sentence_tokens = len(tokenizer.encode(sentence))
        if current_tokens + sentence_tokens > max_tokens:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence
            current_tokens = sentence_tokens
        else:
            current_chunk += " " + sentence
            current_tokens += sentence_tokens
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def get_summary(text):
    # Split transcript into manageable chunks by tokens
    chunks = chunk_text(text, tokenizer, max_tokens=1024)
    partial_summaries = []
    for chunk in chunks:
        # Defensive: if chunk is still too long, truncate tokens
        tokens = tokenizer.encode(chunk)
        if len(tokens) > 1024:
            chunk = tokenizer.decode(tokens[:1024], skip_special_tokens=True)
        summary = summarizer(chunk[:4000], max_length=180, min_length=60, do_sample=False)
        partial_summaries.append(summary[0]['summary_text'])
    combined = " ".join(partial_summaries)
    # If combined summary is too long, summarize again
    if len(tokenizer.encode(combined)) > 1024:
        final_chunks = chunk_text(combined, tokenizer, max_tokens=1024)
        final_summaries = []
        for chunk in final_chunks:
            tokens = tokenizer.encode(chunk)
            if len(tokens) > 1024:
                chunk = tokenizer.decode(tokens[:1024], skip_special_tokens=True)
            summary = summarizer(chunk[:4000], max_length=180, min_length=60, do_sample=False)
            final_summaries.append(summary[0]['summary_text'])
        return " ".join(final_summaries)
    else:
        return combined

def summarize_youtube_video(youtube_url):
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        audio_path = download_audio(youtube_url, temp_dir)
        transcript = transcribe_audio(audio_path)
        summary = get_summary(transcript)
        return summary
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

def summarize(text, lang="en"):
    # Chunk the full transcript and summarize each chunk, then summarize the summaries for a global summary
    chunks = chunk_text(text, tokenizer, max_tokens=1024)
    partial_summaries = []
    for chunk in chunks:
        summary = en_summarizer(chunk, max_length=180, min_length=60, do_sample=False)
        partial_summaries.append(summary[0]['summary_text'])
    combined = " ".join(partial_summaries)
    # Final AI-style summary of the whole video
    if len(tokenizer.encode(combined)) > 1024:
        final_chunks = chunk_text(combined, tokenizer, max_tokens=1024)
        final_summaries = []
        for chunk in final_chunks:
            summary = en_summarizer(chunk, max_length=180, min_length=60, do_sample=False)
            final_summaries.append(summary[0]['summary_text'])
        return " ".join(final_summaries)
    else:
        return combined

def intro(text, lang="en"):
    prompt = f"What is this video about? Write an introduction.\n\n{text[:2000]}"
    intro_result = en_summarizer(prompt, max_length=40, min_length=10, do_sample=False)
    return intro_result[0]['summary_text']