# EXAMYWEB — Modular Tracker Structure

The tracker is now split feature-by-feature so you can edit one feature without touching the others.

## Structure
- `tracker.html` + `script.js` + `style.css` / `tracker.css` — main tracker
- `features/menu.html` + `menu.css` — feature menu
- `features/syllabus.html` + `syllabus.css` + `syllabus.js`
- `features/pyq.html` + `pyq.css` + `pyq.js`
- `features/tests.html` + `tests.css` + `tests.js`
- `features/todo.html` + `todo.css` + `todo.js`
- `features/focus.html` + `focus.css` + `focus.js`
- `features/weekly.html` + `weekly.css` + `weekly.js`
- `features/backup.html` + `backup.css` + `backup.js`
- `features/themes.html` + `themes.css` + `themes.js`
- `features/common.css` / `common.js` — only shared helpers

## Important
All feature data still uses the same browser `localStorage` keys, so existing saved Syllabus/PYQ/Test/TODO/Focus data is preserved.

The Weekly Report reads the main tracker data directly from `jee370rTrackerV3`, so it no longer needs the main tracker page to be open.

Each feature has its own CSS and JS. For example, to redesign PYQ only, edit:
`features/pyq.html`, `features/pyq.css`, and `features/pyq.js`.
