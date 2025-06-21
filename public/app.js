// App State
let currentScreen = 'home';
let currentMode = '';
let currentFilter = '';
let currentBucket = '';
let buckets = [];
let flashcards = [];
let multipleChoice = [];
let longForm = [];
let currentCardIndex = 0;
let availableCards = [];
let completedCards = new Set();
let isFlipped = false;
let isAnswerShown = false;
let isEditMode = false;
let originalContent = {};
let editCache = {};

// Utility functions
function generateBucketId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'bkt_';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadBuckets();
    loadProgress();
    loadEditCache();
    
    // Migrate any legacy progress data to new bucket IDs
    migrateLegacyProgress();
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bucketParam = urlParams.get('bucket');
    const modeParam = urlParams.get('mode');
    const filterParam = urlParams.get('filter');
    
    if (bucketParam && modeParam && filterParam) {
        currentBucket = bucketParam;
        await loadBucketData(currentBucket);
        startStudy(modeParam, filterParam);
    } else {
    showScreen('home');
        renderBuckets();
    }
});

// Load buckets configuration
async function loadBuckets() {
    try {
        const response = await fetch('buckets.json');
        if (!response.ok) {
            throw new Error(`Failed to load buckets: ${response.status}`);
        }
        buckets = await response.json();
    } catch (error) {
        console.error('Error loading buckets:', error);
        alert('Failed to load study buckets. Please ensure buckets.json is present and properly formatted.');
        buckets = [];
    }
}

// Load study materials for a specific bucket
async function loadBucketData(bucketId) {
    try {
        const flashcardResponse = await fetch(`${bucketId}/flashcards.json`);
        if (flashcardResponse.ok) {
        flashcards = await flashcardResponse.json();
        } else {
            flashcards = [];
        }
        
        const mcResponse = await fetch(`${bucketId}/multiple-choice.json`);
        if (mcResponse.ok) {
            multipleChoice = await mcResponse.json();
        } else {
            multipleChoice = [];
        }
        
        const lfResponse = await fetch(`${bucketId}/long-form.json`);
        if (lfResponse.ok) {
            longForm = await lfResponse.json();
        } else {
            longForm = [];
        }
        
    } catch (error) {
        console.error('Error loading bucket data:', error);
        // Set empty arrays to prevent further errors
        flashcards = [];
        multipleChoice = [];
        longForm = [];
    }
}

