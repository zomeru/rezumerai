import type { ContentPage, FaqInformation, LandingPageInformation } from "@rezumerai/types";
import { BannerWithTag } from "@rezumerai/ui";
import Link from "next/link";
import Footer from "./Home/Footer";
import PublicSiteNavbar from "./PublicSiteNavbar";

interface PublicPageProps {
  content: ContentPage;
  landing: LandingPageInformation;
}

interface PublicFaqProps {
  content: FaqInformation;
  landing: LandingPageInformation;
}

export function PublicContentPage({ content, landing }: PublicPageProps): React.JSX.Element {
  return (
    <main>
      <BannerWithTag
        tag={landing.bannerTag}
        bannerStyle="from-secondary-300 to-secondary-100 text-slate-800"
        textStyle="bg-primary-600"
      />
      <div className="space-y-24 bg-linear-to-b from-primary-50/50 via-white to-primary-100/30">
        <PublicSiteNavbar primaryCtaLabel={landing.hero.primaryCtaLabel} />

        <section className="relative overflow-hidden px-6 pb-2 md:px-16 lg:px-24 xl:px-40">
          <div className="absolute -top-8 left-1/4 -z-10 size-72 rounded-full bg-primary-300/30 blur-[110px] sm:size-96" />
          <div className="mx-auto max-w-5xl space-y-10 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-slate-900/5 shadow-xl backdrop-blur sm:p-12">
            <div className="space-y-4 border-slate-200 border-b pb-8">
              <p className="font-semibold text-primary-600 text-sm uppercase tracking-[0.2em]">{content.lastUpdated}</p>
              <h1 className="max-w-4xl font-semibold text-4xl text-slate-900 md:text-5xl">{content.title}</h1>
              <p className="max-w-3xl text-lg text-slate-600 leading-8">{content.summary}</p>
            </div>

            <div className="space-y-8">
              {content.sections.map((section) => (
                <section key={section.id} className="space-y-4">
                  <h2 className="font-semibold text-2xl text-slate-900">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-slate-700 leading-7">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets.length > 0 && (
                    <ul className="space-y-2 pl-5 text-slate-700">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {content.cards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {content.cards.map((card) => (
                  <div key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-6">
                    <h3 className="font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-slate-600 text-sm leading-6">{card.description}</p>
                    {card.items.length > 0 && (
                      <ul className="mt-4 space-y-2 text-slate-700 text-sm">
                        {card.items.map((item) => (
                          <li key={item} className="list-disc pl-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {content.cta && (
              <div className="rounded-3xl bg-slate-900 p-6 text-white">
                <Link href={content.cta.href} className="font-semibold">
                  {content.cta.label}
                </Link>
              </div>
            )}
          </div>
        </section>

        <Footer description={landing.footer.description} />
      </div>
    </main>
  );
}

export function PublicFaqPage({ content, landing }: PublicFaqProps): React.JSX.Element {
  return (
    <main>
      <BannerWithTag
        tag={landing.bannerTag}
        bannerStyle="from-secondary-300 to-secondary-100 text-slate-800"
        textStyle="bg-primary-600"
      />
      <div className="space-y-24 bg-linear-to-b from-primary-50/50 via-white to-primary-100/30">
        <PublicSiteNavbar primaryCtaLabel={landing.hero.primaryCtaLabel} />

        <section className="relative overflow-hidden px-6 pb-2 md:px-16 lg:px-24 xl:px-40">
          <div className="absolute -top-8 left-1/4 -z-10 size-72 rounded-full bg-primary-300/30 blur-[110px] sm:size-96" />
          <div className="mx-auto max-w-5xl space-y-10 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-slate-900/5 shadow-xl backdrop-blur sm:p-12">
            <div className="space-y-4 border-slate-200 border-b pb-8">
              <h1 className="max-w-4xl font-semibold text-4xl text-slate-900 md:text-5xl">{content.title}</h1>
              <p className="max-w-3xl text-lg text-slate-600 leading-8">{content.summary}</p>
            </div>

            <div className="space-y-10">
              {content.categories.map((category) => (
                <section key={category.id} className="space-y-5">
                  <h2 className="font-semibold text-2xl text-slate-900">{category.title}</h2>
                  <div className="space-y-4">
                    {category.items.map((item) => (
                      <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
                        <h3 className="font-semibold text-slate-900">{item.question}</h3>
                        <p className="mt-2 text-slate-700 leading-7">{item.answer}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <Footer description={landing.footer.description} />
      </div>
    </main>
  );
}
