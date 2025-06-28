# Youtube Summarizer

Youtube Summarizer is a web application that allows users to summarize YouTube videos by fetching their transcripts and generating concise summaries. The application is built using Flask for the backend and HTML/CSS/JavaScript for the frontend.

## Project Structure

```
Youtube_Summarizer
├── backend
│   ├── app.py                # Main entry point for the backend application
│   ├── transcript_handler.py  # Handles fetching and processing transcripts from YouTube
│   ├── summarizer.py         # Contains logic for summarizing transcripts
│   ├── auth.py               # Manages authentication for the application
│   ├── requirements.txt      # Lists Python dependencies for the backend
│   └── README.md             # Documentation for the backend
├── frontend
│   ├── index.html            # Main HTML file for the frontend application
│   ├── app.js                # JavaScript code for handling user interactions
│   ├── styles.css            # CSS styles for the frontend application
│   └── README.md             # Documentation for the frontend
└── README.md                 # Main documentation for the entire project
```

## Features

- Fetch transcripts from YouTube videos.
- Summarize transcripts into concise summaries.
- User authentication for personalized experiences.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Youtube_Summarizer.git
   ```

2. Navigate to the backend directory:
   ```
   cd Youtube_Summarizer/backend
   ```

3. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

## Running the Application

### Backend

1. Start the Flask server:
   ```
   python app.py
   ```

### Frontend

1. Open `index.html` in your web browser to access the frontend application.

## Usage

- Enter the URL of a YouTube video to fetch its transcript and generate a summary.
- Use the application to quickly understand the content of videos without watching them in full.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features you'd like to add.

## License

This project is licensed under the MIT License. See the LICENSE file for details.