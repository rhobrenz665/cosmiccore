// Common question words carry little evidence that a passage answers the question.
const questionWords = new Set(
  "a an and are as at be by can could did do does for from how i in is it me my of on or our should that the their these this to was we were what when where which who why will with would".split(" "),
);

function terms(text: string) {
  return text.normalize("NFKC").toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
}

/** Return an exact excerpt of the saved Markdown. Ties favor the earliest passage. */
export function selectNotePassage(body: string, question: string): string | null {
  const wanted = new Set(terms(question).filter(term => !questionWords.has(term)));
  if (!wanted.size) return null;

  let best: string | null = null;
  let bestScore = 0;
  for (const paragraph of body.split(/\r?\n[ \t]*\r?\n/)) {
    const characters = Array.from(paragraph.trim());
    for (let start = 0; start < characters.length; start += 450) {
      const excerpt = characters.slice(start, start + 600).join("");
      const matched = new Set(terms(excerpt).filter(term => wanted.has(term)));
      if (matched.size > bestScore) {
        best = excerpt;
        bestScore = matched.size;
        if (bestScore === wanted.size) return best;
      }
      if (start + 600 >= characters.length) break;
    }
  }
  return best;
}
