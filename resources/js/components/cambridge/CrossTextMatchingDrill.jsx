import TextMatchingDrill from '@/components/cambridge/TextMatchingDrill';
import crossTextMatchingSets from '@/data/cambridge/c1/crossTextMatching.json';

export default function CrossTextMatchingDrill() {
    return (
        <TextMatchingDrill
            sets={crossTextMatchingSets}
            title="Cross-Text Multiple Matching — C1 Advanced"
            selectSubtitle="Choose a set to practice — Reading & Use of English, Part 6"
            selectIntro="Read all four texts, then answer each question by comparing opinions across them."
        />
    );
}
