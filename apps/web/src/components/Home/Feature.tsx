import type { LandingPageInformation } from "@rezumerai/types";
import { Badge, SectionTitle } from "@rezumerai/ui/components";
import { FileText, MessagesSquare, ShieldCheck, Sparkles, Target } from "lucide-react";

interface FeatureProps {
  content: LandingPageInformation["featureSection"];
}

function resolveIcon(icon: LandingPageInformation["featureSection"]["items"][number]["icon"]) {
  switch (icon) {
    case "sparkles":
      return <Sparkles className="size-7 text-primary-600" aria-hidden="true" />;
    case "target":
      return <Target className="size-7 text-secondary-700" aria-hidden="true" />;
    case "shield":
      return <ShieldCheck className="size-7 text-accent-600" aria-hidden="true" />;
    case "messages":
      return <MessagesSquare className="size-7 text-primary-600" aria-hidden="true" />;
    default:
      return <FileText className="size-7 text-accent-600" aria-hidden="true" />;
  }
}

/**
 * Features section of the homepage that highlights key AI-powered resume capabilities.
 */
export default function Feature({ content }: FeatureProps) {
  return (
    <div className="flex scroll-mt-12 flex-col items-center" id="features">
      <Badge title="What it does" style="text-primary-600" svgStyle="fill-primary-600" />
      <SectionTitle title={content.title} description={content.description} />

      <div className="mt-20 flex flex-wrap items-center justify-center gap-6 px-4 md:px-0">
        {content.items.map((item, index) => (
          <div
            key={item.title}
            className={`flex max-w-sm flex-col items-center justify-center gap-6 rounded-xl border p-6 text-center ${
              index % 3 === 0 ? "border-primary-200" : index % 3 === 1 ? "border-secondary-200" : "border-accent-200"
            }`}
          >
            <div
              className={`aspect-square rounded-full p-6 ${
                index % 3 === 0 ? "bg-primary-100" : index % 3 === 1 ? "bg-secondary-100" : "bg-accent-100"
              }`}
            >
              {resolveIcon(item.icon)}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base text-slate-700">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