// Render buckets on home screen
function renderBuckets() {
    const container = document.getElementById('bucket-options');
    container.innerHTML = '';
    
    buckets.forEach(bucket => {
        const bucketCard = document.createElement('div');
        bucketCard.className = 'bucket-card';
        bucketCard.innerHTML = `
            <div class="bucket-header" onclick="toggleBucket('${bucket.id}')">
                <div class="bucket-info">
                    <div class="bucket-title">${bucket.name}</div>
                    <div class="bucket-description">${bucket.description}</div>
                </div>
                <svg class="bucket-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="bucket-content" id="bucket-content-${bucket.id}">
                <div class="study-options">
                    <div class="study-card">
                        <h2 class="study-card-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem;">
                                <g class="oi-cards">
                                    <path class="oi-vector" d="M17.25 7.5H3.75C3.33579 7.5 3 7.83579 3 8.25V18.75C3 19.1642 3.33579 19.5 3.75 19.5H17.25C17.6642 19.5 18 19.1642 18 18.75V8.25C18 7.83579 17.6642 7.5 17.25 7.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path class="oi-vector" d="M6 4.5H20.25C20.4489 4.5 20.6397 4.57902 20.7803 4.71967C20.921 4.86032 21 5.05109 21 5.25V16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                            </svg>
                            Flashcards
                        </h2>
                        <div class="study-card-buttons">
                            <button class="study-card-btn" onclick="startStudyFromBucket('${bucket.id}', 'flashcards', 'active')">Continue</button>
                            <button class="study-card-btn" onclick="startStudyFromBucket('${bucket.id}', 'flashcards', 'all')">Review All</button>
                        </div>
                    </div>
                    
                    <div class="study-card">
                        <h2 class="study-card-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem;">
                                <g class="oi-radio-options">
                                    <circle class="oi-ellipse" cx="6.5" cy="6.5" r="3.5" stroke="currentColor" stroke-width="2"/>
                                    <circle class="oi-ellipse" cx="6.5" cy="17.5" r="3.5" stroke="currentColor" stroke-width="2"/>
                                    <circle class="oi-fill" cx="6.5" cy="6.5" r="1.25" fill="currentColor"/>
                                    <path class="oi-line" d="M21.5 6.5H13.5" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path class="oi-line" d="M21.5 17.5H13.5" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                            </svg>
                            Multiple Choice
                        </h2>
                        <div class="study-card-buttons">
                            <button class="study-card-btn" onclick="startStudyFromBucket('${bucket.id}', 'multiple-choice', 'active')">Continue</button>
                            <button class="study-card-btn" onclick="startStudyFromBucket('${bucket.id}', 'multiple-choice', 'all')">Review All</button>
                        </div>
                    </div>
                    
                    <div class="study-card">
                        <h2 class="study-card-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin-right: 0.5rem;">
                                <g class="oi-document">
                                    <path class="oi-box" d="M5 4C5 3.44772 5.44772 3 6 3H14L19 8V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4Z" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path class="oi-line" d="M13 3V9H19" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path class="oi-line" d="M15 13L9 13" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path class="oi-line" d="M15 17L9 17" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                            </svg>
                            Long Form Q&A
                        </h2>
                        <div class="study-card-buttons">
                            <button class="study-card-btn" onclick="startStudyFromBucket('${bucket.id}', 'long-form', 'active')">Continue</button>
                            <button class="study-card-btn" onclick="startStudyFromBucket('${bucket.id}', 'long-form', 'all')">Review All</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(bucketCard);
    });
}

// Toggle bucket expansion
function toggleBucket(bucketId) {
    const bucketCard = document.querySelector(`#bucket-content-${bucketId}`).parentElement;
    bucketCard.classList.toggle('expanded');
}

// Load progress from localStorage
function loadProgress() {
    const savedProgress = localStorage.getItem('studyProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        completedCards = new Set(progress.completedCards || []);
    }
}

// Save progress to localStorage
function saveProgress() {
    const progress = {
        completedCards: Array.from(completedCards)
    };
    localStorage.setItem('studyProgress', JSON.stringify(progress));
}

// Screen navigation
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');
    currentScreen = screenName;
}

function goHome() {
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    showScreen('home');
    currentMode = '';
    currentFilter = '';
    currentBucket = '';
    renderBuckets();
}

// Start study session from bucket
async function startStudyFromBucket(bucketId, mode, filter) {
    // Update URL with parameters
    const url = new URL(window.location);
    url.searchParams.set('bucket', bucketId);
    url.searchParams.set('mode', mode);
    url.searchParams.set('filter', filter);
    window.history.pushState({}, '', url);
    
    currentBucket = bucketId;
    await loadBucketData(bucketId);
    startStudy(mode, filter);
}

// Start study session
function startStudy(mode, filter) {
    currentMode = mode;
    currentFilter = filter;
    
    // Apply any cached edits
    applyEditCache();
    
    if (mode === 'flashcards') {
        prepareFlashcards();
        showScreen('flashcard');
        displayCurrentFlashcard();
    } else if (mode === 'multiple-choice') {
        prepareMultipleChoice();
        showScreen('multiple-choice');
        displayCurrentQuestion();
    } else if (mode === 'long-form') {
        prepareLongForm();
        showScreen('long-form');
        displayCurrentLongForm();
    }
}

// Prepare flashcards for study
function prepareFlashcards() {
    if (currentFilter === 'all') {
        availableCards = [...flashcards];
    } else {
        availableCards = flashcards.filter(card => 
            !completedCards.has(`${currentBucket}-flashcard-${card.id}`)
        );
    }
    
    if (availableCards.length === 0) {
        alert('No cards available!');
        goHome();
        return;
    }
    
    // Shuffle cards
    for (let i = availableCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
    }
    
    currentCardIndex = 0;
    isFlipped = false;
}

// Prepare multiple choice for study
function prepareMultipleChoice() {
    if (currentFilter === 'all') {
        availableCards = [...multipleChoice];
    } else {
        availableCards = multipleChoice.filter(card => 
            !completedCards.has(`${currentBucket}-mc-${card.id}`)
        );
    }
    
    if (availableCards.length === 0) {
        alert('No questions available!');
        goHome();
        return;
    }
    
    // Shuffle questions
    for (let i = availableCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
    }
    
    currentCardIndex = 0;
}

// Prepare long form for study
function prepareLongForm() {
    if (currentFilter === 'all') {
        availableCards = [...longForm];
    } else {
        availableCards = longForm.filter(card => 
            !completedCards.has(`${currentBucket}-longform-${card.id}`)
        );
    }
    
    if (availableCards.length === 0) {
        alert('No long form questions available!');
        goHome();
        return;
    }
    
    // Shuffle questions
    for (let i = availableCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
    }
    
    currentCardIndex = 0;
    isAnswerShown = false;
}

// Flashcard functions
function displayCurrentFlashcard() {
    if (availableCards.length === 0) {
        alert('No cards available!');
        goHome();
        return;
    }
    
    const card = availableCards[currentCardIndex];
    document.getElementById('flashcard-question').textContent = card.front;
    document.getElementById('flashcard-answer').textContent = card.back;
    document.getElementById('flashcard-counter').textContent = `${currentCardIndex + 1} of ${availableCards.length}`;
    
    // Reset flip state
    const flashcard = document.querySelector('.flashcard');
    flashcard.classList.remove('flipped');
    isFlipped = false;
}

function flipCard() {
    const flashcard = document.querySelector('.flashcard');
    flashcard.classList.toggle('flipped');
    isFlipped = !isFlipped;
}

function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % availableCards.length;
    displayCurrentFlashcard();
}

