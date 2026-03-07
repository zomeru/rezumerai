import { PublicFaqPage } from "@/components/PublicContentPage";
import { getFaqInformation, getLandingPageContent } from "@/lib/system-content";

export default async function FaqPage(): Promise<React.JSX.Element> {
  const [content, landing] = await Promise.all([getFaqInformation(), getLandingPageContent()]);

  return <PublicFaqPage content={content} landing={landing} />;
}
