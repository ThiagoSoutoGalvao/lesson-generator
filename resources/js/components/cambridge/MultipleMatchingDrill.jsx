import TextMatchingDrill from '@/components/cambridge/TextMatchingDrill';
import multipleMatchingSets from '@/data/cambridge/b2/multipleMatching.json';

export default function MultipleMatchingDrill() {
    return (
        <TextMatchingDrill
            sets={multipleMatchingSets}
            title="Multiple Matching — B2 First"
            selectSubtitle="Choose a set to practice — Reading & Use of English, Part 7"
            selectIntro="Read the short texts, then match each question to the text it belongs to."
        />
    );
}