function previousCard() {
    currentCardIndex = (currentCardIndex - 1 + availableCards.length) % availableCards.length;
    displayCurrentFlashcard();
}

// Multiple choice functions
function displayCurrentQuestion() {
    if (availableCards.length === 0) {
        alert('No questions available!');
        goHome();
        return;
    }
    
    const question = availableCards[currentCardIndex];
    document.getElementById('mc-question').textContent = question.question;
    document.getElementById('mc-counter').textContent = `${currentCardIndex + 1} of ${availableCards.length}`;
    
    const optionsContainer = document.getElementById('mc-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(button);
    });
}

function selectAnswer(selectedIndex) {
    const question = availableCards[currentCardIndex];
    const buttons = document.querySelectorAll('.option-btn');
    
    // Disable all buttons
    buttons.forEach(button => button.disabled = true);
    
    // Show correct/incorrect styling
    buttons.forEach((button, index) => {
        if (index === question.correct) {
            button.classList.add('correct');
        } else if (index === selectedIndex && index !== question.correct) {
            button.classList.add('incorrect');
        }
    });
    
    // Show explanation if available
    if (question.explanation) {
        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.innerHTML = `<p><strong>Explanation:</strong> ${question.explanation}</p>`;
        document.getElementById('mc-options').appendChild(explanation);
    }
}

function nextMultipleChoice() {
    currentCardIndex = (currentCardIndex + 1) % availableCards.length;
    displayCurrentQuestion();
}

function previousMultipleChoice() {
    currentCardIndex = (currentCardIndex - 1 + availableCards.length) % availableCards.length;
    displayCurrentQuestion();
}

