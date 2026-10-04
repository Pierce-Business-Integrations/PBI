import { Fragment, type CSSProperties } from "react";
import styles from "./Homepage.module.css";

const defaultLines = ["Better systems.", "Stronger business."];

export default function HeroHeadline({
  lines = defaultLines,
  id = "home-heading",
  className = styles.heroHeading,
}: {
  lines?: string[];
  id?: string;
  className?: string;
}) {
  return (
    <h1 id={id} className={className} aria-label={lines.join(" ")}>
      {lines.map((line, lineIndex) => (
        <span key={line} className={styles.heroHeadingLine} aria-hidden="true">
          {line.split(" ").map((word, wordIndex) => (
            <Fragment key={wordIndex}>
              {wordIndex > 0 ? " " : null}
              <span className={styles.heroHeadingWord}>
                {Array.from(word).map((letter, index) => {
                  const position = line.indexOf(word) + index;
                  const depth =
                    0.65 * Math.sin(position * 0.48 + lineIndex * 1.15) +
                    0.35 * Math.sin(position * 0.22 + lineIndex * 0.7);

                  return (
                    <span
                      key={index}
                      className={styles.heroHeadingLetter}
                      style={
                        { "--letter-depth": depth.toFixed(3) } as CSSProperties
                      }
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </h1>
  );
}
