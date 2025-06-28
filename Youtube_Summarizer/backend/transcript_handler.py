def get_transcript(url):
    # This function fetches the transcript from a YouTube video given its URL.
    # You can use libraries like youtube-transcript-api to retrieve the transcript.
    from youtube_transcript_api import YouTubeTranscriptApi
    import re

    # Extract video ID from the URL
    video_id = re.search(r"(?<=v=|/)([a-zA-Z0-9_-]{11})", url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    video_id = video_id.group(0)

    # Fetch the transcript
    transcript = YouTubeTranscriptApi.get_transcript(video_id)

    # Combine the transcript into a single string
    transcript_text = " ".join([entry['text'] for entry in transcript])
    
    return transcript_text