// Long form functions
function displayCurrentLongForm() {
    if (availableCards.length === 0) {
        alert('No long form questions available!');
        goHome();
        return;
    }
    
    const question = availableCards[currentCardIndex];
    document.getElementById('lf-question').textContent = question.question;
    document.getElementById('lf-answer-text').textContent = question.answer;
    document.getElementById('lf-counter').textContent = `${currentCardIndex + 1} of ${availableCards.length}`;
    
    // Reset answer visibility
    document.getElementById('lf-answer').style.display = 'none';
    document.getElementById('show-answer-btn').style.display = 'block';
    document.getElementById('show-answer-btn').textContent = 'Show Answer';
    isAnswerShown = false;
}

function showAnswer() {
    const answerDiv = document.getElementById('lf-answer');
    const button = document.getElementById('show-answer-btn');
    
    if (!isAnswerShown) {
        answerDiv.style.display = 'block';
        button.textContent = 'Hide Answer';
        isAnswerShown = true;
    } else {
        answerDiv.style.display = 'none';
        button.textContent = 'Show Answer';
        isAnswerShown = false;
    }
}

function nextLongForm() {
        currentCardIndex = (currentCardIndex + 1) % availableCards.length;
    displayCurrentLongForm();
}

function previousLongForm() {
    currentCardIndex = (currentCardIndex - 1 + availableCards.length) % availableCards.length;
    displayCurrentLongForm();
}

// Mark current item as complete
function markComplete() {
    if (availableCards.length === 0) return;
    
    const currentCard = availableCards[currentCardIndex];
    let cardKey = '';
    
    if (currentMode === 'flashcards') {
        cardKey = `${currentBucket}-flashcard-${currentCard.id}`;
    } else if (currentMode === 'multiple-choice') {
        cardKey = `${currentBucket}-mc-${currentCard.id}`;
    } else if (currentMode === 'long-form') {
        cardKey = `${currentBucket}-longform-${currentCard.id}`;
    }
    
    completedCards.add(cardKey);
        saveProgress();
    
    // Remove from available cards if in active mode
    if (currentFilter === 'active') {
        availableCards.splice(currentCardIndex, 1);
        if (availableCards.length === 0) {
            alert('All items completed!');
            goHome();
            return;
        }
        // Adjust index if we're at the end
        if (currentCardIndex >= availableCards.length) {
            currentCardIndex = 0;
        }
    } else {
        // In 'all' mode, just move to next card
        nextCard();
    }
    
    // Refresh display
    if (currentMode === 'flashcards') {
        displayCurrentFlashcard();
    } else if (currentMode === 'multiple-choice') {
        displayCurrentQuestion();
    } else if (currentMode === 'long-form') {
        displayCurrentLongForm();
    }
}

// Reset all progress
function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        completedCards.clear();
        saveProgress();
        alert('Progress reset successfully!');
    }
}

// Future bucket management functions (for UI implementation)
async function createNewBucket(name, description) {
    const newBucket = {
        id: generateBucketId(),
        name: name,
        description: description,
        createdAt: getCurrentTimestamp(),
        lastModified: getCurrentTimestamp()
    };
    
    // TODO: Implement backend API call to:
    // 1. Add bucket to buckets.json
    // 2. Create bucket directory structure
    // 3. Initialize empty JSON files
    
    console.log('New bucket would be created:', newBucket);
    return newBucket;
}

async function updateBucket(bucketId, updates) {
    // TODO: Implement backend API call to update bucket metadata
    const updateData = {
        ...updates,
        lastModified: getCurrentTimestamp()
    };
    
    console.log('Bucket would be updated:', bucketId, updateData);
    return updateData;
}

async function deleteBucket(bucketId) {
    // TODO: Implement backend API call to:
    // 1. Remove bucket from buckets.json
    // 2. Delete bucket directory and contents
    // 3. Clean up progress data
    
    console.log('Bucket would be deleted:', bucketId);
}

// Edit Mode Functions
function toggleEditMode() {
    if (isEditMode) {
        cancelEdit();
    } else {
        enterEditMode();
    }
}

