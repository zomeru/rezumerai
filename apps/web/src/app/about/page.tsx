import { PublicContentPage } from "@/components/PublicContentPage";
import { getContentPage, getLandingPageContent } from "@/lib/system-content";

export default async function AboutPage(): Promise<React.JSX.Element> {
  const [content, landing] = await Promise.all([getContentPage("about"), getLandingPageContent()]);

  return <PublicContentPage content={content} landing={landing} />;
}
