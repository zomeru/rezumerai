import { BannerWithTag } from "@rezumerai/ui";
import { CallToAction, Feature, Footer, Hero, Testimonial } from "@/components/Home";

export default function Home() {
  return (
    <div>
      <BannerWithTag
        tag="Early access — feedback welcome"
        bannerStyle="from-secondary-300 to-secondary-100 text-slate-800"
        textStyle="bg-primary-600"
      />
      <div className="space-y-48">
        <Hero />
        <Feature />
        <Testimonial />
        <CallToAction />
        <Footer />
      </div>
    </div>
  );
}
