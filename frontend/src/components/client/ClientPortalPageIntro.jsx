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
    <section className={`client-page-intro client-premium-card relative overflow-hidden p-5 md:p-6 ${className}`.trim()}>
      <div className="client-page-intro-orb client-page-intro-orb-primary" />
      <div className="client-page-intro-orb client-page-intro-orb-secondary" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="client-page-eyebrow">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-[15px]">
              {description}
            </p>
          ) : null}
          {badges.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="client-page-chip"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          {actions ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
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
