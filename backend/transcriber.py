import whisper

model = whisper.load_model("base")

def transcribe(audio_file):
    result = model.transcribe(audio_file)
    return result.get("text", "")
