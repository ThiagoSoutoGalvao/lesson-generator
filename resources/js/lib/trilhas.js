// Shared config for the Aurora trilha workflow — used by SavePanel, LibraryPage and the lesson packs.

// Each numbered unit is taught over three lessons, 1A / 1B / 1C (2026-10-18). An activity saved
// before the split has no part and counts as lesson A, so a finished course keeps everything where
// it was; B and C fill up when a teacher gets to them. Drop `parts` from a course to go back to one
// lesson per unit (the server-side list is SavedActivityController::PARTS).
const PARTS = ['A', 'B', 'C'];

export const TRILHAS = {
    Lights:  { label: 'LIGHTS',  lessons: 8,  parts: PARTS, accent: 'bg-sky-500/80'  },
    Glow:    { label: 'GLOW',    lessons: 8,  parts: PARTS, accent: 'bg-amber-500/80' },
    Radiant: { label: 'RADIANT', lessons: 12, parts: PARTS, accent: 'bg-rose-500/80'  },
    // Aurora Business (AuroraBusiness.md, 2026-11-10): three 6-month modules for small groups, 16 units each.
    // The four flex days per module (review days, final day) are not lessons here yet. Keep the keys in step
    // with App\Support\Trilhas::NAMES on the server.
    FirstSteps:       { label: 'FIRST STEPS',       lessons: 16, parts: PARTS, accent: 'bg-orange-600/80', program: 'business' },
    EverydayBusiness: { label: 'EVERYDAY BUSINESS', lessons: 16, parts: PARTS, accent: 'bg-orange-700/80', program: 'business' },
    TakeTheLead:      { label: 'TAKE THE LEAD',     lessons: 16, parts: PARTS, accent: 'bg-red-700/80',    program: 'business' },
};

export const TRILHA_NAMES = Object.keys(TRILHAS);

/** The lessons of one unit for a course: ['A', 'B', 'C'], or [] when it has one lesson per unit. */
export function trilhaParts(trilha) {
    return TRILHAS[trilha]?.parts ?? [];
}

/** Which lesson of its unit an activity is in — saved before the split (no part) means A. */
export function partOf(activity) {
    return activity.trilha_part ?? 'A';
}

// The level /generate pre-selects while a teacher is adding to a trilha lesson (see
// `lib/levels.js`). Lights is for real beginners (confirmed by its teachers); Glow and
// Radiant sit close to B1 and B2 (Thiago, 2026-09-21) — approximate, and the teacher
// can change the level for any single activity.
export const TRILHA_LEVEL = {
    Lights: 'A1', Glow: 'B1', Radiant: 'B2',
    FirstSteps: 'A2', EverydayBusiness: 'B1', TakeTheLead: 'B2',
};

