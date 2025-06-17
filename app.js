// App State
let currentScreen = 'home';
let currentMode = '';
let currentFilter = '';
let flashcards = [];
let multipleChoice = [];
let currentCardIndex = 0;
let availableCards = [];
let completedCards = new Set();
let isFlipped = false;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    loadProgress();
    showScreen('home');
});

// Load study materials
async function loadData() {
    try {
        const flashcardResponse = await fetch('flashcards.json');
        if (!flashcardResponse.ok) {
            throw new Error(`Failed to load flashcards: ${flashcardResponse.status}`);
        }
        flashcards = await flashcardResponse.json();
        
        const mcResponse = await fetch('multiple-choice.json');
        if (!mcResponse.ok) {
            throw new Error(`Failed to load multiple choice: ${mcResponse.status}`);
        }
        multipleChoice = await mcResponse.json();
        
        // Validate that we have content
        if (!flashcards || flashcards.length === 0) {
            throw new Error('No flashcards found in flashcards.json');
        }
        if (!multipleChoice || multipleChoice.length === 0) {
            throw new Error('No questions found in multiple-choice.json');
        }
        
    } catch (error) {
        console.error('Error loading study data:', error);
        alert('Failed to load study materials. Please ensure flashcards.json and multiple-choice.json are present and properly formatted.');
        // Set empty arrays to prevent further errors
        flashcards = [];
        multipleChoice = [];
    }
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
    showScreen('home');
    currentMode = '';
    currentFilter = '';
}

// Start study session
function startStudy(mode, filter) {
    currentMode = mode;
    currentFilter = filter;
    
    if (mode === 'flashcards') {
        prepareFlashcards();
        showScreen('flashcard');
        displayCurrentFlashcard();
    } else if (mode === 'multiple-choice') {
        prepareMultipleChoice();
        showScreen('multiple-choice');
        displayCurrentQuestion();
    }
}

// Prepare flashcards for study
function prepareFlashcards() {
    if (currentFilter === 'all') {
        availableCards = [...flashcards];
    } else {
        availableCards = flashcards.filter(card => 
            !completedCards.has(`flashcard-${card.id}`)
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
            !completedCards.has(`mc-${card.id}`)
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
    
    // Update counter
    document.getElementById('flashcard-counter').textContent = 
        `${currentCardIndex + 1} of ${availableCards.length}`;
    
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
    
    // Handle cycling for multiple choice too
    if (currentCardIndex >= availableCards.length) {
        currentCardIndex = 0;
    }
    
    const question = availableCards[currentCardIndex];
    document.getElementById('mc-question').textContent = question.question;
    
    // Update counter
    document.getElementById('mc-counter').textContent = 
        `${currentCardIndex + 1} of ${availableCards.length}`;
    
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
    const options = document.querySelectorAll('.option-btn');
    
    // Check if answer is correct
    const isCorrect = selectedIndex === question.correctIndex;
    
    options.forEach((option, index) => {
        option.disabled = true;
        if (index === question.correctIndex) {
            option.classList.add('correct');
        } else if (index === selectedIndex && index !== question.correctIndex) {
            option.classList.add('incorrect');
        } else if (index !== question.correctIndex) {
            option.classList.add('incorrect');
        }
    });
    
    // If correct, mark as complete automatically
    if (isCorrect) {
        const cardId = `mc-${question.id}`;
        completedCards.add(cardId);
        saveProgress();
    }
    
    // Auto advance after 2 seconds
    setTimeout(() => {
        currentCardIndex = (currentCardIndex + 1) % availableCards.length;
        displayCurrentQuestion();
    }, 2000);
}

// Mark current item as complete
function markComplete() {
    if (currentMode === 'flashcards' && availableCards.length > 0) {
        const cardId = `flashcard-${availableCards[currentCardIndex].id}`;
        completedCards.add(cardId);
        saveProgress();
        nextCard();
    } else if (currentMode === 'multiple-choice' && availableCards.length > 0) {
        const cardId = `mc-${availableCards[currentCardIndex].id}`;
        completedCards.add(cardId);
        saveProgress();
        currentCardIndex++;
        displayCurrentQuestion();
    }
}

// Reset all progress
function resetProgress() {
    if (confirm('Reset all progress? This cannot be undone.')) {
        completedCards.clear();
        localStorage.removeItem('studyProgress');
        alert('Progress reset!');
    }
} 