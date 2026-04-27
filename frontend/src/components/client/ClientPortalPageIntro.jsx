export default function ClientPortalPageIntro({
  eyebrow,
  title,
  description,
  badges = [],
  actions = null,
  aside = null,
  className = '',
}) {
  return (
    <section className={`client-page-intro client-premium-card relative overflow-hidden px-4 py-3 md:px-5 md:py-4 mb-4 ${className}`.trim()}>
      <div className="client-page-intro-orb client-page-intro-orb-primary opacity-50 scale-75" />
      <div className="client-page-intro-orb client-page-intro-orb-secondary opacity-50 scale-75" />
      <div className="relative flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="client-page-eyebrow text-[10px] mb-0.5">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white md:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
          {badges.length ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="client-page-chip text-[10px] py-0.5 px-2"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          {actions ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions}
            </div>
          ) : null}
        </div>
        {aside ? (
          <div className="xl:max-w-sm xl:min-w-[280px]">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
