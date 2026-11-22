const { generateJson } = require("./gemini");
const { httpError } = require("./extractText");

const QUIZ_QUESTIONS = 8;

const header = (note) =>
    `Note title: ${note.title}\nSubject: ${note.subject}\nBranch: ${note.branch}\nSemester: ${note.semester}`;

const buildInput = (note, content, instructions) => {
    if(content.inline) {
        return {
            prompt: `${instructions}\n\n${header(note)}\n\nThe notes are in the attached file.`,
            inline: content.inline,
        };
    }
    return {
        prompt: `${instructions}\n\n${header(note)}\n\nNOTES:\n"""\n${content.text}\n"""`,
    };
};

const str = (v, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const shuffle = (arr) => {
    const a = [...arr];
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ---------- Summary ----------
const makeSummary = async (note, content) => {
    const instructions = `You are a study assistant for college students.
Read the notes and return ONLY a JSON object with this exact shape:
{
  "summary": "a clear paragraph of at most 120 words",
  "keyPoints": ["5 to 8 short bullet points, each under 25 words"],
  "keyTerms": [{ "term": "important term", "meaning": "one-line meaning" }]
}
Rules: use only information found in the notes, do not invent facts, include at most 6 key terms,
and write in simple English. If the notes are empty or unreadable, return empty values.`;

    const raw = await generateJson(buildInput(note, content, instructions));

    const summary = str(raw.summary, 1200);
    const keyPoints = (Array.isArray(raw.keyPoints) ? raw.keyPoints : [])
        .map((p) => str(p, 250))
        .filter(Boolean)
        .slice(0, 10);
    const keyTerms = (Array.isArray(raw.keyTerms) ? raw.keyTerms : [])
        .map((t) => ({ term: str(t?.term, 80), meaning: str(t?.meaning, 250) }))
        .filter((t) => t.term && t.meaning)
        .slice(0, 6);

    if(!summary && keyPoints.length === 0) {
        throw httpError(422, "The AI could not find readable study content in this note");
    }

    return { summary, keyPoints, keyTerms };
};

// ---------- Quiz ----------
const makeQuiz = async (note, content) => {
    const instructions = `You are a study assistant for college students.
Create a multiple-choice quiz from the notes and return ONLY a JSON object with this exact shape:
{
  "questions": [
    {
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "answerIndex": 0,
      "explanation": "one sentence explaining why the answer is correct"
    }
  ]
}
Rules: write exactly ${QUIZ_QUESTIONS} questions, each with exactly 4 options and exactly one correct option,
"answerIndex" is the 0-based index of the correct option, mix easy and harder questions,
use only information found in the notes, and avoid options like "all of the above".`;

    const raw = await generateJson(buildInput(note, content, instructions));

    const questions = [];
    for(const q of Array.isArray(raw.questions) ? raw.questions : []) {
        const question = str(q?.question, 400);
        const options = (Array.isArray(q?.options) ? q.options : []).map((o) => str(o, 200));
        const idx = Number.isInteger(q?.answerIndex) ? q.answerIndex : -1;

        if(!question || options.length < 2 || options.some((o) => !o) || idx < 0 || idx >= options.length) {
            continue;
        }

        // AI models tend to favour one position for the right answer, so shuffle
        const tagged = shuffle(options.map((text, i) => ({ text, correct: i === idx })));
        questions.push({
            question,
            options: tagged.map((o) => o.text),
            answerIndex: tagged.findIndex((o) => o.correct),
            explanation: str(q?.explanation, 400),
        });
    }

    if(questions.length < 3) {
        throw httpError(422, "The AI could not make a quiz from this note. Try a note with more text");
    }

    return { questions: questions.slice(0, 10) };
};

module.exports = { makeSummary, makeQuiz };
