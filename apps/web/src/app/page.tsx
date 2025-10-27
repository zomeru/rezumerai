import { BannerWithTag } from "@rezumerai/ui";
import { CallToAction, Feature, Footer, Hero, Testimonial } from "@/components/Home";

export default function Home() {
  return (
    <div>
      <BannerWithTag
        tag="AI Feature Added"
        bannerStyle="from-secondary-400 to-secondary-100 text-primary-700"
        textStyle="bg-primary-500 "
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
