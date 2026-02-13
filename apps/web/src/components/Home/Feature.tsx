import { Badge, SectionTitle } from "@rezumerai/ui/components";
import { FileText, Sparkles, Target } from "lucide-react";

/**
 * Features section of the homepage that highlights key AI-powered resume capabilities.
 */
export default function Feature(): React.JSX.Element {
  return (
    <div className="flex scroll-mt-12 flex-col items-center" id="features">
      <Badge title="What it does" style="text-primary-600" svgStyle="fill-primary-600" />
      <SectionTitle
        title="Improve your resume with AI suggestions"
        description="Rezumer helps you rewrite bullet points, strengthen impact statements, and tailor wording to a role — without hiring a resume writer."
      />

      <div className="mt-20 flex flex-wrap items-center justify-center gap-6 px-4 md:px-0">
        <div className="flex max-w-sm flex-col items-center justify-center gap-6 rounded-xl border border-primary-200 p-6 text-center">
          <div className="aspect-square rounded-full bg-primary-100 p-6">
            <Sparkles className="size-7 text-primary-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-slate-700">Bullet point rewrites</h3>
            <p className="text-slate-600 text-sm">
              Turn rough notes into clearer, outcome-focused bullets. Accept, edit, or ignore any suggestion.
            </p>
          </div>
        </div>
        <div className="flex max-w-sm flex-col items-center justify-center gap-6 rounded-xl border border-secondary-200 p-6 text-center">
          <div className="aspect-square rounded-full bg-secondary-100 p-6">
            <Target className="size-7 text-secondary-700" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-slate-700">Tailor to a job description</h3>
            <p className="text-slate-600 text-sm">
              Paste a job post and get suggestions to align skills and keywords — without keyword stuffing.
            </p>
          </div>
        </div>
        <div className="flex max-w-sm flex-col items-center justify-center gap-6 rounded-xl border border-accent-200 p-6 text-center">
          <div className="aspect-square rounded-full bg-accent-100 p-6">
            <FileText className="size-7 text-accent-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-slate-700">Polished templates & export</h3>
            <p className="text-slate-600 text-sm">
              Choose a clean template and export to PDF when you’re ready to apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
