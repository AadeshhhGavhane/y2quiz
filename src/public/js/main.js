// Theme management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// Check for saved theme preference or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Form handling
const urlForm = document.getElementById('urlForm');
const loadingIndicator = document.getElementById('loadingIndicator');
const quizContainer = document.getElementById('quizContainer');
const loadingTooltip = document.getElementById('loadingTooltip');
const loadingIcon = document.getElementById('loadingIcon');
const loadingText = document.getElementById('loadingText');

// Quiz state
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};

// Ensure elements are hidden initially
loadingIndicator.classList.add('hidden');
quizContainer.classList.add('hidden');

// URL cleaning function
function cleanYouTubeUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Handle different YouTube URL formats
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            // For youtube.com URLs, keep only the 'v' parameter
            const videoId = urlObj.searchParams.get('v');
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        } else if (urlObj.hostname === 'youtu.be') {
            // For youtu.be URLs, extract video ID from path
            const videoId = urlObj.pathname.substring(1); // Remove leading slash
            if (videoId) {
                return `https://youtu.be/${videoId}`;
            }
        } else if (urlObj.hostname === 'm.youtube.com') {
            // For mobile YouTube URLs
            const videoId = urlObj.searchParams.get('v');
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        }
        
        // If we can't parse it properly, return the original URL
        return url;
    } catch (error) {
        // If URL parsing fails, return the original URL
        console.warn('Failed to parse URL:', error);
        return url;
    }
}

urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const videoUrl = document.getElementById('videoUrl').value;
    const cleanedUrl = cleanYouTubeUrl(videoUrl);
    
    // Update the input field with the cleaned URL
    document.getElementById('videoUrl').value = cleanedUrl;
    
    // Show loading tooltip with animation
    showLoadingTooltip();
    quizContainer.classList.add('hidden');
    
    try {
        // Start quiz generation (get task ID immediately)
        const response = await fetch('/api/quiz/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoUrl: cleanedUrl })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Failed to start quiz generation');
        }
        
        const { taskId } = await response.json();
        
        // Start polling for status
        pollTaskStatus(taskId);
        
    } catch (error) {
        console.error('Error:', error);
        hideLoadingTooltip();
        alert(error.message || 'Failed to start quiz generation. Please try again.');
    }
});

function pollTaskStatus(taskId) {
    const statusMapping = {
        'pending': { text: 'Initializing...', progress: 0 },
        'extracting': { text: 'Extracting video subtitles...', progress: 20 },
        'processing': { text: 'Processing transcript...', progress: 40 },
        'generating': { text: 'Generating quiz questions...', progress: 60 },
        'completed': { text: 'Quiz ready!', progress: 100 },
        'failed': { text: 'Failed to generate quiz', progress: 0 }
    };
    
    let pollCount = 0;
    const maxPolls = 120; // Maximum polls to prevent infinite requests
    
    async function checkStatus() {
        try {
            pollCount++;
            
            // Stop polling after maximum attempts to prevent infinite requests
            if (pollCount > maxPolls) {
                hideLoadingTooltip();
                alert('Quiz generation is taking longer than expected. Please try again.');
                return;
            }
            
            const response = await fetch(`/api/quiz/status/${taskId}`);
            
            if (response.status === 429) {
                // Rate limited - wait longer before next attempt
                console.log('Rate limited, waiting longer before next poll...');
                setTimeout(checkStatus, 15000); // Wait 15 seconds on rate limit
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to check status');
            }
            
            const data = await response.json();
            const statusInfo = statusMapping[data.status] || { text: 'Processing...', progress: 0 };
            
            // Update loading text and progress
            updateLoadingStatus(statusInfo.text, data.progress || statusInfo.progress);
            
            if (data.status === 'completed') {
                // Task completed - stop polling and show quiz immediately
                hideLoadingTooltip();
                currentQuiz = data.result;
                currentQuestionIndex = 0;
                userAnswers = {};
                displayQuiz(data.result);
                return; // Stop polling
                
            } else if (data.status === 'failed') {
                // Task failed - stop polling
                hideLoadingTooltip();
                alert(data.error || 'Quiz generation failed. Please try again.');
                return; // Stop polling
                
            } else {
                // Task still in progress, schedule next poll every 5 seconds
                setTimeout(checkStatus, 5000);
            }
            
        } catch (error) {
            console.error('Error checking status:', error);
            
            // On error, wait a bit longer before retrying
            if (pollCount < maxPolls) {
                setTimeout(checkStatus, 5000); // Wait 5 seconds on error
            } else {
                hideLoadingTooltip();
                alert('Lost connection to server. Please try again.');
            }
        }
    }
    
    // Start first check after 10 seconds (gives backend time to process)
    console.log('Starting status polling in 15 seconds...');
    setTimeout(checkStatus, 15000);
}

