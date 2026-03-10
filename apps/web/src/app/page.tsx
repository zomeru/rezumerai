import { BannerWithTag } from "@rezumerai/ui";
import { CallToAction, Feature, Footer, Hero, Testimonial } from "@/components/Home";
import { getLandingPageContent } from "@/lib/system-content";

/**
 * Home page component that renders the landing page sections including hero, features, testimonials, and call-to-action.
 */
export default async function Home() {
  const landing = await getLandingPageContent();

  return (
    <main>
      <BannerWithTag
        tag={landing.bannerTag}
        bannerStyle="from-secondary-300 to-secondary-100 text-slate-800"
        textStyle="bg-primary-600"
      />
      <div className="space-y-48">
        <Hero content={landing} />
        <section id="features" aria-labelledby="features-heading">
          <Feature content={landing.featureSection} />
        </section>
        <section id="how-it-works" aria-labelledby="testimonials-heading">
          <Testimonial content={landing.workflowSection} />
        </section>
        <section id="cta" aria-labelledby="cta-heading">
          <CallToAction content={landing.ctaSection} />
        </section>
        <Footer description={landing.footer.description} />
      </div>
    </main>
  );
}
