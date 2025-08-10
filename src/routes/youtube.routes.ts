import { Router, Request, Response } from 'express';
import youtubeService from '../services/youtube.service';

const router = Router();

router.post('/extract-subtitles', async (req: Request, res: Response) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }

        // Validate YouTube URL
        const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeUrlRegex.test(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const subtitles = await youtubeService.extractSubtitles(videoUrl);
        res.json({ subtitles });
    } catch (error) {
        console.error('Error in extract-subtitles route:', error);
        res.status(500).json({ error: 'Failed to extract subtitles' });
    }
});

export default router; 