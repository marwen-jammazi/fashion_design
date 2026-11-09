import useCountdown from "../hooks/useCountdown";

const pad = (n) => String(n).padStart(2, "0");

// small inline text, used on cards
export function CountdownText({ target }) {
  const t = useCountdown(target);
  if (t.done) return <>Starting now</>;
  if (t.days > 0) return <>Starts in {t.days}d {t.hours}h {t.minutes}m</>;
  return <>Starts in {pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}</>;
}

// big clay boxes, used on the event page
export default function Countdown({ target }) {
  const t = useCountdown(target);
  const boxes = [
    ["Days", t.days],
    ["Hours", t.hours],
    ["Minutes", t.minutes],
    ["Seconds", t.seconds],
  ];

  return (
    <div className="countdown">
      {boxes.map(([label, value]) => (
        <div key={label} className="count-box">
          <strong>{pad(value)}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}