function updateLoadingStatus(text, progress) {
    // Update text with fade effect
    loadingText.style.opacity = '0.5';
    setTimeout(() => {
        loadingText.textContent = text;
        loadingText.style.opacity = '1';
        
        // Update icon based on progress
        if (progress >= 100) {
            loadingIcon.className = 'loading-icon completed';
        } else {
            loadingIcon.className = 'loading-icon';
        }
    }, 150);
}

function showLoadingTooltip() {
    loadingTooltip.classList.add('show');
    loadingIcon.className = 'loading-icon';
    loadingText.textContent = 'Starting...';
}

function hideLoadingTooltip() {
    loadingTooltip.classList.remove('show');
}

function displayQuiz(quiz) {
    quizContainer.innerHTML = ''; // Clear previous quiz
    
    // Create the new quiz interface
    const quizHTML = `
        <div class="quiz-sidebar">
            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(Object.keys(userAnswers).length / quiz.questions.length) * 100}%"></div>
                </div>
                <div class="progress-text">${Object.keys(userAnswers).length} of ${quiz.questions.length} answered</div>
            </div>
            
            <div class="question-grid">
                ${quiz.questions.map((_, index) => `
                    <div class="question-indicator ${index === currentQuestionIndex ? 'current' : ''} ${userAnswers[index] !== undefined ? 'answered' : ''}" 
                         onclick="goToQuestion(${index})">
                        ${index + 1}
                    </div>
                `).join('')}
            </div>
            
            <div class="quiz-legend">
                <div class="legend-item">
                    <div class="legend-dot current"></div>
                    <span>Current</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot answered"></div>
                    <span>Answered</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot unanswered"></div>
                    <span>Unanswered</span>
                </div>
            </div>
        </div>
        
        <div class="quiz-main">
            <div class="question-display">
                <div class="question-header">
                    <div class="question-number" id="questionNumber">Question ${currentQuestionIndex + 1} of ${quiz.questions.length}</div>
                    <div class="question-text" id="currentQuestionText"></div>
                </div>
                
                <div class="question-options">
                    <div class="options" id="currentQuestionOptions">
                        <!-- Options will be populated by updateQuestionDisplay -->
                    </div>
                </div>
            </div>
            
            <div class="navigation-buttons">
                <button class="nav-button" id="prevButton" onclick="previousQuestion()">
                    ← Previous
                </button>
                
                <div id="actionButton">
                    <!-- Will be populated by updateActionButton -->
                </div>
                
                <button class="nav-button" id="nextButton" onclick="nextQuestion()">
                    Next →
                </button>
            </div>
        </div>
    `;
    
    quizContainer.innerHTML = quizHTML;
    quizContainer.classList.remove('hidden');
    
    updateQuestionDisplay();
}

function updateQuestionDisplay() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const questionNumberElement = document.getElementById('questionNumber');
    const questionTextElement = document.getElementById('currentQuestionText');
    const optionsContainer = document.getElementById('currentQuestionOptions');
    
    // Fix: Update the question number display
    questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
    questionTextElement.textContent = question.question;
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    optionsContainer.innerHTML = question.options.map((option, index) => `
        <label class="option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" onclick="selectAnswer(${index})">
            <input type="radio" 
                   name="currentQuestion" 
                   value="${index}"
                   ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}
                   style="display: none;">
            <div class="option-letter">${optionLetters[index]}</div>
            <span>${option}</span>
        </label>
    `).join('');
    
    updateQuestionGrid();
    updateNavigationButtons();
    updateActionButton();
    updateProgress();
}

function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    updateQuestionDisplay();
}

function goToQuestion(questionIndex) {
    currentQuestionIndex = questionIndex;
    updateQuestionDisplay();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestionDisplay();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        updateQuestionDisplay();
    }
}

function updateQuestionGrid() {
    const indicators = document.querySelectorAll('.question-indicator');
    indicators.forEach((indicator, index) => {
        indicator.className = 'question-indicator';
        if (index === currentQuestionIndex) {
            indicator.classList.add('current');
        }
        if (userAnswers[index] !== undefined) {
            indicator.classList.add('answered');
        }
    });
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === currentQuiz.questions.length - 1;
}

function updateActionButton() {
    const actionButtonContainer = document.getElementById('actionButton');
    const allAnswered = Object.keys(userAnswers).length === currentQuiz.questions.length;
    
    if (allAnswered) {
        actionButtonContainer.innerHTML = `
            <button class="submit-quiz" onclick="submitQuiz()">
                Submit Quiz
            </button>
        `;
    } else {
        const remaining = currentQuiz.questions.length - Object.keys(userAnswers).length;
        actionButtonContainer.innerHTML = `
            <button class="submit-quiz" disabled>
                ${remaining} more to answer
            </button>
        `;
    }
}

