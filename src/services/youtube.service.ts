import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

class YouTubeService {
    private ytDlp: YTDlpWrap = new YTDlpWrap();
    private subtitlesDir: string;

    constructor() {
        this.subtitlesDir = path.join(__dirname, '../../temp');
        this.initializeService();
    }

    private async initializeService() {
        try {
            // Ensure temp directory exists
            await fs.mkdir(this.subtitlesDir, { recursive: true });

            // Initialize yt-dlp
            await this.setupYtDlp();
        } catch (error) {
            console.error('Failed to initialize YouTube service:', error);
            throw error;
        }
    }

    private async setupYtDlp() {
        try {
            // Try to use system-installed yt-dlp first
            this.ytDlp = new YTDlpWrap('yt-dlp');
            
            // Test if yt-dlp is available
            try {
                await this.ytDlp.getVersion();
                console.log('Using system-installed yt-dlp');
                return;
            } catch (error) {
                console.log('System yt-dlp not found, downloading binary...');
            }

            // Fallback: download binary if system installation not available
            const binaryPath = path.join(this.subtitlesDir, 'yt-dlp');
            
            try {
                await fs.access(binaryPath);
                console.log('Using cached yt-dlp binary');
            } catch {
                console.log('Downloading yt-dlp binary...');
                await YTDlpWrap.downloadFromGithub(binaryPath);
                // Make binary executable
                await fs.chmod(binaryPath, '755');
                console.log('yt-dlp binary downloaded successfully');
            }

            this.ytDlp = new YTDlpWrap(binaryPath);
        } catch (error) {
            console.error('Failed to setup yt-dlp:', error);
            throw error;
        }
    }

    private async executeYtDlpWithEvents(commandArgs: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            let hasError = false;
            
            const ytDlpEventEmitter = this.ytDlp.exec(commandArgs)
                .on('progress', (progress) => {
                    console.log('yt-dlp progress:', progress);
                })
                .on('ytDlpEvent', (eventType, eventData) => {
                    console.log(`yt-dlp event [${eventType}]:`, eventData);
                })
                .on('error', (error) => {
                    console.error('yt-dlp error:', error);
                    hasError = true;
                    reject(error);
                })
                .on('close', (code) => {
                    console.log('yt-dlp closed with code:', code);
                    if (!hasError) {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(new Error(`yt-dlp exited with code ${code}`));
                        }
                    }
                });
        });
    }

    public async extractSubtitles(videoUrl: string): Promise<string> {
        try {
            const videoId = this.extractVideoId(videoUrl);
            
            // Use the improved command structure
            const commandArgs = [
                '--skip-download',
                '--write-auto-sub',
                '--sub-langs', 'en,en-US,en-GB,en-CA,en-AU,en-NZ,en-auto',
                '--convert-subs', 'srt',
                '--output', path.join(this.subtitlesDir, '%(title)s.%(ext)s'),
                videoUrl
            ];

            console.log('Executing yt-dlp with improved args:', commandArgs);

            // Execute yt-dlp command and capture output
            try {
                const stdout = await this.ytDlp.execPromise(commandArgs);
                console.log('yt-dlp output:', stdout);
            } catch (ytDlpError) {
                console.error('yt-dlp execution error:', ytDlpError);
                
                // Try using EventEmitter approach as fallback
                console.log('Trying EventEmitter approach...');
                try {
                    await this.executeYtDlpWithEvents(commandArgs);
                } catch (eventError) {
                    console.error('EventEmitter approach also failed:', eventError);
                    throw new Error(`yt-dlp failed: ${eventError}`);
                }
            }

            // List all files in temp directory for debugging
            const allFiles = await fs.readdir(this.subtitlesDir);
            console.log('All files in temp directory after yt-dlp:', allFiles);

            // Find any .srt file in the directory (since we're using %(title)s format)
            const srtFiles = allFiles.filter(f => f.endsWith('.srt'));
            console.log('Found SRT files:', srtFiles);

            if (srtFiles.length === 0) {
                throw new Error(`No SRT subtitle files found. Available files: ${allFiles.join(', ')}`);
            }

            // Use the first .srt file found
            const subtitlePath = path.join(this.subtitlesDir, srtFiles[0]);
            console.log('Using subtitle file:', subtitlePath);

            // Read the subtitle file
            const subtitleContent = await fs.readFile(subtitlePath, 'utf-8');
            
            // Clean up the file
            await fs.unlink(subtitlePath);

            // Process SRT content
            return this.processSrtContent(subtitleContent);
        } catch (error) {
            console.error('Failed to extract subtitles:', error);
            throw new Error('Failed to extract subtitles from the video');
        }
    }

    private processVttContent(vttContent: string): string {
        // Split content into lines
        const lines = vttContent.split('\n');
        let processedLines: string[] = [];
        let isTimestamp = false;

        // Process each line
        for (const line of lines) {
            // Skip WebVTT header, timestamps, and empty lines
            if (line.includes('WEBVTT') || line.trim() === '' || line.match(/^\d{2}:\d{2}/) || line.includes('-->')) {
                isTimestamp = line.includes('-->');
                continue;
            }

            // If not a timestamp line and not empty, add to processed lines
            if (!isTimestamp && line.trim()) {
                processedLines.push(line.trim());
            }
        }

        // Join lines with proper spacing and remove any HTML-like tags
        return processedLines
            .join(' ')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private processSrtContent(srtContent: string): string {
        // Split content into lines
        const lines = srtContent.split('\n');
        
        // Define bad words/patterns to filter out
        const badWords = ['-->', '</c>', 'WEBVTT', /^\d+$/, /^\d{2}:\d{2}:\d{2}/, /^\s*$/];
        const prefixPattern = /^&gt;&gt;\s*/;
        
        // First pass: filter out lines containing bad words/patterns
        const filteredLines: string[] = [];
        
        for (const line of lines) {
            const shouldSkip = badWords.some(badWord => {
                if (typeof badWord === 'string') {
                    return line.includes(badWord);
                } else if (badWord instanceof RegExp) {
                    return badWord.test(line.trim());
                }
                return false;
            });
            
            if (!shouldSkip && line.trim()) {
                filteredLines.push(line.trim());
            }
        }
        
        console.log('Lines after filtering:', filteredLines.length);
        
        // Second pass: remove duplicates using Set
        const uniqueLines = new Set(filteredLines);
        console.log('Unique lines after deduplication:', uniqueLines.size);
        
        // Third pass: remove prefix patterns and clean up
        const cleanedLines = Array.from(uniqueLines).map(line => {
            // Remove the &gt;&gt; prefix pattern
            let cleaned = line.replace(prefixPattern, '');
            
            // Remove any HTML-like tags
            cleaned = cleaned.replace(/<[^>]*>/g, '');
            
            // Clean up extra whitespace
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            
            return cleaned;
        }).filter(line => line.length > 0); // Remove empty lines after cleaning
        
        console.log('Final cleaned lines:', cleanedLines.length);
        console.log('Sample cleaned lines:', cleanedLines.slice(0, 5));
        
        // Join lines with spaces and final cleanup
        const result = cleanedLines
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
            
        console.log('Final transcript length:', result.length);
        return result;
    }

    private extractVideoId(url: string): string {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        return match?.[1] || Date.now().toString();
    }
}

export default new YouTubeService(); 