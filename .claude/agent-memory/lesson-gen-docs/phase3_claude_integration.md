---
name: Phase 3 Claude API Integration Architecture
description: How ClaudeService, ActivityController, and GeneratePage work together to send prompts to Claude
type: project
---

## Phase 3 Architecture: Claude API Integration

**Overview:** Phase 3 adds a complete flow for sending document text + teacher prompts to the Claude API and displaying raw responses.

**Key components:**

1. **ClaudeService** (`app/Services/ClaudeService.php`)
   - Stateless service class that wraps the Anthropic Claude API
   - Single method: `generate($documentText, $prompt): string`
   - Authenticates using `ANTHROPIC_API_KEY` from `.env`
   - Uses model `claude-sonnet-4-6` with max 2048 tokens
   - Throws `RuntimeException` if API fails
   - Returns raw text response (not parsed JSON yet)

2. **ActivityController** (`app/Http/Controllers/ActivityController.php`)
   - Single method: `generate(Request $request, ClaudeService $claude)`
   - Validates `document_id` (must exist) and `prompt` (max 1000 chars)
   - Fetches document from DB and calls `ClaudeService::generate()`
   - Returns response as JSON: `{ "response": "..." }`
   - Dependency injection pattern: Laravel auto-injects ClaudeService

3. **GeneratePage** (`resources/js/pages/GeneratePage.jsx`)
   - React functional component with extensive state management
   - Fetches documents list on mount via `GET /api/documents`
   - Form with document selector dropdown and prompt textarea
   - On submit: calls `POST /api/generate` via axios
   - Displays raw Claude response in scrollable code block
   - Error handling with user-facing error messages
   - Loading state disables button and shows "Generating..."

4. **API Route** (`routes/api.php`)
   - New: `POST /api/generate` → `ActivityController@generate`
   - Stateless request/response pattern

**Data flow:**
1. Teacher loads GeneratePage → fetches documents list
2. Teacher selects document + types prompt → form submit
3. GeneratePage POST to `/api/generate` with document_id + prompt
4. ActivityController validates, fetches Document, calls ClaudeService
5. ClaudeService makes HTTPS POST to Claude API
6. Claude returns text response
7. ActivityController wraps in JSON, returns 200 OK
8. GeneratePage displays raw response in `<pre>` block

**Important notes:**
- Phase 3 displays raw Claude output (unstructured text or JSON)
- No parsing or activity type detection yet (coming Phase 4+)
- Validation at controller level (document must exist, prompt max 1000 chars)
- No authentication yet (all routes public)
- Error propagation: ClaudeService RuntimeException bubbles to Laravel error handler → 500 response

**Reusable patterns:**
- Service class pattern for external API calls
- Dependency injection in controllers
- State machine in React (idle/loading/success/error)
- Axios for backend calls with error handling
