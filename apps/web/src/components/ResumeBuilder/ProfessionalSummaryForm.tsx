import { Sparkles } from "lucide-react";

interface ProfessionalSummaryFormProps {
  summary?: string;
  onChange: (summary: string) => void;
}

export default function ProfessionalSummaryForm({ summary = "", onChange }: ProfessionalSummaryFormProps) {
  function onTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-lg">Professional Summary</h3>
          <p className="text-gray-500 text-sm">Add your professional summary here.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded bg-secondary-100 px-3 py-1 text-secondary-700 text-sm transition-colors hover:bg-secondary-200 disabled:opacity-50"
        >
          <Sparkles className="size-4" />
          AI Enhance
        </button>
      </div>

      <div className="mt-6">
        <textarea
          value={summary}
          onChange={onTextareaChange}
          rows={7}
          className="mt-2 w-full resize-none rounded-lg border border-gray-300 p-3 px-4 text-sm outline-none transition-colors focus:border-500 focus:ring focus:ring-primary-500"
          placeholder="Write a compelling professional summary that highlights your strengths and career objectives..."
        />
        <p className="mx-auto max-w-4/5 text-center text-gray-500 text-xs">
          Tip: Keep it concise (2-3 sentences) and focus on your most relevant achievements and skills
        </p>
      </div>
    </div>
  );
}
