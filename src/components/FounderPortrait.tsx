import TeamPortrait from "./TeamPortrait";

export default function FounderPortrait({ className }: { className?: string }) {
  return (
    <TeamPortrait
      name="Jacob Pierce"
      role="Founder & Solutions Architect"
      image="/images/jacob.png"
      imageClassName="origin-center scale-[1.2] object-[58%_center]"
      sizes="(max-width: 640px) 86vw, 460px"
      className={className}
    />
  );
}
