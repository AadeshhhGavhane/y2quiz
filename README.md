# YouTube Quiz Generator

A Node.js application that generates interactive quizzes from YouTube video subtitles using AI.

## Features

- 🎥 Extract subtitles from any YouTube video
- 🤖 Generate intelligent quizzes using Google's Gemini AI
- 🌙 Dark/Light theme support
- 📱 Mobile-first responsive design
- ⭐ Real-time feedback and scoring
- 📊 Grade calculation with detailed feedback

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: HTML, CSS, JavaScript
- **AI**: Google Gemini 2.5 Flash
- **Video Processing**: yt-dlp via yt-dlp-wrap
- **Styling**: CSS with CSS Variables for theming

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key
- yt-dlp (automatically downloaded or use system installation)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd y2quiz
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your Gemini API key to `.env`:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key to your `.env` file

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

3. Enter a YouTube video URL and click "Generate Quiz"

4. Answer the generated questions and submit for scoring

## API Endpoints

- `GET /` - Serve the main application
- `POST /api/quiz/generate` - Generate quiz from YouTube URL
- `POST /api/youtube/extract-subtitles` - Extract subtitles only

## Project Structure

```
src/
├── public/
│   ├── css/
│   │   └── styles.css       # Responsive styling with themes
│   ├── js/
│   │   └── main.js          # Frontend JavaScript
│   └── index.html           # Main HTML template
├── routes/
│   ├── quiz.routes.ts       # Quiz generation endpoints
│   └── youtube.routes.ts    # YouTube processing endpoints
├── services/
│   ├── gemini.service.ts    # Gemini AI integration
│   └── youtube.service.ts   # yt-dlp subtitle extraction
└── server.ts                # Express server setup
```

## Features in Detail

### Subtitle Extraction
- Supports both manual and auto-generated subtitles
- Handles multiple language variants (en, en-US, en-GB)
- Processes both VTT and SRT formats
- Automatic cleanup and text processing

### Quiz Generation
- 10 multiple-choice questions per video
- AI-powered content analysis
- Structured JSON response validation
- Error handling and retry logic

### User Interface
- Clean, modern design
- Dark/light theme toggle
- Mobile-responsive layout
- Progress tracking
- Real-time feedback
- Grade calculation with motivational messages

## Development Scripts

```bash
npm run dev      # Start development server with ts-node
npm run build    # Compile TypeScript to JavaScript
npm run start    # Run compiled JavaScript
npm run watch    # Watch for TypeScript changes
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | No (defaults to 3000) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## Error Handling

The application includes comprehensive error handling for:
- Invalid YouTube URLs
- Missing subtitles
- API rate limits
- Network failures
- Invalid quiz responses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Troubleshooting

### yt-dlp Issues
- The app automatically downloads yt-dlp binary
- For faster startup, install yt-dlp system-wide: `pip install yt-dlp`

### API Key Issues
- Ensure your Gemini API key is valid and has quota
- Check that the `.env` file is in the project root
- Verify the environment variables are loading correctly

### Subtitle Extraction Issues
- Some videos may not have English subtitles
- Private or restricted videos cannot be processed
- Very long videos may take more time to process

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository. 