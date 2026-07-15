// ==================== FURIGANA FUNCTIONS ====================

// Fixed: Better furigana parsing - no suffix splitting (was causing duplication bugs)
function splitIntoWordsWithFurigana(jpText) {
  let segments = jpText.split(/\s+/);
  const result = [];
  
  for (let seg of segments) {
    let cleanWord = seg.replace(/（[^）]+）/g, '');
    // Keep the original segment as-is, no splitting
    result.push({ original: seg, clean: cleanWord });
  }
  return result;
}

function getMeaningForWord(cleanWord) {
  if (wordDict[cleanWord]) return wordDict[cleanWord].meaning;
  if (cleanWord.endsWith("ます")) {
    let stem = cleanWord.slice(0, -2);
    if (wordDict[stem]) return wordDict[stem].meaning;
    stem = cleanWord.slice(0, -3);
    if (wordDict[stem]) return wordDict[stem].meaning;
  }
  if (cleanWord.endsWith("た")) {
    let stem = cleanWord.slice(0, -1);
    if (wordDict[stem]) return wordDict[stem].meaning;
  }
  if (cleanWord.endsWith("て")) {
    let stem = cleanWord.slice(0, -1);
    if (wordDict[stem]) return wordDict[stem].meaning;
  }
  return "?";
}

function injectWordMeanings() {
  for (let i = 0; i < sentencesData.length; i++) {
    const s = sentencesData[i];
    const words = splitIntoWordsWithFurigana(s.jp);
    const meanings = [];
    for (let w of words) meanings.push(getMeaningForWord(w.clean));
    s.wordMeanings = meanings;
    s.splitWords = words;
  }
}

// ============================================================
// FIXED: Build Ruby HTML using match collection + end-to-start replacement
// Example: 好（す）き → <ruby>好<rt>す</rt></ruby>き
// ============================================================
function buildRubyHTML(text) {
  if (!text) return text;
  
  // Pattern: kanji + (furigana) + optional trailing kana
  const pattern = /([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）([\u3040-\u30FF]*)/g;
  
  // Collect all matches with their positions
  let matches = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      kanji: match[1],
      furigana: match[2],
      trailing: match[3] || '',
      index: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  // If no matches, return original text
  if (matches.length === 0) return text;
  
  // Sort matches by index (reverse to replace from end to start)
  matches.sort((a, b) => b.index - a.index);
  
  // Replace from end to start to avoid position shifts
  let result = text;
  for (const match of matches) {
    const before = result.substring(0, match.index);
    const after = result.substring(match.endIndex);
    const replacement = `<ruby>${match.kanji}<rt>${match.furigana}</rt></ruby>${match.trailing}`;
    result = before + replacement + after;
  }
  
  return result;
}

function wrapWordsWithTooltips(sentence) {
  const words = sentence.splitWords;
  const meanings = sentence.wordMeanings;
  let result = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const meaning = meanings[i];
    if (word.original.includes('（')) {
      const rubyHtml = buildRubyHTML(word.original);
      result += `<span class="word-tooltip">${rubyHtml}<span class="tooltip-text">${meaning}</span></span>`;
    } else {
      result += `<span class="word-tooltip">${word.original}<span class="tooltip-text">${meaning}</span></span>`;
    }
    if (i < words.length - 1) result += ' ';
  }
  return result;
}