function enterEditMode() {
    isEditMode = true;
    document.body.classList.add('edit-mode');
    
    // Store original content for cancel functionality
    if (currentMode === 'flashcards') {
        const card = availableCards[currentCardIndex];
        originalContent = {
            front: card.front,
            back: card.back
        };
        makeFlashcardEditable();
    } else if (currentMode === 'multiple-choice') {
        const question = availableCards[currentCardIndex];
        originalContent = {
            question: question.question,
            options: [...question.options],
            correct: question.correct,
            explanation: question.explanation || ''
        };
        makeMultipleChoiceEditable();
    } else if (currentMode === 'long-form') {
        const question = availableCards[currentCardIndex];
        originalContent = {
            question: question.question,
            answer: question.answer
        };
        makeLongFormEditable();
    }
}

function exitEditMode() {
    isEditMode = false;
    document.body.classList.remove('edit-mode');
    originalContent = {};
}

function cancelEdit() {
    // Restore original content
    if (currentMode === 'flashcards') {
        const card = availableCards[currentCardIndex];
        card.front = originalContent.front;
        card.back = originalContent.back;
        displayCurrentFlashcard();
    } else if (currentMode === 'multiple-choice') {
        const question = availableCards[currentCardIndex];
        question.question = originalContent.question;
        question.options = [...originalContent.options];
        question.correct = originalContent.correct;
        question.explanation = originalContent.explanation;
        displayCurrentQuestion();
    } else if (currentMode === 'long-form') {
        const question = availableCards[currentCardIndex];
        question.question = originalContent.question;
        question.answer = originalContent.answer;
        displayCurrentLongForm();
    }
    
    exitEditMode();
}

function saveEdit() {
    // Get edited content and update the data
    if (currentMode === 'flashcards') {
        saveFlashcardEdit();
    } else if (currentMode === 'multiple-choice') {
        saveMultipleChoiceEdit();
    } else if (currentMode === 'long-form') {
        saveLongFormEdit();
    }
    
    // Save to localStorage cache
    saveEditCache();
    exitEditMode();
}

function makeFlashcardEditable() {
    const questionEl = document.getElementById('flashcard-question');
    const answerEl = document.getElementById('flashcard-answer');
    
    questionEl.innerHTML = `<div class="editable-field"><textarea>${questionEl.textContent}</textarea></div>`;
    answerEl.innerHTML = `<div class="editable-field"><textarea>${answerEl.textContent}</textarea></div>`;
}

