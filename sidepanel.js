document.addEventListener('DOMContentLoaded', () => {


    // Utility function to delay execution
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // DOM elements
    const notesContainer = document.getElementById('notesContainer');
    const addNoteBtn = document.getElementById('addNote');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const emptyState = document.getElementById('emptyState');

    // Toolbar buttons
    const addHeading1Btn = document.getElementById('addHeading1');
    const addHeading2Btn = document.getElementById('addHeading2');
    const addLinkBtn = document.getElementById('addLink');

    const addUnderlineBtn = document.getElementById('addUnderline');
    const addBoldBtn = document.getElementById('addBoldBtn'); 
    const addItalicBtn = document.getElementById('addItalicBtn');

    const linkModal = document.getElementById('linkModal');
    const linkUrlInput = document.getElementById('linkUrl');
    const linkTextInput = document.getElementById('linkText');
    const saveLinkBtn = document.getElementById('saveLinkBtn');
    const cancelLinkBtn = document.getElementById('cancelLinkBtn');
    const modalError = document.getElementById('modalError');

    // Initialize notes array
    let savedLinkRange = null; // To store the user's selection
    let notes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
    let currentSortBy = 'dateCreated';

    // Function to create a new note using the HTML template
   function createNote(noteData = {}) {
    const template = document.getElementById('note-template');
    if (!template) return null;

    const noteClone = template.content.cloneNode(true);
    
    const noteElement = noteClone.querySelector('.note');
    const noteContent = noteClone.querySelector('.note-content');
    const tagsInput = noteClone.querySelector('.tags-input');
    
    const color = noteData.color || 'yellow';

    noteElement.classList.add(color);
    noteElement.dataset.id = noteData.id || Date.now().toString();
     // Sanitize on render to prevent stored XSS from any pre-existing localStorage data
    noteContent.innerHTML = DOMPurify.sanitize(noteData.content || '', {
        ALLOWED_TAGS: ['h1', 'h2', 'b', 'i', 'u', 'a', 'img', 'div', 'br', 'p'],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt']
    });
    tagsInput.value = noteData.tags || '';

    const activeColorElement = noteElement.querySelector(`.color-option[data-color="${color}"]`);
    if (activeColorElement) {
        activeColorElement.classList.add('active');
    }
    
    return noteElement;
    }

    // Function to save notes to localStorage
    function saveNotes() {
        localStorage.setItem('stickyNotes', JSON.stringify(notes));
    }

    // Function to sort notes
    function sortNotes(notesToSort) {
        return [...notesToSort].sort((a, b) => {
            if (currentSortBy === 'dateCreated') {
                return new Date(b.dateCreated || b.id) - new Date(a.dateCreated || a.id);
            } else {
                return new Date(b.dateModified || b.dateCreated || b.id) - new Date(a.dateModified || a.dateCreated || a.id);
            }
        });
    }
    
    // Migrate existing notes to include dates
    function migrateNotes() {
        let migrated = false;
        notes = notes.map(note => {
            if (!note.dateCreated) {
                const date = new Date(parseInt(note.id) || Date.now()).toISOString();
                note.dateCreated = date;
                note.dateModified = date;
                migrated = true;
            }
            if (typeof note.tags === 'undefined') { 
                note.tags = '';
                migrated = true;
            }
            return note;
        });
        if (migrated) {
            saveNotes();
        }
    }

    // Function to render all notes
    function renderNotes(filteredNotes = null) {
        let notesToRender = filteredNotes || notes;
        notesToRender = sortNotes(notesToRender);

        if (notesToRender.length === 0) {
            emptyState.style.display = 'block';
            notesContainer.innerHTML = '';
            notesContainer.appendChild(emptyState);
            return;
        }

        emptyState.style.display = 'none';
        notesContainer.innerHTML = '';
        notesToRender.forEach(noteData => {
            const noteElement = createNote(noteData);
            notesContainer.appendChild(noteElement);
        });
    }

    // Function to add a new note
    function addNote() {
        const now = new Date().toISOString();
        const newNote = {
            id: Date.now().toString(),
            content: '',
            color: 'yellow',
            tags: '',
            dateCreated: now,
            dateModified: now
        };
        notes.push(newNote);
        saveNotes();
        renderNotes();

        // Focus on the new note
        const newNoteElement = document.querySelector(`[data-id="${newNote.id}"] .note-content`);
        if (newNoteElement) {
            newNoteElement.focus();
        }
    }
    
    // Helper: returns the currently active search-filtered notes list
    function getFilteredNotes() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) return notes;
        return notes.filter(note => {
            const contentMatch = note.content.toLowerCase().includes(query);
            const tagsMatch = note.tags && note.tags.toLowerCase().includes(query);
            return contentMatch || tagsMatch;
        });
    }

    // Function to update a note
    function updateNote(id, content) {
        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            // Sanitize while explicitly allowing <img> tags and their 'src' and 'alt' attributes
            const sanitizedContent = DOMPurify.sanitize(content, {
                ALLOWED_TAGS: ['h1', 'h2', 'b', 'i', 'u', 'a', 'img', 'div', 'br', 'p'],
                ALLOWED_ATTR: ['href', 'target', 'src', 'alt']
            });
            notes[noteIndex].content = sanitizedContent;
            notes[noteIndex].dateModified = new Date().toISOString();
            saveNotes();
            if (currentSortBy === 'dateModified') {
                renderNotes(getFilteredNotes());
            }
        }
    }

    const debouncedUpdateNote = debounce((id, content) => {
        updateNote(id, content);
    }, 500);

    // Function to change note color
    function changeNoteColor(id, color) {
        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            notes[noteIndex].color = color;
            notes[noteIndex].dateModified = new Date().toISOString();
            saveNotes();
            if (currentSortBy === 'dateModified') {
                renderNotes(getFilteredNotes());
            } else {
                // If not sorting by modified date, just update the color in the DOM directly for better performance.
                const noteElement = notesContainer.querySelector(`[data-id='${id}']`);
                if (noteElement) {
                    noteElement.className = 'note'; // Reset classes
                    noteElement.classList.add(color);
                    const activeColorElement = noteElement.querySelector(`.color-option.active`);
                    if(activeColorElement) activeColorElement.classList.remove('active');
                    noteElement.querySelector(`.color-option[data-color="${color}"]`).classList.add('active');
                }
            }
        }
    }

    // Function to update a note's tags
    function updateNoteTags(id, tags) {
        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
            notes[noteIndex].tags = tags;
            notes[noteIndex].dateModified = new Date().toISOString();
            saveNotes();
            if (currentSortBy === 'dateModified') {
                renderNotes(notes.filter(note => searchInput.value ? (note.content.toLowerCase().includes(searchInput.value.toLowerCase()) || (note.tags && note.tags.toLowerCase().includes(searchInput.value.toLowerCase()))) : true));
            }
        }
    }

    // Debounced version of the updateNoteTags function
    const debouncedUpdateNoteTags = debounce((id, tags) => {
        updateNoteTags(id, tags);
    }, 500);


    // Function to delete a note
    function deleteNote(id) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
    }

    // Formatting functions
    function formatSelection(tag) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        // Find the containing block element for the current selection
        let parentElement = selection.getRangeAt(0).commonAncestorContainer;
        if (parentElement.nodeType === Node.TEXT_NODE) {
            parentElement = parentElement.parentElement;
        }
        const existingHeader = parentElement.closest('h1, h2');

        // If the user clicks the button for a tag that is already active,
        // we will format it back to a regular 'div' (a normal paragraph).
        if (existingHeader && existingHeader.tagName.toLowerCase() === tag) {
            document.execCommand('formatBlock', false, 'div');
        } else {
            // Otherwise, apply the new header format.
            document.execCommand('formatBlock', false, `<${tag}>`);
        }

        // After the DOM is changed, we must save the note's new content
        const noteContent = selection.anchorNode.parentElement.closest('.note-content');
        if (noteContent) {
            const noteId = noteContent.closest('.note').dataset.id;
            updateNote(noteId, noteContent.innerHTML);
            // Immediately update the toolbar to reflect the change
            updateToolbarState();
        }
    }

    // --- Link Modal Logic ---
    function openLinkModal() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        savedLinkRange = selection.getRangeAt(0); // Save the selection
        const selectedText = savedLinkRange.toString();

        linkTextInput.value = selectedText;
        linkUrlInput.value = 'https://';
        modalError.textContent = ''; // Clear previous errors

        linkModal.classList.remove('hidden');
        linkUrlInput.focus();
    }

    function closeLinkModal() {
        linkModal.classList.add('hidden');
        savedLinkRange = null; // Clear saved selection
    }

    function handleSaveLink() {
        const url = linkUrlInput.value.trim();
        const text = linkTextInput.value.trim() || url; // Default to URL if text is empty

        // 1. Validation
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                modalError.textContent = 'Only http:// and https:// URLs are allowed.';
                return;
            }
            modalError.textContent = '';
        } catch (_) {
            modalError.textContent = 'Please enter a valid URL format.';
            return;
        }

        // 2. DOM Manipulation
        if (savedLinkRange) {
            const range = savedLinkRange;

            const link = document.createElement('a');
            link.href = url;
            link.textContent = text;
            link.target = '_blank';

            range.deleteContents();
            range.insertNode(link);

            // 3. Update data and close
            const noteContent = range.startContainer.parentElement.closest('.note-content');
            if (noteContent) {
                const noteId = noteContent.closest('.note').dataset.id;
                updateNote(noteId, noteContent.innerHTML);
            }

            closeLinkModal();
        }
    }


    

    // Function to apply simple styles like bold and italic
    function applyStyle(command) {
        document.execCommand(command, false, null);

        // Manually trigger an update to save the changes
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const noteContent = selection.anchorNode.parentElement.closest('.note-content');
            if (noteContent) {
                const noteId = noteContent.closest('.note').dataset.id;
                updateNote(noteId, noteContent.innerHTML);
            }
        }
    }

    function updateToolbarState() {
        const selection = window.getSelection();
        let noteContent = null;

        // 1. Explicitly check if the selection is inside a note's content area.
        if (selection.rangeCount > 0) {
            const parentElement = selection.anchorNode.parentElement;
            if (parentElement) {
                noteContent = parentElement.closest('.note-content');
            }
        }

        // 2. If the selection is NOT inside a note, deactivate all buttons and exit.
        if (!noteContent) {
            addHeading1Btn.classList.remove('active');
            addHeading2Btn.classList.remove('active');
            addBoldBtn.classList.remove('active');
            addItalicBtn.classList.remove('active');
            addLinkBtn.classList.remove('active');
            addUnderlineBtn.classList.remove('active');
            return;
        }

        // 3. If the selection is valid, check the state for each button.
        const parentTags = new Set();
        let currentNode = selection.anchorNode;
        while (currentNode && currentNode !== noteContent.parentElement) {
            if (currentNode.nodeName !== '#text') {
                parentTags.add(currentNode.nodeName.toUpperCase());
            }
            currentNode = currentNode.parentNode;
        }

        addHeading1Btn.classList.toggle('active', parentTags.has('H1'));
        addHeading2Btn.classList.toggle('active', parentTags.has('H2'));
        addBoldBtn.classList.toggle('active', document.queryCommandState('bold'));
        addItalicBtn.classList.toggle('active', document.queryCommandState('italic'));
        addLinkBtn.classList.toggle('active', parentTags.has('A'));
        // This line is now updated for better reliability
        addUnderlineBtn.classList.toggle('active', document.queryCommandState('underline'));
    }

    // Listen for selection changes to update the toolbar
    document.addEventListener('selectionchange', updateToolbarState);
    notesContainer.addEventListener('keyup', updateToolbarState);
  


    // Search notes
    function searchNotes(query) {
        renderNotes(query.trim() ? getFilteredNotes() : notes);
    }

    // Add new note
    addNoteBtn.addEventListener('click', () => {
        addNote();
    });

    // Toolbar events
    addHeading1Btn.addEventListener('mousedown', (e) => { e.preventDefault(); formatSelection('h1'); });
    addHeading2Btn.addEventListener('mousedown', (e) => { e.preventDefault(); formatSelection('h2'); });
    addBoldBtn.addEventListener('mousedown', (e) => { e.preventDefault(); applyStyle('bold'); });
    addItalicBtn.addEventListener('mousedown', (e) => { e.preventDefault(); applyStyle('italic'); });
    addUnderlineBtn.addEventListener('mousedown', (e) => { e.preventDefault(); applyStyle('underline'); });

    addLinkBtn.addEventListener('mousedown', (e) => {
        // This prevents the button from stealing focus from the note editor
        e.preventDefault();
        openLinkModal();
    });

    // Link Modal Event Listeners
    cancelLinkBtn.addEventListener('click', closeLinkModal);
    saveLinkBtn.addEventListener('click', handleSaveLink);
    linkUrlInput.addEventListener('input', () => {
        // Clear error message as user types
        if (modalError.textContent) {
            modalError.textContent = '';
        }
    });
  
    

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        searchNotes(e.target.value);
    });

    // Sort functionality
    sortSelect.addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        renderNotes();
    });

    // --- Consolidated Click Handler for Notes ---
    notesContainer.addEventListener('click', (e) => {
        // 1. Handle link clicks FIRST.
        const link = e.target.closest('a');
        if (link && link.href) {
            e.preventDefault();
            window.open(link.href, '_blank');
            return;
        }

        // Always run updateToolbarState on any click.
        updateToolbarState();

        // Find the parent note, if the click happened within one.
        const noteElement = e.target.closest('.note'); // CORRECTED: from e.g to e.target
        if (!noteElement) {
            return;
        }
        
        const noteId = noteElement.dataset.id;

        // Logic for changing the note's color
        if (e.target.classList.contains('color-option')) {
            const color = e.target.dataset.color; 
            changeNoteColor(noteId, color);
            return; 
        }

        // Logic for deleting the note
        // Use closest() so clicks on the SVG child element inside the button are also caught
        if (e.target.closest('.delete-btn')) {
            deleteNote(noteId);
            return;
        }
    });
     
    notesContainer.addEventListener('input', (e) => {
        const noteElement = e.target.closest('.note');
        if (!noteElement) return;
        const noteId = noteElement.dataset.id;

        // Check if the user is typing in the main content area
        if (e.target.classList.contains('note-content')) {
            debouncedUpdateNote(noteId, e.target.innerHTML);
        
        // Check if the user is typing in the tags input
        } else if (e.target.classList.contains('tags-input')) {
            debouncedUpdateNoteTags(noteId, e.target.value);
        }
    });

    

    // Initialize
    migrateNotes();
    renderNotes();

});