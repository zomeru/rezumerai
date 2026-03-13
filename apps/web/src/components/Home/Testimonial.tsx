import type { LandingPageInformation } from "@rezumerai/types";
import { Badge, SectionTitle } from "@rezumerai/ui/components";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";

interface CardData {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

interface TestimonialProps {
  content: LandingPageInformation["workflowSection"];
}

function createCards(items: LandingPageInformation["workflowSection"]["items"]): CardData[] {
  return items.map((item, index) => ({
    id: `workflow-${index}`,
    title: item.title,
    description: item.description,
    icon: <FileText className="size-5 text-primary-600" aria-hidden="true" />,
  }));
}

/**
 * How it works" marquee section showing Rezumer workflows.
 */
export default function Testimonial({ content }: TestimonialProps) {
  const cards = createCards(content.items);
  const topCardsData: Array<CardData[][number] & { id: string }> = cards.flatMap((card) => [
    { ...card, id: `${card.id}-top-1` },
    { ...card, id: `${card.id}-top-2` },
  ]);

  const bottomCardsData: Array<CardData[][number] & { id: string }> = [...cards].reverse().flatMap((card) => [
    { ...card, id: `${card.id}-bottom-1` },
    { ...card, id: `${card.id}-bottom-2` },
  ]);

  return (
    <div className="flex scroll-mt-12 flex-col items-center" id="how-it-works">
      <Badge title="How it works" style="text-primary-600" svgStyle="fill-primary-600" />
      <SectionTitle title={content.title} description={content.description} />
      <div className="marquee-row relative mx-auto w-full max-w-5xl overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-white to-transparent"></div>
        <div className="flex min-w-[200%] transform-gpu animate-marquee pt-10 pb-5">
          {topCardsData.map((card) => (
            <CreateCard key={`${card.id}-a`} card={card} />
          ))}
        </div>
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-l from-white to-transparent md:w-40"></div>
      </div>

      <div className="marquee-row relative mx-auto w-full max-w-5xl overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-linear-to-r from-white to-transparent"></div>
        <div className="flex min-w-[200%] transform-gpu animate-marquee-reverse pt-10 pb-5">
          {bottomCardsData.map((card) => (
            <CreateCard key={`${card.id}-b`} card={card} />
          ))}
        </div>
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-linear-to-l from-white to-transparent md:w-40"></div>
      </div>
    </div>
  );
}

const CreateCard = ({ card }: { card: CardData[][number] }) => (
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
