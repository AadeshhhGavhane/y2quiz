import { Router, Request, Response } from 'express';
import youtubeService from '../services/youtube.service';
import geminiService from '../services/gemini.service';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory task storage (in production, use Redis or database)
interface Task {
    id: string;
    status: 'pending' | 'extracting' | 'processing' | 'generating' | 'completed' | 'failed';
    progress: number;
    result?: any;
    error?: string;
    createdAt: Date;
    lastPolled?: Date;
}

const tasks = new Map<string, Task>();

// Rate limiting for status checks (simple in-memory approach)
const statusCheckLimits = new Map<string, { count: number; resetTime: number }>();

// Cleanup old tasks (older than 1 hour)
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [taskId, task] of tasks.entries()) {
        if (task.createdAt < oneHourAgo) {
            tasks.delete(taskId);
        }
    }
    
    // Cleanup rate limit data
    const now = Date.now();
    for (const [key, limit] of statusCheckLimits.entries()) {
        if (now > limit.resetTime) {
            statusCheckLimits.delete(key);
        }
    }
}, 10 * 60 * 1000); // Cleanup every 10 minutes

router.post('/generate', async (req: Request, res: Response) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }

        // Create task
        const taskId = uuidv4();
        const task: Task = {
            id: taskId,
            status: 'pending',
            progress: 0,
            createdAt: new Date()
        };

        tasks.set(taskId, task);

        // Start async processing
        processQuizGeneration(taskId, videoUrl);

        // Return task ID immediately
        res.json({ 
            taskId,
            status: 'pending',
            message: 'Quiz generation started. Use the task ID to check progress.'
        });

    } catch (error) {
        console.error('Error starting quiz generation:', error);
        res.status(500).json({ 
            error: 'Failed to start quiz generation',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/status/:taskId', (req: Request, res: Response) => {
    const { taskId } = req.params;
    const task = tasks.get(taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Simple rate limiting: adjusted for new polling pattern (10s + 2s intervals)
    const rateLimitKey = taskId;
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    let limitData = statusCheckLimits.get(rateLimitKey);
    if (!limitData || now > limitData.resetTime) {
        limitData = { count: 0, resetTime: now + oneMinute };
        statusCheckLimits.set(rateLimitKey, limitData);
    }
    
    limitData.count++;
    
    // More generous limits for new polling pattern:
    // - Active tasks: 35 requests per minute (allows 2s polling with buffer)
    // - Completed/failed: 10 requests per minute
    const maxRequests = (task.status === 'completed' || task.status === 'failed') ? 10 : 35;
    
    if (limitData.count > maxRequests) {
        return res.status(429).json({ 
            error: 'Too many status requests. Please wait before checking again.',
            retryAfter: Math.ceil((limitData.resetTime - now) / 1000)
        });
    }

    // Update last polled time
    task.lastPolled = new Date();

    const response: any = {
        taskId: task.id,
        status: task.status,
        progress: task.progress
    };

    if (task.status === 'completed' && task.result) {
        response.result = task.result;
    }

    if (task.status === 'failed' && task.error) {
        response.error = task.error;
    }

    res.json(response);
});

async function processQuizGeneration(taskId: string, videoUrl: string) {
    const task = tasks.get(taskId);
    if (!task) return;

    try {
        // Step 1: Extract subtitles
        task.status = 'extracting';
        task.progress = 20;
        console.log(`Task ${taskId}: Extracting subtitles`);
        
        const subtitles = await youtubeService.extractSubtitles(videoUrl);
        
        // Step 2: Process transcript
        task.status = 'processing';
        task.progress = 40;
        console.log(`Task ${taskId}: Processing transcript`);
        
        // Small delay to show processing step
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Generate quiz
        task.status = 'generating';
        task.progress = 60;
        console.log(`Task ${taskId}: Generating quiz`);
        
        const quiz = await geminiService.generateQuiz(subtitles);
        
        // Complete
        task.status = 'completed';
        task.progress = 100;
        task.result = quiz;
        console.log(`Task ${taskId}: Completed successfully`);
        
    } catch (error) {
        console.error(`Task ${taskId} failed:`, error);
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error occurred';
    }
}

export default router; 