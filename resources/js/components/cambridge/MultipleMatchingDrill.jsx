import TextMatchingDrill from '@/components/cambridge/TextMatchingDrill';
import b2Sets from '@/data/cambridge/b2/multipleMatching.json';
import a2Sets from '@/data/cambridge/a2/multipleMatching.json';
import { CAMBRIDGE_LEVEL_LABEL, partHint } from '@/lib/cambridgeLevels';

export default function MultipleMatchingDrill({ level = 'b2' }) {
    return (
        <TextMatchingDrill
            sets={level === 'a2' ? a2Sets : b2Sets}
            title={`Multiple Matching — ${CAMBRIDGE_LEVEL_LABEL[level]}`}
            selectSubtitle={`Choose a set to practice — ${partHint(level, 7)}`}
            selectIntro="Read the short texts, then match each question to the text it belongs to."
        />
    );
}
