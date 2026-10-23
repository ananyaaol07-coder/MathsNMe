(() => {
  const NORMAL_SPACE = /\s+/g;
  let timer;

  const clean = value => String(value || "").replace(NORMAL_SPACE, " ").trim();
  const number = value => {
    const match = clean(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };
  const text = () => clean(document.body?.innerText);
  const pick = (body, expressions) => {
    for (const expression of expressions) {
      const match = body.match(expression);
      if (match) return number(match[1]);
    }
    return null;
  };

  function parseQuestions() {
    const cards = [...document.querySelectorAll('[data-testid*="question"], [class*="question-card"], [class*="questionCard"]')];
    return cards.slice(0, 100).map((card, index) => {
      const body = clean(card.innerText);
      const answerParts = body.split(/(?:Your answer|Correct answer)/i);
      const prompt = clean(card.querySelector("h1,h2,h3,[class*='question-text'],[class*='prompt']")?.textContent || answerParts[0]);
      const yourMatch = body.match(/Your answer\s*[:\-]?\s*(.+?)(?=Correct answer|$)/i);
      const correctMatch = body.match(/Correct answer\s*[:\-]?\s*(.+?)(?=\bTime\b|$)/i);
      const time = pick(body, [/(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)\b/i]);
      const studentAnswer = clean(yourMatch?.[1] || "Not available").slice(0, 300);
      const correctAnswer = clean(correctMatch?.[1] || "Not available").slice(0, 300);
      return { number: index + 1, prompt: prompt.slice(0, 500), studentAnswer, correctAnswer, correct: /correct|✓|✔/i.test(body) || (studentAnswer !== "Not available" && studentAnswer === correctAnswer), timeSeconds: time };
    }).filter(question => question.prompt);
  }

  function capture() {
    const body = text();
    if (body.length < 80 || !/(accuracy|correct answers?|score|performance)/i.test(body) || !/(completed|summary|result|accuracy)/i.test(body)) return;
    const percentage = pick(body, [/(\d{1,3}(?:\.\d+)?)\s*%\s*(?:accuracy|correct)?/i, /accuracy\s*[:\-]?\s*(\d{1,3}(?:\.\d+)?)\s*%/i]);
    const fraction = body.match(/(\d+)\s*\/\s*(\d+)\s*(?:correct|questions?)?/i);
    const correct = pick(body, [/(\d+)\s*(?:correct answers?|correct)\b/i]) ?? (fraction ? Number(fraction[1]) : null);
    const total = fraction ? Number(fraction[2]) : pick(body, [/(?:out of|total(?: questions?)?)\s*[:\-]?\s*(\d+)/i]);
    if (percentage === null || correct === null || total === null || total < 1) return;
    const capturedAt = Date.now();
    const quizTitle = clean(document.querySelector("h1")?.textContent || document.title.replace(/\s*[|–-].*$/, "") || "Wayground assessment");
    const result = {
      source: "wayground-extension",
      quizTitle: quizTitle.slice(0, 180),
      capturedAt,
      accuracy: Math.max(0, Math.min(100, Math.round(percentage))),
      score: pick(body, [/(?:wayground\s*)?score\s*[:\-]?\s*([\d,]+)/i]),
      correct: Math.round(correct),
      incorrect: Math.max(0, Math.round(total - correct)),
      total: Math.round(total),
      averageSeconds: pick(body, [/(?:average(?: speed| time)?|avg)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)/i]),
      bestStreak: pick(body, [/(?:best\s*)?streak\s*[:\-]?\s*(\d+)/i]),
      questions: parseQuestions(),
      sourceUrl: location.href,
    };
    const fingerprint = `${result.quizTitle}|${result.accuracy}|${result.correct}|${result.total}|${location.pathname}`;
    if (sessionStorage.getItem("mathsnme-wayground-capture") === fingerprint) return;
    sessionStorage.setItem("mathsnme-wayground-capture", fingerprint);
    chrome.runtime.sendMessage({ type: "WAYGROUND_RESULT", result });
  }

  function schedule() { clearTimeout(timer); timer = setTimeout(capture, 1200); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("load", schedule);
  schedule();
})();
