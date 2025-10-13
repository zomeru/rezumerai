import type { UserType } from "@rezumerai/types";
import { Button } from "@rezumerai/ui";
import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";

export default function Home() {
  const today = new Date();

  // Example usage of the imported type
  const user: UserType = {
    id: "1",
    name: "Test User",
    email: "test@example.com",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{capitalize("welcome to rezumerai")}</h1>
      <p className="mb-4">Today is: {formatDate(today, { dateStyle: "full" })}</p>
      <p className="mb-4">Welcome, {user.name}!</p>
      <Button appName="RezumerAI">Get Started</Button>
    </div>
  );
}