// Verbatim table-of-contents per lesson, taken from the PDFs in `trilhas/`.
// Shown read-only in the Library coverage-grid brief panel so teachers don't
// have to open the PDF in another tab. Wording is unchanged from the source —
// only split into bullet items and OCR artefacts cleaned. Teachers still define
// target language / vocabulary / common errors themselves in the brief fields.
export const TRILHA_TOC = {
    Lights: {
        1: [
            'Personal pronouns (I and you)',
            'Verb to be (affirmative, negative and interrogative forms for I and you)',
            'Alphabet',
            'Numbers (age)',
            'Countries and nationalities',
            'Possessive adjectives (my and your)',
            'Favorite things',
            'Class instructions / important expressions (nothing crazy)',
        ],
        2: [
            'Personal info: email address, phone number, occupation (jobs)',
            'Personal pronouns 2 (he, she, it)',
            "Verb to be 2 ('is' in affirmative, negative and interrogative sentences)",
            'Possessive adjectives 2 (his, her, its)',
            'Essential interactions: "how are you?" + adjectives to express feelings regarding it',
            'Class instructions / important expressions (nothing crazy)',
        ],
        3: [
            'Base form of essential verbs related to everyday life (e.g. eat, work, live, study, watch, read, wear)',
            'Present continuous',
            'Depending on Ss questions, it might be necessary to talk about state verbs',
            'Clothes and accessories (nothing crazy!)',
        ],
        4: [
            'Verbs related to routine',
            'Days of the week',
            'Time',
            'Food and drinks',
            'Simple present (no 3rd person yet!)',
            'Adverbs and expressions of frequency',
        ],
        5: [
            'Simple present (focus on 3rd person)',
            'Object pronouns',
            'Adjectives of personality',
        ],
        6: [
            'Can (all forms)',
            'Vocabulary expansion regarding verbs',
            'Adverbs of manner (nothing crazy!)',
            'Rules and regulation',
        ],
        7: [
            'There be (all forms)',
            'Parts of a house',
            "Places in a city + prepositions of place related to them (e.g. there's a gym near my house; there are 2 supermarkets on my street)",
            'Describe what and where people are doing things (e.g. my sister is working out at the gym; my son is playing football at school; they are studying in the library)',
        ],
        8: [
            'Future time expressions',
            'Free time activities focusing on next weekend/holiday',
            'Be going to (all forms)',
            'Will (all forms)',
        ],
    },
    Glow: {
        1: [
            'To be in the past',
            'There be in the past',
            'Adjectives to describe places/events',
            'Dates & years / prepositions of time (in, on)',
        ],
        2: [
            'Past continuous',
            'Past time expressions',
            'Adverbs of manner',
        ],
        3: [
            'Simple past: regular and irregular',
        ],
        4: [
            'Simple past: negative and questions',
            'Sequencers and connectors (then, suddenly, when...)',
            'Prepositions of movement',
        ],
        5: [
            'Seasons and weather',
            'Animals',
            'Comparative sentences',
        ],
        6: [
            'Superlative adjectives',
            'Kitchen vocabulary',
        ],
        7: [
            'Modals of obligation/permission: can, have to, must, should',
            'Parts of the body',
        ],
        8: [
            'Passive voice: present',
            'Passive voice: past (spend some time working on participles)',
        ],
    },
    Radiant: {
        1: [
            'Present perfect (ever and never)',
        ],
        2: [
            'Present perfect (for and since) + yet / just / already — overview',
            'Simple present and simple past to make present perfect more "obvious" to students',
        ],
        3: [
            'The uses of -ing: gerund, present participle and verb patterns',
        ],
        4: [
            'Conditional sentences: zero, first and second',
        ],
        5: [
            'Word building: derivation (prefixes, suffixes and compound words)',
        ],
        6: [
            'Narrative tenses + adverbs of manner',
        ],
        7: [
            'Collocations: commonly confused verbs and verbs + prepositions',
        ],
        8: [
            'Reported speech',
        ],
        9: [
            'Indefinite pronouns (something, everywhere...) + another topic',
        ],
        10: [
            'Phrasal verbs (separable and non-separable) + include phrasal verbs in the other 2 levels',
        ],
        11: [
            'Minimal pairs (fonetics and spelling)',
        ],
        12: [
            'Project management: how to analyze material, gather information, make and deliver a presentation',
        ],
    },
    // Aurora Business — from the course plan doc (AuroraBusiness.md §1). First line = the unit and its goal.
    FirstSteps: {
        1:  ["Hello, I'm… — introduce myself, my job and my company", 'Language: be, possessive adjectives, a / an with jobs', 'Vocabulary: jobs, departments', 'Simulation: first day — meet the team'],
        2:  ['My team and my role — say who does what in my team and what I do', 'Language: present simple (he / she works…), there is / there are', 'Vocabulary: departments, tasks, responsibilities', 'Simulation: explain your team to a new colleague'],
        3:  ['My workday — describe my routine and schedule', 'Language: frequency adverbs, telling the time', 'Vocabulary: daily tasks, office routines', 'Simulation: compare schedules to find a free slot'],
        4:  ['Numbers, dates and contact details — give and check numbers, dates and email addresses', 'Language: numbers, dates, spelling aloud, Could you repeat that?', 'Vocabulary: @ / dot / dash / underscore, months', "Simulation: take down a client's contact details"],
        5:  ['Around the office — ask where things are and what people can do', "Language: prepositions of place, can / can't", 'Vocabulary: furniture, equipment, rooms', 'Simulation: help a new colleague find things'],
        6:  ['Arranging a meeting — suggest, accept and change a meeting time', 'Language: Are you free on…?, How about…?, days and times', 'Vocabulary: calendar words', 'Simulation: book a meeting with three busy colleagues'],
        7:  ['Simple emails — write a short email to ask or confirm something', "Language: greetings and sign-offs, I'd like to…, Could you…?", 'Vocabulary: email phrases', 'Simulation: reply to a meeting invitation'],
        8:  ['Calls and video calls — start, join and end a call, and take a simple message', "Language: Can you hear me?, Can I speak to…?, I'll call back", 'Vocabulary: mute, share my screen, connection, message', 'Simulation: a video call with small tech problems — then take a message'],
        9:  ['Last week at work — talk about what I did', 'Language: past simple (regular and irregular), time expressions', 'Vocabulary: work verbs', 'Simulation: Monday catch-up — what happened last week'],
        10: ['A short presentation — present my team or a task in three slides', 'Language: first / then / finally, This slide shows…, comparatives for simple numbers', 'Vocabulary: slide, chart, presentation phrases', 'Simulation: present your team in three slides'],
        11: ['Quick messages — write and answer short chat messages (Teams, WhatsApp)', 'Language: requests with can / could, short answers, imperatives', 'Vocabulary: chat words (ASAP, FYI, thanks), polite short forms', 'Simulation: a busy morning in the team chat'],
        12: ['Small talk at the office — chat at the coffee break about the weekend and free time', 'Language: How was your…?, past simple questions, would like for offers', 'Vocabulary: free time, weekend, food and drink', 'Simulation: coffee break with a new colleague'],
        13: ['Plans and next steps — talk about plans and arrangements', 'Language: going to, present continuous for future, will for offers', 'Vocabulary: project words', "Simulation: plan next month's team event"],
        14: ['Rules and tasks — explain what people must and should do', "Language: have to / don't have to, should", 'Vocabulary: company rules', 'Simulation: explain the rules to a new employee'],
        15: ['Small problems — report a problem and apologise', "Language: I'm sorry, but…, I'll… for promises", 'Vocabulary: late, broken, wrong, missing', 'Simulation: a client calls — the delivery is late'],
        16: ['My experience — talk about my experience in a short interview', 'Language: present perfect (intro), ever / never', 'Vocabulary: CV words, skills', 'Simulation: short job interview'],
    },
    EverydayBusiness: {
        1:  ['Networking and small talk — start, keep up and end a conversation with a new contact', 'Language: question forms, follow-up questions', 'Vocabulary: small-talk topics, safe and unsafe topics', 'Simulation: conference coffee break'],
        2:  ["My role and my company — describe my responsibilities and my company's structure", 'Language: present simple vs. continuous, be responsible for, report to', 'Vocabulary: roles, org chart', 'Simulation: introduce your team to a new partner'],
        3:  ['Email essentials — write a clear request and a polite follow-up', 'Language: indirect questions, I was wondering if…, formal vs. neutral register', 'Vocabulary: email structure, subject lines', "Simulation: chase a colleague who hasn't replied"],
        4:  ['Chat and messaging — write short, clear messages on Teams or Slack', 'Language: short forms, imperatives softened with please / could', 'Vocabulary: FYI, ASAP, EOD', 'Simulation: sort out a problem in a team chat'],
        5:  ['Video calls — start a call, ask for clarification and handle tech problems', 'Language: Sorry, you broke up, Could you repeat that?, Let me share my screen', 'Vocabulary: call vocabulary', 'Simulation: a weekly call where everything goes wrong'],
        6:  ['Phone calls — make and return calls and leave a voicemail', "Language: I'm calling about…, Could you ask her to…?", 'Vocabulary: phone phrases, spelling, numbers', 'Simulation: leave a voicemail, then return the call'],
        7:  ['Taking part in meetings — give updates and ask questions in a meeting', 'Language: present perfect for news, Just to add…', 'Vocabulary: agenda, action point, minutes', 'Simulation: a team meeting with an agenda'],
        8:  ['Opinions — agree and disagree politely', "Language: softening (I'm not sure that…, I see your point, but…)", 'Vocabulary: opinion phrases', 'Simulation: decide where to hold the team event'],
        9:  ['Presenting: structure — open, organise and close a short talk', 'Language: signposting (First…, Moving on to…, To sum up…)', 'Vocabulary: presentation phrases', 'Simulation: 3-minute talk about your own job'],
        10: ['Data and trends — describe graphs, numbers and changes', 'Language: rise / fall / remain, sharply / slightly, past simple', 'Vocabulary: trends, percentages', "Simulation: present last quarter's results"],
        11: ['Customers and complaints — handle a complaint and keep the customer', "Language: apologising, I'll make sure…, will for promises", 'Vocabulary: customer service', 'Simulation: an unhappy customer on the phone'],
        12: ['Problem solving — suggest and compare solutions', 'Language: What if we…?, We could…, first conditional', 'Vocabulary: problems and solutions', 'Simulation: fix a supply problem as a team'],
        13: ['Project updates — report progress and delays', 'Language: present perfect vs. past simple, already / yet / still', 'Vocabulary: milestone, on track, behind schedule', 'Simulation: weekly status meeting'],
        14: ['Deadlines and priorities — prioritise, delegate and say no politely', "Language: need to, I'm afraid I can't…, Could you take care of…?", 'Vocabulary: workload, priorities', 'Simulation: too much work — share the tasks'],
        15: ['Negotiation basics — make an offer, a counter-offer and a compromise', 'Language: first and second conditional, If you…, we could…', 'Vocabulary: price, terms, discount', 'Simulation: agree a price with a supplier'],
        16: ['Pulling it together — run a short project from start to finish', "Language: review of the module's language", 'Vocabulary: review', 'Simulation: kick-off meeting for a new project'],
    },
    TakeTheLead: {
        1:  ['Pitching an idea — pitch an idea in two minutes', 'Language: Imagine if…, What this means for you is…, rhetorical questions', 'Vocabulary: benefits, value, impact', 'Simulation: elevator pitch to a director'],
        2:  ['Persuasive presentations — build a talk that ends in a decision', 'Language: emphasis (What we really need is…), rule of three', 'Vocabulary: persuasion', 'Simulation: present a proposal and ask for approval'],
        3:  ['Tough questions — handle Q&A, including hostile or off-topic questions', "Language: That's a good question, buying time, deflecting politely", 'Vocabulary: Q&A phrases', 'Simulation: Q&A after a presentation'],
        4:  ['Chairing meetings — open, steer and close a meeting', "Language: Let's hear from…, Can we get back to…?", 'Vocabulary: chairing language', 'Simulation: chair a meeting that keeps going off topic'],
        5:  ['Decision-making — weigh options and reach a team decision', 'Language: second conditional, On the one hand…, modals of deduction', 'Vocabulary: pros and cons, risk', 'Simulation: choose a new office location'],
        6:  ['Negotiation strategy — prepare and run a negotiation', 'Language: conditionals, hedging (We might be able to…), bargaining phrases', 'Vocabulary: terms, concessions, BATNA', 'Simulation: renew a contract with a key client'],
        7:  ['Handling conflict — calm a conflict and find common ground', 'Language: diplomatic language, It seems to me that…, past modals', 'Vocabulary: conflict words', 'Simulation: two team members disagree on priorities'],
        8:  ['Feedback — give and receive feedback constructively', 'Language: softeners, It might be worth…, situation–behaviour–impact', 'Vocabulary: performance words', 'Simulation: a feedback conversation with a team member'],
        9:  ['Coaching and delegating — delegate a task and coach someone through it', 'Language: What would you do if…?, have / get something done', 'Vocabulary: management words', 'Simulation: hand over a project to a junior colleague'],
        10: ['Working across cultures — adapt my style to people from other cultures', 'Language: indirect vs. direct language, softening', 'Vocabulary: culture, etiquette', 'Simulation: a call with partners from two countries'],
        11: ['Writing reports — write a clear short report', 'Language: passive voice, however / therefore / as a result', 'Vocabulary: report structure', 'Simulation: write a one-page report on a project'],
        12: ['Writing proposals — write a persuasive proposal', 'Language: formal register, We propose that…, nominalisation', 'Vocabulary: proposal structure', 'Simulation: write and defend a proposal'],
        13: ['Career moves — do an interview and present myself on LinkedIn', 'Language: present perfect continuous, talking about achievements', 'Vocabulary: career, skills', 'Simulation: a competency-based interview'],
        14: ["Communicating change — announce a change and handle reactions", "Language: We're going to…, reassuring language, future continuous", 'Vocabulary: change management', 'Simulation: announce a reorganisation to the team'],
        15: ['Crisis communication — respond to a crisis clearly and calmly', 'Language: passive for neutral statements, third conditional', 'Vocabulary: PR, crisis', 'Simulation: a press or client statement after a problem'],
        16: ['Strategy — discuss strategy and long-term goals', 'Language: future perfect, By next year we will have…', 'Vocabulary: strategy, growth', "Simulation: plan the company's next year"],
    },
};

