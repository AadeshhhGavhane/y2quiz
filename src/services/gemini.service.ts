import { GoogleGenerativeAI } from '@google/generative-ai';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface Quiz {
    questions: QuizQuestion[];
}

class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required. Please check your .env file and ensure it is being loaded correctly.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    private generatePrompt(transcript: string): string {
        return `Create a 10-question multiple choice quiz based on the following video transcript.

VIDEO TRANSCRIPT:
"""
${transcript}
"""

INSTRUCTIONS:
- Create exactly 10 questions about the content of the video transcript above
- Each question must have exactly 4 answer options
- Questions should test understanding of the video's content, concepts, facts, or processes
- Make options plausible but clearly distinguishable
- Avoid subjective questions
- Return only valid JSON in this exact format:

{
    "questions": [
        {
            "question": "Your question here?",
            "options": ["option1", "option2", "option3", "option4"],
            "correctAnswer": 0
        }
    ]
}

Generate the quiz JSON now:`;
    }

    public async generateQuiz(transcript: string): Promise<Quiz> {
        try {
            // Debug the transcript content
            console.log('Transcript length:', transcript.length);
            console.log('First 500 characters of transcript:', transcript.substring(0, 500));
            console.log('Last 500 characters of transcript:', transcript.substring(Math.max(0, transcript.length - 500)));
            
            if (!transcript || transcript.trim().length < 50) {
                throw new Error('Transcript is too short or empty to generate a meaningful quiz');
            }
            
            const prompt = this.generatePrompt(transcript);
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            
            console.log('Raw Gemini response:', text);
            
            // Clean up the response - remove markdown code blocks if present
            text = text.trim();
            if (text.startsWith('```json')) {
                text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (text.startsWith('```')) {
                text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            console.log('Cleaned response for parsing:', text);
            
            try {
                const quiz = JSON.parse(text);
                
                // Validate quiz structure
                if (!this.isValidQuiz(quiz)) {
                    console.error('Invalid quiz structure:', quiz);
                    throw new Error('Invalid quiz structure returned from Gemini');
                }
                
                console.log('Successfully generated quiz with', quiz.questions.length, 'questions');
                return quiz;
            } catch (parseError) {
                console.error('Failed to parse Gemini response:', parseError);
                console.error('Response text was:', text);
                throw new Error('Failed to generate valid quiz format');
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw new Error('Failed to generate quiz');
        }
    }

    private isValidQuiz(quiz: any): quiz is Quiz {
        if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length !== 10) {
            return false;
        }

        return quiz.questions.every((q: any) => 
            typeof q.question === 'string' &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            q.options.every((opt: any) => typeof opt === 'string') &&
            typeof q.correctAnswer === 'number' &&
            q.correctAnswer >= 0 &&
            q.correctAnswer <= 3
        );
    }
}

export default new GeminiService(); 