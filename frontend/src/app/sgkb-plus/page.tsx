import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SGKB+ Loyalty",
  description: "Track and grow your SGKB+ loyalty benefits.",
};

const highlights = [
  {
    label: "Current tier",
    value: "Platinum",
    sublabel: "Top 5% of members",
  },
  {
    label: "Monthly accelerator",
    value: "x2.5",
    sublabel: "On dining & travel",
  },
  {
    label: "Points earned this month",
    value: "+5,420",
    sublabel: "CHF 18,200 eligible spend",
  },
  {
    label: "Cashback saved",
    value: "CHF 186",
    sublabel: "Redeemed via SGKB+",
  },
];

const missions = [
  {
    title: "Swiss Dining Week",
    description: "Earn 5x points at partner restaurants across Zürich & St. Gallen.",
    progressLabel: "62% complete",
    progress: 62,
    meta: ["5 days left", "+450 pts potential"],
  },
  {
    title: "Tap & ride",
    description: "Activate SGKB Transit for daily commute and unlock a mobility booster.",
    progressLabel: "Activated",
    progress: 100,
    meta: ["Daily streak 9", "+1.5x multiplier"],
  },
  {
    title: "Weekend getaways",
    description: "Book a staycation with SGKB Travel to unlock curated experiences.",
    progressLabel: "Just started",
    progress: 18,
    meta: ["3 offers available", "+1,200 pts potential"],
  },
];

const rewards = [
  {
    title: "Upgrade to Glacier Express panoramic car",
    points: 9500,
    description: "Swap points for a scenic first-class upgrade on your next winter escape.",
    tag: "Travel",
  },
  {
    title: "SGKB+ dining circle",
    points: 4200,
    description: "Chef's table experience for two at selected Michelin-starred partners.",
    tag: "Dining",
  },
  {
    title: "Alpine wellness retreat",
    points: 15800,
    description: "Three-day spa getaway with complimentary transfers and late checkout.",
    tag: "Lifestyle",
  },
  {
    title: "Carbon offset bundle",
    points: 1600,
    description: "Certified offset package that neutralises your last quarter's travel.",
    tag: "Impact",
  },
];

const activity = [
  {
    title: "Night out in Zürich",
    detail: "4 partner venues • SGKB+ Midnight Circuit",
    points: "+820",
    date: "Yesterday",
  },
  {
    title: "Swiss Travel Pass renewal",
    detail: "Annual rail upgrade • Mobility booster",
    points: "+1,450",
    date: "3 days ago",
  },
  {
    title: "Coffee run",
    detail: "Daily espresso streak • Urban Essentials",
    points: "+120",
    date: "5 days ago",
  },
];

export default function SGKBPlusPage() {
  const currentPoints = 18620;
  const nextTierThreshold = 20000;
  const progressToNextTier = Math.min(
    100,
    Math.round((currentPoints / nextTierThreshold) * 100),
  );

  return (
    <div className="px-6 py-8 pb-24 space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 text-white">
        <div className="absolute -left-10 top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-40 w-40 translate-y-12 rounded-full bg-white/10 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                SGKB+
              </div>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                SGKB+ balance
              </h1>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Turn your everyday spending into curated upgrades, immersive experiences,
                and climate-positive perks.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64">
              <div className="text-xs uppercase tracking-wide text-white/60">
                Available points
              </div>
              <div className="mt-2 flex items-baseline gap-2 text-4xl font-semibold">
                {currentPoints.toLocaleString()}
                <span className="text-base font-medium text-white/60">pts</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <span>Next tier</span>
                  <span className="font-medium text-white">
                    Diamond · {nextTierThreshold.toLocaleString()} pts
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${progressToNextTier}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>{progressToNextTier}% there</span>
                  <span>{nextTierThreshold - currentPoints} pts to go</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
              >
                <span className="text-white/70">{item.label}</span>
                <span className="text-lg font-semibold text-white">{item.value}</span>
                <span className="text-white/60">{item.sublabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Boosts this month</h2>
            <p className="mt-1 text-sm text-gray-500">
              Activate experiential missions to unlock supercharged earn rates and exclusive access.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Discover more boosters
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {missions.map((mission) => (
            <div
              key={mission.title}
              className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mission.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{mission.description}</p>
                </div>
                <div className="flex flex-col items-start gap-2 text-sm text-gray-600">
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    {mission.progressLabel}
                  </span>
                  <div className="w-44">
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${mission.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-emerald-700">
                {mission.meta.map((metaItem) => (
                  <span
                    key={metaItem}
                    className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1"
                  >
                    {metaItem}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Curated rewards</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cash in your points for experiences inspired by premium travel and lifestyle programmes.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rewards.map((reward) => (
            <div
              key={reward.title}
              className="flex h-full flex-col justify-between rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-white to-emerald-50 p-5 shadow-sm"
            >
              <div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {reward.tag}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{reward.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{reward.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                <span>Cost</span>
                <span className="text-base font-semibold text-gray-900">
                  {reward.points.toLocaleString()} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Recent activity</h2>
        <p className="mt-1 text-sm text-gray-500">
          A quick look at how SGKB+ keeps rewarding your everyday lifestyle.
        </p>
        <div className="mt-6 space-y-4">
          {activity.map((item) => (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    {item.points}
                  </span>
                  <span className="text-gray-400">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
