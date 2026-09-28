const STORAGE_KEY = "notes";

const addButton = document.getElementById("add");
const notesGrid = document.getElementById("notes");
const searchBox = document.getElementById("search");
const emptyState = document.getElementById("empty");

// ---------------------------------------------------
// local storage
// ---------------------------------------------------

const loadNotes = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    // older version saved plain strings, convert them to note objects
    return saved.map((note, i) =>
      typeof note === "string"
        ? { id: Date.now() + i, text: note, updated: Date.now() }
        : note
    );
  } catch (error) {
    return [];
  }
};

let notes = loadNotes();

const saveNotes = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

// ---------------------------------------------------
// helpers
// ---------------------------------------------------

const formatDate = (time) =>
  new Date(time).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const autoResize = (textArea) => {
  textArea.style.height = "auto";
  textArea.style.height = textArea.scrollHeight + "px";
};

// shows a message when there are no notes or no search results
const updateEmptyState = () => {
  const visible = notesGrid.querySelectorAll(".note:not(.filtered):not(.removing)");
  if (notes.length === 0) {
    emptyState.textContent = 'No notes yet. Click "Create Note" to add one.';
    emptyState.hidden = false;
  } else if (visible.length === 0) {
    emptyState.textContent = "No notes match your search.";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
};

// ---------------------------------------------------
// create one note card
// ---------------------------------------------------

const createNoteElement = (note, startEditing = false) => {
  const noteEl = document.createElement("article");
  noteEl.className = "note";

  noteEl.innerHTML = `
    <div class="tools">
      <span class="date"></span>
      <button class="edit" type="button" title="Edit (Esc or Ctrl+Enter to finish)">
        <i class="fas fa-edit"></i>
      </button>
      <button class="delete" type="button" title="Delete">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
    <div class="main" title="Click to edit"></div>
    <textarea placeholder="Write your note..."></textarea>`;

  // getting the references
  const editButton = noteEl.querySelector(".edit");
  const delButton = noteEl.querySelector(".delete");
  const mainDiv = noteEl.querySelector(".main");
  const textArea = noteEl.querySelector("textarea");
  const dateEl = noteEl.querySelector(".date");

  // textContent (not innerHTML) so typed HTML is shown as text, not run
  mainDiv.textContent = note.text;
  textArea.value = note.text;
  dateEl.textContent = formatDate(note.updated);

  const setEditing = (isEditing) => {
    noteEl.classList.toggle("editing", isEditing);
    editButton.innerHTML = isEditing
      ? '<i class="fas fa-check"></i>'
      : '<i class="fas fa-edit"></i>';
    if (isEditing) {
      autoResize(textArea);
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    }
  };

  // toggle using edit button, or click on the note text
  editButton.addEventListener("click", () =>
    setEditing(!noteEl.classList.contains("editing"))
  );
  mainDiv.addEventListener("click", () => setEditing(true));

  // save while typing
  textArea.addEventListener("input", () => {
    note.text = textArea.value;
    note.updated = Date.now();
    mainDiv.textContent = note.text;
    dateEl.textContent = formatDate(note.updated);
    autoResize(textArea);
    saveNotes();
  });

  // Esc or Ctrl+Enter finishes editing
  textArea.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
      setEditing(false);
    }
  });

  // deleting the note with an exit animation
  delButton.addEventListener("click", () => {
    notes = notes.filter((n) => n.id !== note.id);
    saveNotes();
    noteEl.classList.add("removing");
    noteEl.addEventListener("animationend", () => noteEl.remove(), { once: true });
    updateEmptyState();
  });

  noteEl.noteData = note;
  if (startEditing) {
    // wait until the card is on the page before focusing
    requestAnimationFrame(() => setEditing(true));
  }
  return noteEl;
};

// ---------------------------------------------------
// add, search and first render
// ---------------------------------------------------

addButton.addEventListener("click", () => {
  const note = { id: Date.now(), text: "", updated: Date.now() };
  notes.unshift(note);
  saveNotes();

  // clear the search so the new note is visible
  if (searchBox.value) {
    searchBox.value = "";
    filterNotes();
  }

  notesGrid.prepend(createNoteElement(note, true));
  updateEmptyState();
});

const filterNotes = () => {
  const query = searchBox.value.trim().toLowerCase();
  notesGrid.querySelectorAll(".note").forEach((noteEl) => {
    const match = noteEl.noteData.text.toLowerCase().includes(query);
    noteEl.classList.toggle("filtered", !match);
  });
  updateEmptyState();
};

searchBox.addEventListener("input", filterNotes);

notes.forEach((note) => notesGrid.appendChild(createNoteElement(note)));
updateEmptyState();
