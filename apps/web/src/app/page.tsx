import { Button } from "@rezumerai/ui";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";

export default function Home() {
  const today = new Date();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{capitalize("welcome to rezumerai")}</h1>
      <p className="mb-4">Today is: {formatDate(today, { dateStyle: "full" })}</p>
      <Button appName="RezumerAI">Get Started</Button>
    </div>
  );
}
