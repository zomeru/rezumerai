import { BannerWithTag } from "@rezumerai/ui";
import { CallToAction, Feature, Footer, Hero, Testimonial } from "@/components/Home";

/**
 * Home page component that renders the landing page sections including hero, features, testimonials, and call-to-action.
 */
export default function Home() {
  return (
    <main>
      <BannerWithTag
        tag="Early access — feedback welcome"
        bannerStyle="from-secondary-300 to-secondary-100 text-slate-800"
        textStyle="bg-primary-600"
      />
      <div className="space-y-48">
        <Hero />
        <section id="features" aria-labelledby="features-heading">
          <Feature />
        </section>
        <section id="testimonials" aria-labelledby="testimonials-heading">
          <Testimonial />
        </section>
        <section id="cta" aria-labelledby="cta-heading">
          <CallToAction />
        </section>
        <Footer />
      </div>
    </main>
  );
}
