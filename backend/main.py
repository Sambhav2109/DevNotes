from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "devnotes.db"

app = FastAPI(title="DevNotes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NoteCreate(BaseModel):
    title: str
    content: str
    category: str = "General"

class Note(NoteCreate):
    id: int
    created_at: str
    updated_at: str

def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    connection = get_connection()
    connection.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'General',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.commit()
    connection.close()

@app.on_event("startup")
def startup():
    init_db()

@app.get("/notes", response_model=list[Note])
def list_notes(search: str = "", category: str = "All"):
    connection = get_connection()
    query = "SELECT * FROM notes WHERE 1=1"
    params = []

    if search.strip():
        query += " AND (title LIKE ? OR content LIKE ?)"
        term = "%" + search.strip() + "%"
        params.extend([term, term])

    if category != "All":
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY updated_at DESC, id DESC"
    rows = connection.execute(query, params).fetchall()
    connection.close()
    return [dict(row) for row in rows]

@app.post("/notes", response_model=Note, status_code=201)
def create_note(note: NoteCreate):
    if not note.title.strip() or not note.content.strip():
        raise HTTPException(status_code=400, detail="Title and content are required.")

    connection = get_connection()
    cursor = connection.execute(
        "INSERT INTO notes (title, content, category) VALUES (?, ?, ?)",
        (note.title.strip(), note.content.strip(), note.category.strip() or "General"),
    )
    connection.commit()
    row = connection.execute(
        "SELECT * FROM notes WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    connection.close()
    return dict(row)

@app.put("/notes/{note_id}", response_model=Note)
def update_note(note_id: int, note: NoteCreate):
    if not note.title.strip() or not note.content.strip():
        raise HTTPException(status_code=400, detail="Title and content are required.")

    connection = get_connection()
    result = connection.execute(
        """
        UPDATE notes
        SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (note.title.strip(), note.content.strip(), note.category.strip() or "General", note_id),
    )
    connection.commit()

    if result.rowcount == 0:
        connection.close()
        raise HTTPException(status_code=404, detail="Note not found.")

    row = connection.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    connection.close()
    return dict(row)

@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    connection = get_connection()
    result = connection.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    connection.commit()
    connection.close()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found.")

    return {"message": "Note deleted successfully."}