// Aurora teachers — used for the "Built by" field on a shared login.
export const TEACHERS = ['Fernando', 'Sapulha', 'Daniel', 'Hianna', 'Thiago'];

// Friendly activity-type labels (kept in sync with LibraryPage's own list).
export const TYPE_LABELS = {
    quiz:                     'Quiz',
    flashcards:               'Flashcards',
    unjumble:                 'Unjumble',
    dialog_gap_fill:          'Dialog',
    word_categorisation:      'Categorise',
    true_false:               'True / False',
    image_vocab_match:        'Image Match',
    word_formation:           'Word Formation',
    odd_one_out:              'Odd One Out',
    cloze:                    'Cloze',
    open_cloze:               'Open Cloze',
    mc_cloze:                 'MC Cloze',
    mc_reading:               'Reading (MC)',
    read_complete:            'Read & Complete',
    discussion_questions:     'Discussion',
    sentence_transformation:  'Transform',
    error_correction:         'Error Correction',
    match_pairs:              'Match Pairs',
    signs_notices:            'Signs & Notices',
    picture_prompts:          'Picture Prompts',
    role_play:                'Role-play',
    story_builder:            'Story Builder',
    debate:                   'Debate',
    mini_presentation:        'Mini Presentation',
    grammar_explainer:        'Grammar',
    presentation:             'Presentation',
    reading_text:             'Reading Text',
    essay_feedback:           'Essay Feedback',
};

