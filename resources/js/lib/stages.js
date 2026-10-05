// The four stages of an Aurora Lessons lesson pack (Phase 1, 2026-10-04): Warmer → Presentation →
// Practice → Production. Each saved activity carries one (`activities.stage`); NULL = not tagged yet.
// The backend validates against the same keys (`SavedActivityController::STAGES`) — keep them in step.

export const STAGES = [
    { key: 'warmer',       label: 'Warmer',       hint: 'Gets the student talking; brings up the topic' },
    { key: 'presentation', label: 'Presentation', hint: 'The core material: a presentation or a reading' },
    { key: 'practice',     label: 'Practice',     hint: 'Controlled work on the target language' },
    { key: 'production',   label: 'Production',   hint: 'The student uses the language freely' },
];

export const STAGE_LABELS = Object.fromEntries(STAGES.map(s => [s.key, s.label]));

// The stage a type usually belongs to — only a starting point the teacher confirms or changes.
// Discussion Questions and Picture Prompts can be warmers too; that depends on what they ask,
// so they default to production and the teacher switches them. No type defaults to warmer.
const DEFAULT_STAGE_BY_TYPE = {
    presentation:            'presentation',
    grammar_explainer:       'presentation',
    reading_text:            'presentation',
    discussion_questions:    'production',
    picture_prompts:         'production',
    role_play:               'production',
    story_builder:           'production',
    debate:                  'production',
    mini_presentation:       'production',
};

export function defaultStage(type) {
    return DEFAULT_STAGE_BY_TYPE[type] ?? 'practice';
}
