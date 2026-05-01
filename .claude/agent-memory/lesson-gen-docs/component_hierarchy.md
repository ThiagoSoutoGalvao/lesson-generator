---
name: React Component Hierarchy
description: Structure of React components across the app; parent-child relationships
type: project
---

## React Component Structure (as of Phase 2)

### Page Components (in `resources/js/pages/`)

- **UploadPage.jsx** — Full-screen upload interface. Teacher's entry point for Phase 2.
  - Manages its own state (dragging, status, result, errorMsg, inputRef)
  - Calls `POST /api/documents` via axios
  - No child components (all UI inline)

### Layout & Structure (from Phase 1)

- **App.jsx** — Root component (entry point)
  - Includes Layout component
  - Likely handles page routing (React Router)

- **Layout.jsx** — Header/footer wrapper, reused across pages

### Component File Locations

- Page components: `resources/js/pages/`
- Reusable components: `resources/js/components/` (to be created)
- Layout: `resources/js/components/Layout.jsx`

### Future Components (Phases 3–8)

Phase 3 will add:
- ActivityGenerator page — form for teacher to type prompt

Phase 4 will add:
- QuizComponent — interactive quiz display

Phase 5:
- FlashcardComponent

Phase 6:
- UnjumbleComponent

Phase 7:
- ActivityLibrary page — list saved activities

Phase 8:
- PresentationMode component — fullscreen view

### Notes

- No custom hooks defined yet (Phase 3+ will add)
- Using Shadcn/ui for buttons, forms, etc. (TBD which components used in Phase 2)
- Tailwind classes used inline for styling
