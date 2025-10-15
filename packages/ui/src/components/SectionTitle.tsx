export default function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 text-center text-slate-700">
      <h2 className="font-medium text-3xl sm:text-4xl">{title}</h2>
      <p className="max-sm mt-4 max-w-2xl text-slate-500">{description}</p>
    </div>
  );
}
