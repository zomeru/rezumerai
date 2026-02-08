import { Badge, SectionTitle } from "@rezumerai/ui/components";
import { FileText, Sparkles, Target } from "lucide-react";
import type { ReactNode } from "react";

interface CardData {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const cards: CardData[] = [
  {
    id: "paste-resume",
    title: "Paste your current resume",
    description: "Start from what you already have — no blank-page pressure.",
    icon: <FileText className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "rewrite-bullets",
    title: "Rewrite bullet points",
    description: "Get suggestions that make your experience sound clearer and more specific.",
    icon: <Sparkles className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "impact-statements",
    title: "Add impact statements",
    description: "Turn responsibilities into outcomes with measurable, credible phrasing.",
    icon: <Sparkles className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "tailor-job-post",
    title: "Tailor to a job post",
    description: "Paste a job description and see which skills/keywords to emphasize.",
    icon: <Target className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "structure-consistency",
    title: "Improve structure and consistency",
    description: "Keep tense, punctuation, and formatting consistent across sections.",
    icon: <FileText className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "keep-voice",
    title: "Stay in control",
    description: "Suggestions are optional — edit them, ignore them, or use them as a starting point.",
    icon: <Sparkles className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "templates",
    title: "Use clean templates",
    description: "Pick a layout that looks professional and keeps content easy to scan.",
    icon: <FileText className="size-5 text-primary-600" aria-hidden="true" />,
  },
  {
    id: "export-pdf",
    title: "Export when you're ready",
    description: "Generate a polished PDF and apply with confidence.",
    icon: <FileText className="size-5 text-primary-600" aria-hidden="true" />,
  },
];

const topCardsData: Array<CardData[][number] & { id: string }> = cards.flatMap((card) => [
  { ...card, id: `${card.id}-top-1` },
  { ...card, id: `${card.id}-top-2` },
]);

const bottomCardsData: Array<CardData[][number] & { id: string }> = [...cards].reverse().flatMap((card) => [
  { ...card, id: `${card.id}-bottom-1` },
  { ...card, id: `${card.id}-bottom-2` },
]);

export default function Testimonial(): React.JSX.Element {
  return (
    <>
      <style>{`
            @keyframes marqueeScroll {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
            }

            .marquee-inner {
                animation: marqueeScroll 25s linear infinite;
            }

            .marquee-reverse {
                animation-direction: reverse;
            }
        `}</style>
      <div className="flex scroll-mt-12 flex-col items-center" id="how-it-works">
        <Badge title="How it works" style="text-primary-600" svgStyle="fill-primary-600" />
        <SectionTitle
          title="What you can do in Rezumer"
          description="These are the real workflows the Rezumer is designed for."
        />
        <div className="marquee-row relative mx-auto w-full max-w-5xl overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-white to-transparent"></div>
          <div className="marquee-inner flex min-w-[200%] transform-gpu pt-10 pb-5">
            {topCardsData.map((card) => (
              <CreateCard key={`${card.id}-a`} card={card} />
            ))}
          </div>
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-l from-white to-transparent md:w-40"></div>
        </div>

        <div className="marquee-row relative mx-auto w-full max-w-5xl overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-white to-transparent"></div>
          <div className="marquee-inner marquee-reverse flex min-w-[200%] transform-gpu pt-10 pb-5">
            {bottomCardsData.map((card) => (
              <CreateCard key={`${card.id}-b`} card={card} />
            ))}
          </div>
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-l from-white to-transparent md:w-40"></div>
        </div>
      </div>
    </>
  );
}

const CreateCard = ({ card }: { card: CardData[][number] }): React.JSX.Element => (
  <div className="mx-4 w-72 shrink-0 rounded-lg border border-slate-200 bg-white p-4 shadow transition-all duration-200 hover:shadow-lg">
    <div className="flex items-start gap-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary-50">{card.icon}</div>
      <div className="flex flex-col">
        <p className="font-semibold text-slate-900 text-sm">{card.title}</p>
        <p className="mt-2 text-slate-600 text-sm leading-relaxed">{card.description}</p>
      </div>
    </div>
  </div>
);