function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = currentQuiz.questions.length;
    const percentage = (answeredCount / totalCount) * 100;
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${answeredCount} of ${totalCount} answered`;
}

function submitQuiz() {
    let score = 0;
    let totalQuestions = currentQuiz.questions.length;
    
    // Calculate score
    currentQuiz.questions.forEach((q, index) => {
        if (userAnswers[index] === q.correctAnswer) {
            score++;
        }
    });
    
    // Show detailed results
    displayDetailedResults(score, totalQuestions);
}

function displayDetailedResults(score, total) {
    const percentage = (score / total) * 100;
    let grade, message, headerColor;
    
    if (percentage >= 90) {
        grade = 'A+'; message = 'Outstanding! You have excellent understanding!'; headerColor = '#16a34a';
    } else if (percentage >= 80) {
        grade = 'A'; message = 'Great job! You understood most of the content!'; headerColor = '#16a34a';
    } else if (percentage >= 70) {
        grade = 'B'; message = 'Good work! You got most questions right!'; headerColor = '#2563eb';
    } else if (percentage >= 60) {
        grade = 'C'; message = 'Not bad! You might want to review the video again.'; headerColor = '#ea580c';
    } else {
        grade = 'F'; message = 'Consider watching the video again to improve your understanding.'; headerColor = '#dc2626';
    }
    
    const correctAnswers = score;
    const incorrectAnswers = total - score;
    
    const resultsHTML = `
        <div class="results-container">
            <div class="results-header" style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd);">
                <h2>Quiz Complete!</h2>
                <div class="score">${score}/${total}</div>
                <div class="percentage">${percentage.toFixed(1)}% • Grade: ${grade}</div>
                <p style="margin-top: 1rem; opacity: 0.9;">${message}</p>
            </div>
            
            <div class="results-content">
                <div class="score-display">
                    <div class="score-item highlight">
                        <div class="score-number">${score}</div>
                        <div class="score-label">Correct</div>
                    </div>
                    <div class="score-item">
                        <div class="score-number">${incorrectAnswers}</div>
                        <div class="score-label">Incorrect</div>
                    </div>
                    <div class="score-item">
                        <div class="score-number">${percentage.toFixed(1)}%</div>
                        <div class="score-label">Score</div>
                    </div>
                    <div class="score-item">
                        <div class="score-number">${grade}</div>
                        <div class="score-label">Grade</div>
                    </div>
                </div>
                
                <div class="questions-review">
                    <h3 style="margin-bottom: 1.5rem; color: var(--text-primary);">Question Review</h3>
                    ${currentQuiz.questions.map((q, index) => {
                        const userAnswer = userAnswers[index];
                        const isCorrect = userAnswer === q.correctAnswer;
                        const optionLetters = ['A', 'B', 'C', 'D'];
                        
                        return `
                            <div class="review-question ${isCorrect ? 'correct' : 'incorrect'}">
                                <div class="review-header">
                                    <span class="review-question-number">Question ${index + 1}</span>
                                    <span class="review-status ${isCorrect ? 'correct' : 'incorrect'}">
                                        ${isCorrect ? '✅ Correct' : '❌ Incorrect'}
                                    </span>
                                </div>
                                
                                <div class="review-question-text">${q.question}</div>
                                
                                <div class="review-answers">
                                    ${q.options.map((option, optIndex) => {
                                        let optionClass = 'review-option';
                                        let indicator = 'neutral';
                                        
                                        if (optIndex === q.correctAnswer) {
                                            optionClass += ' correct-answer';
                                            indicator = 'correct';
                                        }
                                        
                                        if (optIndex === userAnswer) {
                                            if (isCorrect) {
                                                optionClass += ' user-answer';
                                                indicator = 'user';
                                            } else {
                                                optionClass += ' user-wrong';
                                                indicator = 'wrong';
                                            }
                                        }
                                        
                                        return `
                                            <div class="${optionClass}">
                                                <div class="option-indicator ${indicator}">${optionLetters[optIndex]}</div>
                                                <span>${option}</span>
                                                ${optIndex === q.correctAnswer ? '<span style="margin-left: auto; color: #16a34a; font-weight: 600;">✓ Correct</span>' : ''}
                                                ${optIndex === userAnswer && !isCorrect ? '<span style="margin-left: auto; color: #dc2626; font-weight: 600;">Your Answer</span>' : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="results-actions">
                    <button class="action-button primary" onclick="location.reload()">
                        Try Another Video
                    </button>
                    <button class="action-button secondary" onclick="retakeQuiz()">
                        Retake This Quiz
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Hide quiz and show results
    quizContainer.style.display = 'none';
    document.querySelector('.container').insertAdjacentHTML('beforeend', resultsHTML);
    
    // Scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function retakeQuiz() {
    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = {};
    
    // Remove results
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        resultsContainer.remove();
    }
    
    // Show quiz again
    quizContainer.style.display = 'flex';
    updateQuestionDisplay();
    
    // Scroll to quiz
    quizContainer.scrollIntoView({ behavior: 'smooth' });
}