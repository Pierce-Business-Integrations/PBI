import clsx from "clsx";

export const formSections = [
  "Contact",
  "Business",
  "Project",
  "Details",
] as const;

export default function FormProgress({
  active,
  completed,
  transmitting = false,
  positions,
}: {
  active: number;
  completed: boolean[];
  transmitting?: boolean;
  positions: number[];
}) {
  const progressIndex = Math.max(active, completed.lastIndexOf(true));
  const progress = transmitting
    ? "100%"
    : `${(positions[progressIndex] ?? 0) + 5}px`;

  return (
    <>
      <div className="form-progress-mobile" aria-hidden="true">
        <span>Your inquiry</span>
        <strong>{transmitting ? "Sending" : formSections[active]}</strong>
      </div>
      <aside className="form-progress" aria-hidden="true">
        <div className="form-progress__rail">
          <span className="form-progress__fill" style={{ height: progress }} />
          {transmitting && <span className="form-progress__signal" />}
        </div>
        <ol>
          {formSections.map((section, index) => (
            <li
              key={section}
              style={{
                top: positions[index] ?? 0,
                gridTemplateColumns: "0.7rem auto",
              }}
              className={clsx(
                "form-progress__node",
                index === active && "is-active",
                completed[index] && "is-complete",
              )}
            >
              <span className="form-progress__marker" />
              <span>{section}</span>
            </li>
          ))}
        </ol>
      </aside>
    </>
  );
}
