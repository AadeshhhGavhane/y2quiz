# Y2Quiz 🎯

> Transform YouTube videos into interactive quizzes with AI-powered question generation

A modern, responsive web application that extracts subtitles from YouTube videos and uses Google Gemini 2.5 Flash to generate engaging multiple-choice quizzes. Features a beautiful dark/light theme toggle, mobile-first design, and an intuitive single-question quiz interface.

## ✨ Features

### 🎨 **Modern UI/UX**
- **Cool ASCII Art Header**: Block-style "Y2QUIZ" with glowing neon effects
- **Dark/Light Theme Toggle**: Seamless theme switching with persistent preferences
- **Responsive Design**: Mobile-first approach that works perfectly on all devices
- **Smooth Animations**: Fade-in/up animations, hover effects, and loading states

### 🎯 **Quiz Experience**
- **Single Question View**: Navigate through questions one at a time for better focus
- **Interactive Question Grid**: Visual progress indicator with question navigation
- **Smart Navigation**: Previous/Next buttons with intelligent state management
- **Real-time Progress**: Visual progress bar and question status indicators

### 🚀 **Advanced Functionality**
- **Asynchronous Processing**: Background task processing with real-time status updates
- **Smart Polling**: Intelligent backend polling with rate limiting and backoff
- **URL Cleaning**: Automatic YouTube URL normalization and validation
- **Robust Error Handling**: Comprehensive error handling with user-friendly messages

### 📊 **Results & Analytics**
- **Detailed Score Summary**: Comprehensive performance breakdown
- **Question Review**: Review all questions with correct/incorrect indicators
- **Performance Metrics**: Score, percentage, and detailed statistics
- **Retake Functionality**: Easy quiz retaking for practice

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js, TypeScript
- **AI Integration**: Google Gemini 2.5 Flash API
- **Video Processing**: yt-dlp-wrap for subtitle extraction
- **Styling**: CSS Variables, Flexbox, CSS Grid, Modern CSS features

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key
- yt-dlp binary (optional - will auto-download if not found)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AadeshhhGavhane/y2quiz
   cd y2quiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage

### 1. **Enter YouTube URL**
- Paste any YouTube video URL in the input field
- The app automatically cleans and normalizes the URL
- Click "Generate Quiz" to start processing

### 2. **AI Processing**
- **Subtitle Extraction**: Downloads and processes video subtitles
- **Transcript Cleaning**: Removes timestamps, HTML tags, and duplicates
- **Quiz Generation**: AI creates 10 multiple-choice questions
- **Real-time Updates**: Monitor progress with animated loading states

### 3. **Take the Quiz**
- **Single Question View**: Focus on one question at a time
- **Question Navigation**: Use the grid or Previous/Next buttons
- **Answer Selection**: Click options to select your answers
- **Progress Tracking**: Visual indicators show completion status

### 4. **Review Results**
- **Score Summary**: See your performance at a glance
- **Detailed Review**: Review each question with correct answers
- **Performance Metrics**: Understand your strengths and areas for improvement
- **Retake Option**: Practice again with the same questions

## 🎨 Customization

### Theme Variables
The app uses CSS custom properties for easy theming:

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --accent-color: #2563eb;
    --text-primary: #333333;
    /* ... more variables */
}
```

### ASCII Art Header
Customize the ASCII art title in `src/public/index.html`:

```html
<div class="ascii-title">
██╗   ██╗██████╗  ██████╗ ██╗   ██╗██╗███████╗
╚██╗ ██╔╝╚════██╗██╔═══██╗██║   ██║██║╚══███╔╝
 ╚████╔╝  █████╔╝██║   ██║██║   ██║██║  ███╔╝ 
  ╚██╔╝  ██╔═══╝ ██║▄▄ ██║██║   ██║██║ ███╔╝  
   ██║   ███████╗╚██████╔╝╚██████╔╝██║███████╗
   ╚═╝   ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚══════╝
</div>
```

## 🔧 Configuration

### Backend Settings
- **Port**: Configure server port in `.env`
- **Rate Limiting**: Adjust polling intervals and request limits
- **Task Cleanup**: Configure automatic cleanup of old tasks

### Frontend Settings
- **Polling Intervals**: Customize status check timing
- **Animation Durations**: Adjust CSS transition timings
- **Responsive Breakpoints**: Modify mobile/tablet breakpoints

## 📁 Project Structure

```
y2quiz/
├── src/
│   ├── public/           # Frontend assets
│   │   ├── index.html    # Main HTML file
│   │   ├── css/          # Stylesheets
│   │   └── js/           # Frontend JavaScript
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   └── server.ts         # Express server setup
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run watch    # Watch mode for TypeScript
```

### Key Components

#### **YouTube Service** (`src/services/youtube.service.ts`)
- Handles subtitle extraction using yt-dlp
- Processes and cleans transcript content
- Supports multiple subtitle formats

#### **Gemini Service** (`src/services/gemini.service.ts`)
- Integrates with Google Gemini 2.5 Flash
- Generates structured quiz questions
- Handles AI response parsing and validation

#### **Quiz Routes** (`src/routes/quiz.routes.ts`)
- Manages asynchronous quiz generation
- Implements rate limiting and task management
- Provides real-time status updates

#### **Frontend Logic** (`src/public/js/main.js`)
- Handles theme switching and UI interactions
- Manages quiz navigation and state
- Implements intelligent polling and error handling

## 🎯 Features in Detail

### **Asynchronous Processing**
- **Task Management**: Unique IDs for each quiz generation
- **Status Polling**: Real-time progress updates with smart backoff
- **Rate Limiting**: Prevents backend overload with intelligent throttling
- **Error Recovery**: Automatic retry mechanisms and graceful degradation

### **Mobile-First Design**
- **Responsive Layout**: Adapts seamlessly to all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Performance**: Fast loading and smooth animations
- **Accessibility**: Keyboard navigation and screen reader support

### **Quiz Interface**
- **Question Grid**: Visual navigation with status indicators
- **Progress Tracking**: Real-time completion status
- **Answer Validation**: Immediate feedback and correction
- **Results Summary**: Comprehensive performance analysis

## 🔒 Security & Performance

### **Security Features**
- Environment variable protection
- Input validation and sanitization
- Rate limiting and request throttling
- Secure API key management

### **Performance Optimizations**
- Asynchronous processing
- Intelligent polling with backoff
- Efficient DOM manipulation
- CSS animations and transitions
- Responsive image loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **yt-dlp** for subtitle extraction capabilities
- **Google Gemini** for AI-powered quiz generation
- **Express.js** for the robust backend framework
- **Modern CSS** for beautiful, responsive design

---

**Made with ❤️ for interactive learning**

Transform any YouTube video into an engaging quiz experience in seconds! 🎯✨ 