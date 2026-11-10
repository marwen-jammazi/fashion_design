const presets = [
  { label: "Team name", type: "text", required: true, optionsText: "" },
  { label: "Song you want to sing", type: "text", required: false, optionsText: "" },
  {
    label: "Skill level",
    type: "select",
    required: false,
    optionsText: "Beginner, Intermediate, Advanced",
  },
];

let counter = 0;
const newKey = () => `new-${Date.now()}-${counter++}`;

export default function QuestionBuilder({ questions, onChange }) {
  const add = (q) => onChange([...questions, { ...q, k: newKey() }]);
  const update = (i, changes) =>
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...changes } : q)));
  const remove = (i) => onChange(questions.filter((_, idx) => idx !== i));
  const full = questions.length >= 10;

  return (
    <div className="field full">
      <span>Questions on the application form</span>

      <div className="q-builder">
        {questions.map((q, i) => (
          <div key={q.k} className="q-item">
            <div className="q-row">
              <input
                value={q.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Question, for example: Team name"
              />
              <select value={q.type} onChange={(e) => update(i, { type: e.target.value })}>
                <option value="text">Short answer</option>
                <option value="textarea">Long answer</option>
                <option value="select">Choose from a list</option>
              </select>
            </div>

            {q.type === "select" && (
              <input
                value={q.optionsText}
                onChange={(e) => update(i, { optionsText: e.target.value })}
                placeholder="Choices separated by commas (at least 2)"
              />
            )}

            <div className="q-foot">
              <label className="check">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => update(i, { required: e.target.checked })}
                />
                Required
              </label>
              <button type="button" className="btn-sm danger" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="q-presets">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn-sm"
              disabled={full}
              onClick={() => add(p)}
            >
              + {p.label}
            </button>
          ))}
          <button
            type="button"
            className="btn-sm"
            disabled={full}
            onClick={() => add({ label: "", type: "text", required: false, optionsText: "" })}
          >
            + Custom question
          </button>
        </div>
      </div>

      <p className="meta">
        Every applicant also gives their name, email, phone and number of people. Up to 10 questions.
      </p>
    </div>
  );
}