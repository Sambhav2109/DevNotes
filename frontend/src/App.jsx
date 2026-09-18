import { useEffect, useMemo, useState } from "react";
import { Code2, FileText, Plus, Search, Trash2, Edit3, X } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";
const categories = ["All", "General", "Python", "Java", "C++", "Web", "SQL"];
const emptyForm = { title: "", content: "", category: "General" };

export default function App() {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId]
  );

  async function loadNotes() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, category });
      const response = await fetch(API_URL + "/notes?" + params);
      if (!response.ok) throw new Error("Could not load notes.");
      const data = await response.json();
      setNotes(data);
      if (data.length && !data.some((note) => note.id === selectedId)) {
        setSelectedId(data[0].id);
      }
      if (!data.length) setSelectedId(null);
    } catch {
      setError("Start the FastAPI server to load your notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadNotes, 180);
    return () => clearTimeout(timeout);
  }, [search, category]);

  function startCreate() {
    setForm(emptyForm);
    setEditing(false);
    setShowEditor(true);
    setError("");
  }

  function startEdit(note) {
    setForm({
      title: note.title,
      content: note.content,
      category: note.category,
    });
    setEditing(true);
    setShowEditor(true);
    setError("");
  }

  async function saveNote(event) {
    event.preventDefault();
    setError("");
    const endpoint = editing
      ? API_URL + "/notes/" + selectedId
      : API_URL + "/notes";

    try {
      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not save note.");
      }

      const saved = await response.json();
      setShowEditor(false);
      await loadNotes();
      setSelectedId(saved.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteNote() {
    if (!selected) return;

    try {
      const response = await fetch(API_URL + "/notes/" + selected.id, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete note.");
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Code2 size={20} /></div>
          <div>
            <h1>DevNotes</h1>
            <p>Keep your development knowledge organized.</p>
          </div>
        </div>
        <button className="primary-button" onClick={startCreate}>
          <Plus size={18} /> New Note
        </button>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes..."
            />
          </div>

          <div className="section-label">Categories</div>
          <nav className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "category active" : "category"}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <FileText size={15} />
            {notes.length} visible note{notes.length === 1 ? "" : "s"}
          </div>
        </aside>

        <section className="notes-list">
          <div className="list-heading">
            <div>
              <span className="eyebrow">Your workspace</span>
              <h2>Notes</h2>
            </div>
            <span className="count-pill">{notes.length}</span>
          </div>

          {loading ? (
            <div className="empty-state">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={22} /></div>
              <h3>No notes yet</h3>
              <p>Create your first developer note to get started.</p>
              <button className="secondary-button" onClick={startCreate}>
                <Plus size={16} /> Create note
              </button>
            </div>
          ) : (
            <div className="note-cards">
              {notes.map((note) => (
                <button
                  key={note.id}
                  className={selectedId === note.id ? "note-card selected" : "note-card"}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="card-top">
                    <span className="tag">{note.category}</span>
                    <span className="date">
                      {new Date(note.updated_at.replace(" ", "T") + "Z").toLocaleDateString()}
                    </span>
                  </div>
                  <h3>{note.title}</h3>
                  <p>{note.content.replace(/\s+/g, " ").slice(0, 96)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="note-view">
          {selected ? (
            <>
              <div className="view-header">
                <div>
                  <span className="tag">{selected.category}</span>
                  <h2>{selected.title}</h2>
                  <p className="updated">
                    Updated {new Date(selected.updated_at.replace(" ", "T") + "Z").toLocaleString()}
                  </p>
                </div>
                <div className="icon-actions">
                  <button title="Edit note" onClick={() => startEdit(selected)}>
                    <Edit3 size={17} />
                  </button>
                  <button title="Delete note" onClick={deleteNote}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <article className="content-card">{selected.content}</article>
            </>
          ) : (
            <div className="placeholder-view">
              <Code2 size={34} />
              <h3>Select a note</h3>
              <p>Choose a note from the list or create a new one.</p>
            </div>
          )}
        </section>
      </main>

      {showEditor && (
        <div className="modal-backdrop" onMouseDown={() => setShowEditor(false)}>
          <form
            className="editor-modal"
            onSubmit={saveNote}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">{editing ? "Edit" : "Create"}</span>
                <h2>{editing ? "Edit note" : "New note"}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowEditor(false)}
              >
                <X size={19} />
              </button>
            </div>

            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Python list comprehension"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categories.filter((item) => item !== "All").map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                required
                rows="11"
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                placeholder="Write your explanation, syntax, examples, or code snippet..."
              />
            </label>

            {error && <div className="error-banner">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEditor(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                {editing ? "Save changes" : "Save note"}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && !showEditor && <div className="toast-error">{error}</div>}
    </div>
  );
}