function makeMultipleChoiceEditable() {
    const questionEl = document.getElementById('mc-question');
    const question = availableCards[currentCardIndex];
    
    questionEl.innerHTML = `<div class="editable-field"><textarea>${questionEl.textContent}</textarea></div>`;
    
    const optionsContainer = document.getElementById('mc-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.innerHTML = `
            <div class="editable-field" style="margin-bottom: var(--spacing-sm);">
                <label>
                    <input type="radio" name="correct-option" value="${index}" ${index === question.correct ? 'checked' : ''}>
                    Option ${index + 1}:
                </label>
                <textarea>${option}</textarea>
            </div>
        `;
        optionsContainer.appendChild(optionDiv);
    });
    
    // Add explanation field
    const explanationDiv = document.createElement('div');
    explanationDiv.innerHTML = `
        <div class="editable-field">
            <label>Explanation (optional):</label>
            <textarea>${question.explanation || ''}</textarea>
        </div>
    `;
    optionsContainer.appendChild(explanationDiv);
}

function makeLongFormEditable() {
    const questionEl = document.getElementById('lf-question');
    const answerEl = document.getElementById('lf-answer-text');
    
    questionEl.innerHTML = `<div class="editable-field"><textarea>${questionEl.textContent}</textarea></div>`;
    
    // Show answer if hidden and make it editable
    document.getElementById('lf-answer').style.display = 'block';
    document.getElementById('show-answer-btn').style.display = 'none';
    answerEl.innerHTML = `<div class="editable-field"><textarea>${answerEl.textContent}</textarea></div>`;
}

function saveFlashcardEdit() {
    const card = availableCards[currentCardIndex];
    const questionTextarea = document.querySelector('#flashcard-question textarea');
    const answerTextarea = document.querySelector('#flashcard-answer textarea');
    
    card.front = questionTextarea.value.trim();
    card.back = answerTextarea.value.trim();
    
    displayCurrentFlashcard();
}

function saveMultipleChoiceEdit() {
    const question = availableCards[currentCardIndex];
    const questionTextarea = document.querySelector('#mc-question textarea');
    const optionTextareas = document.querySelectorAll('#mc-options textarea');
    const correctRadio = document.querySelector('input[name="correct-option"]:checked');
    
    question.question = questionTextarea.value.trim();
    question.options = Array.from(optionTextareas).slice(0, -1).map(textarea => textarea.value.trim());
    question.correct = parseInt(correctRadio.value);
    question.explanation = optionTextareas[optionTextareas.length - 1].value.trim();
    
    displayCurrentQuestion();
}

function saveLongFormEdit() {
    const question = availableCards[currentCardIndex];
    const questionTextarea = document.querySelector('#lf-question textarea');
    const answerTextarea = document.querySelector('#lf-answer-text textarea');
    
    question.question = questionTextarea.value.trim();
    question.answer = answerTextarea.value.trim();
    
    displayCurrentLongForm();
}

function saveEditCache() {
    // Cache edited content to localStorage
    const cacheKey = `editCache_${currentBucket}_${currentMode}`;
    if (!editCache[cacheKey]) {
        editCache[cacheKey] = {};
    }
    
    const currentItem = availableCards[currentCardIndex];
    editCache[cacheKey][currentItem.id] = { ...currentItem };
    
    localStorage.setItem('studyEditCache', JSON.stringify(editCache));
}

function loadEditCache() {
    const cached = localStorage.getItem('studyEditCache');
    if (cached) {
        editCache = JSON.parse(cached);
    }
}

function applyEditCache() {
    const cacheKey = `editCache_${currentBucket}_${currentMode}`;
    if (editCache[cacheKey]) {
        // Apply cached edits to current data
        if (currentMode === 'flashcards') {
            flashcards.forEach(card => {
                if (editCache[cacheKey][card.id]) {
                    Object.assign(card, editCache[cacheKey][card.id]);
                }
            });
        } else if (currentMode === 'multiple-choice') {
            multipleChoice.forEach(question => {
                if (editCache[cacheKey][question.id]) {
                    Object.assign(question, editCache[cacheKey][question.id]);
                }
            });
        } else if (currentMode === 'long-form') {
            longForm.forEach(question => {
                if (editCache[cacheKey][question.id]) {
                    Object.assign(question, editCache[cacheKey][question.id]);
                }
            });
                 }
     }
 }

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (isEditMode) {
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveEdit();
        }
    }
});

// Migration utility (for converting old progress data to new bucket IDs)
function migrateLegacyProgress() {
    const legacyMapping = {
        'data-center-systems': 'bkt_7k9m2x1p',
        'construction-management': 'bkt_3n8q5r2w',
        'pre-construction-management': 'bkt_9v4c7z6m'
    };
    
    const currentProgress = Array.from(completedCards);
    let migrated = false;
    
    currentProgress.forEach(progressKey => {
        // Check if this is an old-style progress key
        Object.keys(legacyMapping).forEach(oldId => {
            if (progressKey.startsWith(oldId + '-')) {
                const newKey = progressKey.replace(oldId + '-', legacyMapping[oldId] + '-');
                completedCards.delete(progressKey);
                completedCards.add(newKey);
                migrated = true;
            }
        });
    });
    
    if (migrated) {
        saveProgress();
        console.log('Legacy progress data migrated to new bucket IDs');
    }
} 