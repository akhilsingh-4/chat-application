const SearchIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    <circle cx="11" cy="11" r="7" />
  </svg>
);

const featureCards = [
  { label: "End-to-end Encrypted", icon: "lock" },
  { label: "Real-time Messaging", icon: "bolt" },
  { label: "Online Status", icon: "status" },
  { label: "Beautiful & Fast", icon: "spark" },
];

const FeatureIcon = ({ type }) => {
  if (type === "status") {
    return (
      <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.85)]" />
    );
  }

  const paths = {
    lock: (
      <>
        <rect x="6" y="10" width="12" height="10" rx="2" />
        <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
      </>
    ),
    bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" />,
    spark: (
      <>
        <path d="M12 3 9.7 8.7 4 11l5.7 2.3L12 19l2.3-5.7L20 11l-5.7-2.3L12 3Z" />
        <path d="M5 4v3M3.5 5.5h3" />
      </>
    ),
  };

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
};

const EmptyChatState = () => {
  return (
    <section className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      >
        <span className="absolute left-[14%] top-[18%] h-1 w-1 rounded-full bg-[#7B61FF]" />
        <span className="absolute right-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-[#B98BFF] shadow-[0_0_16px_rgba(185,139,255,0.9)]" />
        <span className="absolute left-[38%] top-[24%] h-1 w-1 rounded-full bg-[#5EEAD4]" />
        <span className="absolute right-[24%] bottom-[34%] h-1 w-1 rounded-full bg-[#8B5CF6]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
        <div className="relative mb-9 h-48 w-72 sm:h-56 sm:w-96">
          <div className="absolute left-1/2 top-1/2 h-40 w-64 -translate-x-[42%] -translate-y-[40%] rotate-6 rounded-[38px] bg-gradient-to-br from-[#8B5CF6] via-[#5B21B6] to-[#25164F] opacity-90 shadow-[0_32px_90px_rgba(124,58,237,0.38)]" />
          <div className="absolute left-1/2 top-1/2 h-40 w-72 -translate-x-[58%] -translate-y-[55%] rounded-[42px] border border-white/12 bg-gradient-to-br from-[#27213C] via-[#14111F] to-[#080711] shadow-[inset_0_2px_16px_rgba(255,255,255,0.08),0_34px_90px_rgba(0,0,0,0.55)]">
            <span className="absolute bottom-[-22px] left-14 h-12 w-12 rotate-12 rounded-br-[18px] bg-[#14111F] shadow-[10px_10px_26px_rgba(0,0,0,0.25)]" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="flex gap-5">
                <span className="h-7 w-7 rounded-full bg-gradient-to-b from-[#C084FC] to-[#7C3AED] shadow-[0_0_28px_rgba(168,85,247,0.9)]" />
                <span className="h-7 w-7 rounded-full bg-gradient-to-b from-[#C084FC] to-[#7C3AED] shadow-[0_0_28px_rgba(168,85,247,0.9)]" />
                <span className="h-7 w-7 rounded-full bg-gradient-to-b from-[#C084FC] to-[#7C3AED] shadow-[0_0_28px_rgba(168,85,247,0.9)]" />
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-[#F8F5FF] sm:text-4xl">
          Start a <span className="text-[#B56AFF]">conversation</span>
        </h2>
        <p className="mt-4 max-w-md text-base leading-7 text-[#AAA3B8] sm:text-lg">
          Search for someone or select a conversation from the list to start
          chatting.
        </p>
        <button
          type="button"
          className="mt-9 inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-[#8B5CF6] bg-[#120D20]/70 px-9 text-base font-semibold text-[#F7F2FF] shadow-[0_0_26px_rgba(124,58,237,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:bg-[#1A1130] hover:shadow-[0_18px_42px_rgba(124,58,237,0.28)]"
        >
          <SearchIcon />
          Search People
        </button>
      </div>

      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature) => (
          <div
            key={feature.label}
            className="flex h-12 items-center justify-center gap-3 rounded-lg border border-white/7 bg-white/[0.025] px-4 text-sm font-medium text-[#BDB7C8] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur"
          >
            <span className="text-[#B9A7FF]">
              <FeatureIcon type={feature.icon} />
            </span>
            <span className="truncate">{feature.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EmptyChatState;
