const latinPrefixPattern = /^[A-Za-z]/u;

const koreanTextCollator = new Intl.Collator("ko-KR", {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
});

export function compareEnglishFirst(a: string, b: string): number {
  const aStartsWithEnglish = latinPrefixPattern.test(a.trim());
  const bStartsWithEnglish = latinPrefixPattern.test(b.trim());

  if (aStartsWithEnglish !== bStartsWithEnglish) {
    return aStartsWithEnglish ? -1 : 1;
  }

  return koreanTextCollator.compare(a, b);
}
