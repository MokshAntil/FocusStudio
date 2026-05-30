# Focus Studio — Student Productivity App

A minimal, elegant productivity suite designed for students. Built with React + JavaScript.

## Features

### 🍅 Focus Timer
- Pomodoro Technique (25/5/15 min cycles)
- Custom timer mode
- Visual ring countdown with animated progress
- Sound notifications on completion
- Session history & daily focus stats
- Configurable durations

### 💰 Expense Tracker
- Log income & expenses with date, time, category & note
- Category breakdown with visual bars
- Monthly summary (income vs expense vs net)
- Filter by type, sort by date or amount, search
- Edit/delete transactions

### 📅 Planner
- Week view with hourly time grid
- Month view calendar
- Add tasks with start/end time, priority, tags
- Mark tasks complete
- Upcoming tasks overview

### 📝 Quick Notes
- Create, edit, delete notes
- Pin important notes
- Color accent themes
- Word count
- Auto-saves on blur

### 📊 Dashboard
- Overview of all features
- Daily pomodoro count
- Task completion for today
- Financial balance
- Upcoming tasks list

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open http://localhost:3000 in your browser.

## Tech Stack
- React 18
- JavaScript (no TypeScript)
- CSS Variables (no external UI library)
- localStorage for persistence
- lucide-react for icons

## Data Persistence
All data is saved to `localStorage` automatically:
- `timer-settings` — Pomodoro durations & preferences
- `pomodoro-sessions` — Session history
- `transactions` — Expense/income entries
- `planner-tasks` — Calendar tasks
- `quick-notes` — Notes
