import os
import tempfile
import yt_dlp
import glob
import shutil
import re
import torch
from faster_whisper import WhisperModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Constants
EN_MODEL = "facebook/bart-large-cnn"
WHISPER_MODEL = "small"

# Resource Registry
_whisper = None
_tokenizer = None
_model = None
_device = "cuda" if torch.cuda.is_available() else "cpu"

def get_whisper():
    global _whisper
    if _whisper is None:
        print(f"Loading faster-whisper model: {WHISPER_MODEL} on {_device}")
        _whisper = WhisperModel(
            WHISPER_MODEL, 
            device=_device, 
            compute_type="int8" if _device == "cpu" else "float16"
        )
    return _whisper

def get_summarizer():
    global _tokenizer, _model
    if _model is None:
        print(f"Loading BART model: {EN_MODEL} on {_device}")
        _tokenizer = AutoTokenizer.from_pretrained(EN_MODEL)
        _model = AutoModelForSeq2SeqLM.from_pretrained(EN_MODEL).to(_device)
    return _tokenizer, _model

def download_audio(youtube_url, temp_dir):
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
            raise RuntimeError("Audio file missing.")
        return audio_files[0]
    except Exception as e:
        raise RuntimeError(f"Download failed: {e}")

def transcribe_audio(audio_path):
    try:
        model = get_whisper()
        segments, info = model.transcribe(audio_path, beam_size=5, task="translate")
        return " ".join([segment.text for segment in segments])
    except Exception as e:
        raise RuntimeError(f"Transcription failed: {e}")

def run_inference(text, max_length=150):
    tokenizer, model = get_summarizer()
    inputs = tokenizer(text, max_length=1024, truncation=True, return_tensors="pt").to(_device)
    
    # Dynamic min_length based on input to prevent hallucination on short lyrics
    input_len = inputs["input_ids"].shape[1]
    dynamic_min = min(40, max(5, input_len // 2))

    with torch.no_grad():
        summary_ids = model.generate(
            inputs["input_ids"], 
            num_beams=4, 
            max_length=max_length, 
            min_length=dynamic_min,
            early_stopping=True
        )
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

def chunk_text(text, tokenizer, max_tokens=850):
    # Split by punctuation or newlines (common in lyrics)
    sentences = re.split(r'(?<=[.!?]) +|\n+', text)
    chunks, current_chunk, current_tokens = [], "", 0
    for sentence in sentences:
        if not sentence.strip(): continue
        tokens = len(tokenizer.encode(sentence))
        
        # If a single unpunctuated block is too long, split by words
        if tokens > max_tokens:
            words = sentence.split()
            for word in words:
                wt = len(tokenizer.encode(word))
                if current_tokens + wt > max_tokens:
                    if current_chunk: chunks.append(current_chunk.strip())
                    current_chunk, current_tokens = word, wt
                else:
                    current_chunk += " " + word
                    current_tokens += wt
            continue

        if current_tokens + tokens > max_tokens:
            if current_chunk: chunks.append(current_chunk.strip())
            current_chunk, current_tokens = sentence, tokens
        else:
            current_chunk += " " + sentence
            current_tokens += tokens
    if current_chunk: chunks.append(current_chunk.strip())
    return chunks

def summarize(text, lang="en"):
    if not text or len(text.strip()) < 20:
        return "The transcript is too short or mostly instrumental. Unable to generate a detailed summary."
        
    tokenizer, _ = get_summarizer()
    chunks = chunk_text(text, tokenizer)
    valid_chunks = [c for c in chunks if len(c.split()) > 2]
    if not valid_chunks:
        return "Could not process video content into readable segments. This often happens with music videos or sparse audio."

    print(f"Summarizing {len(valid_chunks)} segments...")
    summaries = []
    for c in valid_chunks:
        try:
            res = run_inference(c)
            if res: summaries.append(res)
        except Exception as e:
            print(f"Error in segment inference: {e}")
            continue
            
    if not summaries:
        return "AI was unable to generate a summary for this specific content."
        
    combined = " ".join(summaries)
    if len(tokenizer.encode(combined)) > 900:
        return run_inference(combined, max_length=300)
    return combined

def extract_tags(text):
    words = re.findall(r'\b[A-Z][A-Za-z]{3,15}\b', text)
    common_stops = ["The", "This", "That", "When", "What", "YouTube", "Video", "Like", "Your", "How", "And"]
    tags = list(set([w for w in words if w not in common_stops]))
    return tags[:8] if tags else ["Insights", "Tutorial", "Review"]

def intro(text, lang="en"):
    if not text: return "Ready to summarize."
    sample = text[:1700]
    try:
        tokenizer, model = get_summarizer()
        inputs = tokenizer(sample, max_length=1024, truncation=True, return_tensors="pt").to(_device)
        with torch.no_grad():
            ids = model.generate(inputs["input_ids"], max_length=70, min_length=20, num_beams=2)
        return tokenizer.decode(ids[0], skip_special_tokens=True)
    except:
        return "Comprehensive overview of the video's core mission."