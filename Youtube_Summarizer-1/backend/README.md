# Youtube Summarizer

This project is a web application that allows users to summarize YouTube videos by fetching their transcripts and generating concise summaries. It consists of a backend built with Flask and a frontend that interacts with the backend to provide a seamless user experience.

## Project Structure

```
Youtube_Summarizer
├── backend
│   ├── app.py                # Main entry point for the backend application
│   ├── transcript_handler.py  # Handles fetching and processing YouTube transcripts
│   ├── summarizer.py         # Contains logic for summarizing transcripts
│   ├── auth.py               # Manages user authentication
│   ├── requirements.txt      # Lists Python dependencies for the backend
│   └── README.md             # Documentation for the backend
├── frontend
│   ├── index.html            # Main HTML file for the frontend application
│   ├── app.js                # JavaScript code for user interactions and API calls
│   ├── styles.css            # CSS styles for the frontend application
│   └── README.md             # Documentation for the frontend
└── README.md                 # Main documentation for the entire project
```

## Backend Setup

1. Navigate to the `backend` directory:
   ```
   cd backend
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```
   python app.py
   ```

## Frontend Setup

1. Navigate to the `frontend` directory:
   ```
   cd frontend
   ```

2. Open `index.html` in a web browser to access the application.

## Usage

- To summarize a YouTube video, provide the video URL through the frontend interface.
- The application will fetch the transcript, generate a summary, and display it to the user.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.