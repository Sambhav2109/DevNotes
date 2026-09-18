# DevNotes

A full-stack developer notes manager built with React, FastAPI, and SQLite.

## Features

- Create, edit, and delete notes
- Organize notes by category
- Search notes by title or content
- Persistent local SQLite storage
- Three-panel desktop interface
- REST API built with FastAPI

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: SQLite
- Icons: Lucide React

## Project Structure

DevNotes/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
└── .gitignore

## Run Locally

### Backend

cd backend
python -m venv venv

Windows:
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

The API runs at http://127.0.0.1:8000.

### Frontend

Open a second terminal:

cd frontend
npm install
npm run dev

Open the Vite URL shown in the terminal, normally http://localhost:5173.

## Resume Description

**DevNotes — Developer Notes Manager**
Built a full-stack notes application using React, FastAPI, and SQLite with CRUD operations, category filtering, search, and persistent local storage.
