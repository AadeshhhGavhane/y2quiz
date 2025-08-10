import dotenv from 'dotenv';

// Load environment variables FIRST
const result = dotenv.config();

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

// Debug environment variables
console.log('Environment variables loaded:', {
    PORT: process.env.PORT,
    GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
});

// Now import other modules after environment is configured
import express from 'express';
import path from 'path';
import youtubeRoutes from './routes/youtube.routes';
import quizRoutes from './routes/quiz.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/youtube', youtubeRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 