// The five activities every lesson should have (see trilhas/README.md).
// Each slot lists the activity types that satisfy it.
export const LESSON_SLOTS = [
    { key: 'presentation', label: 'Presentation', types: ['presentation', 'grammar_explainer'] },
    { key: 'reading',      label: 'Reading Text', types: ['reading_text'] },
    { key: 'vocabulary',   label: 'Vocabulary',   types: ['flashcards', 'image_vocab_match', 'word_categorisation', 'match_pairs'] },
    { key: 'grammar',      label: 'Grammar',      types: ['quiz', 'sentence_transformation', 'error_correction', 'cloze', 'word_formation'] },
    { key: 'speaking',     label: 'Speaking',     types: ['discussion_questions', 'picture_prompts', 'role_play', 'story_builder', 'debate', 'mini_presentation'] },
];

// "LIGHTS L03 · Quiz · Present continuous & everyday verbs"; with a part, "RADIANT L01B · Cloze · …".
export function composeActivityName({ trilha, lesson, part, type, focus }) {
    const t = TRILHAS[trilha]?.label ?? (trilha ?? '').toUpperCase();
    const l = lesson ? `L${String(lesson).padStart(2, '0')}${part ?? ''}` : '';
    const typeLabel = TYPE_LABELS[type] ?? type;
    const f = (focus ?? '').trim();
    return [`${t} ${l}`.trim(), typeLabel, f].filter(Boolean).join(' · ');
}

// The Focus of a standard name ("RADIANT L01B · Cloze · Have you ever" → "Have you ever"); any other name comes back whole.
// A course label can be several words ("FIRST STEPS L01A · Quiz · …").
export function focusFromName(name) {
    return String(name ?? '').replace(/^[A-Z]+(?: [A-Z]+)* L\d{2}[A-Z]? · [^·]+ · /, '');
}
