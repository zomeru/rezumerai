export default function CallToAction() {
  return (
    <div
      className="mx-auto w-full max-w-5xl border-slate-200 border-y border-dashed px-10 sm:px-16"
      id="github"
    >
      <div className="-mt-10 -mb-10 flex w-full flex-col items-center justify-between gap-8 border-slate-200 border-x border-dashed px-3 py-16 text-center sm:py-20 md:flex-row md:px-10 md:text-left">
        <p className="max-w-md font-medium text-slate-800 text-xl">
          Star the repository on GitHub to show your support and help others
          discover it!
        </p>
        <a
          href="https://github.com/zomeru/rezumerai"
          className="flex items-center gap-2 rounded bg-primary-500 px-8 py-3 text-white transition hover:bg-primary-700"
        >
          <span>Star On Github</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4.5"
          >
            <title>Arrow pointing to the right</title>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
