# Study Guide App

A minimalist flashcard and multiple choice study app for personal use.

## Features

- **Flashcards**: Front/back cards with flip animation
- **Multiple Choice**: Questions with instant feedback
- **Progress Tracking**: Mark cards as complete, filter by active/all
- **Local Storage**: All progress saved locally
- **Mobile-First**: Responsive design optimized for mobile

## Usage

1. Open `index.html` in your browser
2. Choose your study mode:
   - **All**: Study all cards/questions
   - **Active**: Study only incomplete cards/questions
3. **Flashcards**: Tap left/right to navigate, center to flip, ✓ to mark complete
4. **Multiple Choice**: Select answer, auto-advances after showing correct answer
5. Use **Reset Progress** to clear all completion status

## Customization

### Adding Study Materials

**Flashcards** (`flashcards.json`):
```json
{
    "id": 9,
    "front": "Your question here",
    "back": "Your answer here"
}
```

**Multiple Choice** (`multiple-choice.json`):
```json
{
    "id": 9,
    "question": "Your question here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctIndex": 1
}
```

### Customizing Colors

Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #000000;
    --secondary-color: #ffffff;
    --accent-color: #007AFF;
}
```

## File Structure

- `index.html` - Main app interface
- `styles.css` - All styling and design
- `app.js` - Application logic
- `flashcards.json` - Flashcard data
- `multiple-choice.json` - Multiple choice data

Enjoy studying! 📚 