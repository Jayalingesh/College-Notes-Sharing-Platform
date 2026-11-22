import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

export default function AiStudyTools({ noteId, ownerId }) {
    const { user } = useAuth();
    const [tab, setTab] = useState("summary");
    const [summary, setSummary] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [busy, setBusy] = useState({ summary: false, quiz: false });
    const [error, setError] = useState("");
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    // /auth/login returns `id`, /auth/me returns `_id`
    const myId = user ? String(user.id || user._id) : null;
    const canRegenerate = !!user && (user.role === "admin" || (ownerId && String(ownerId) === myId));

    useEffect(() => {
        let cancelled = false;
        api.get(`/notes/${noteId}/ai`)
            .then((res) => {
                if(cancelled) return;
                setSummary(res.data.summary);
                setQuiz(res.data.quiz);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [noteId]);

    const generate = async (kind, refresh = false) => {
        setError("");
        setBusy((b) => ({ ...b, [kind]: true }));
        try {
            const res = await api.post(`/notes/${noteId}/ai/${kind}`, { refresh });
            if(kind === "summary") setSummary(res.data.summary);
            else {
                setQuiz(res.data.quiz);
                setAnswers({});
                setSubmitted(false);
            }
        } catch(err) {
            setError(err.response?.data?.message || "Could not generate. Please try again");
        } finally {
            setBusy((b) => ({ ...b, [kind]: false }));
        }
    };

    const questions = quiz?.questions || [];
    const score = questions.filter((q, i) => answers[i] === q.answerIndex).length;
    const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

    const renderGenerate = (kind, label, hint) => (
        <div className="ai-empty">
            <p>{hint}</p>
            {user ? (
                <button className="btn btn-primary btn-sm" onClick={() => generate(kind)} disabled={busy[kind]}>
                    {busy[kind] ? "Generating... (up to 30 seconds)" : label}
                </button>
            ) : (
                <Link to="/login" className="btn btn-sm btn-ghost">
                    Log in to generate
                </Link>
            )}
        </div>
    );

    return (
        <div className="ai-panel">
            <div className="ai-panel-head">
                <h3>AI study tools</h3>
                <span className="req-badge">Beta</span>
            </div>

            <div className="staff-tabs" style={{ marginTop: 6 }}>
                <button
                    className={`staff-tab ${tab === "summary" ? "active" : ""}`}
                    onClick={() => setTab("summary")}
                >
                    Summary
                </button>
                <button className={`staff-tab ${tab === "quiz" ? "active" : ""}`} onClick={() => setTab("quiz")}>
                    Quiz
                </button>
            </div>

            {error && <div className="form-error">{error}</div>}

            {tab === "summary" &&
                (summary ? (
                    <div>
                        {summary.summary && <p className="ai-summary">{summary.summary}</p>}

                        {summary.keyPoints?.length > 0 && (
                            <>
                                <h4>Key points</h4>
                                <ul className="ai-list">
                                    {summary.keyPoints.map((p, i) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {summary.keyTerms?.length > 0 && (
                            <>
                                <h4>Key terms</h4>
                                <dl className="ai-terms">
                                    {summary.keyTerms.map((t, i) => (
                                        <div key={i}>
                                            <dt>{t.term}</dt>
                                            <dd>{t.meaning}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </>
                        )}

                        <div className="ai-foot">
                            AI-generated from the uploaded file. Double-check important facts.
                            {canRegenerate && (
                                <button
                                    className="link-btn"
                                    onClick={() => generate("summary", true)}
                                    disabled={busy.summary}
                                >
                                    {busy.summary ? "Regenerating..." : "Regenerate"}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    renderGenerate(
                        "summary",
                        "Summarize this note",
                        "Get a short summary, key points and key terms from this note."
                    )
                ))}

            {tab === "quiz" &&
                (quiz && questions.length > 0 ? (
                    <div>
                        {questions.map((q, qi) => (
                            <div className="quiz-q" key={qi}>
                                <div className="quiz-q-text">
                                    {qi + 1}. {q.question}
                                </div>
                                {q.options.map((opt, oi) => {
                                    const picked = answers[qi] === oi;
                                    let cls = "quiz-opt";
                                    if(submitted && oi === q.answerIndex) cls += " correct";
                                    else if(submitted && picked) cls += " wrong";
                                    else if(picked) cls += " picked";
                                    return (
                                        <label className={cls} key={oi}>
                                            <input
                                                type="radio"
                                                name={`q${qi}`}
                                                checked={picked}
                                                disabled={submitted}
                                                onChange={() => setAnswers({ ...answers, [qi]: oi })}
                                            />
                                            {opt}
                                        </label>
                                    );
                                })}
                                {submitted && q.explanation && <div className="quiz-explain">{q.explanation}</div>}
                            </div>
                        ))}

                        {submitted ? (
                            <div className="quiz-result">
                                <strong>
                                    Score: {score} / {questions.length}
                                </strong>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => {
                                        setAnswers({});
                                        setSubmitted(false);
                                    }}
                                >
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary btn-sm"
                                disabled={!allAnswered}
                                onClick={() => setSubmitted(true)}
                            >
                                Check answers
                            </button>
                        )}

                        <div className="ai-foot">
                            AI-generated quiz. Double-check important facts.
                            {canRegenerate && (
                                <button
                                    className="link-btn"
                                    onClick={() => generate("quiz", true)}
                                    disabled={busy.quiz}
                                >
                                    {busy.quiz ? "Regenerating..." : "Regenerate"}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    renderGenerate("quiz", "Generate quiz", "Test yourself with multiple-choice questions made from this note.")
                ))}
        </div>
    );
}
