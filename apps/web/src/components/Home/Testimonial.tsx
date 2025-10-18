import { faker } from "@faker-js/faker";
import { Badge, SectionTitle } from "@rezumerai/ui/components";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

type CardData = {
  image: string;
  name: string;
  handle: string;
  feedback: string;
  date: string;
  id: string;
}[];

const topCardsData = Array(8)
  .fill(null)
  .map(() => ({
    image: faker.image.avatar(),
    name: faker.person.firstName(),
    handle: faker.internet.displayName(),
    feedback: faker.lorem.sentence(),
    date: faker.date.past().toDateString(),
    id: uuidv4(),
  }));

const bottomCardsData = Array(8)
  .fill(null)
  .map(() => ({
    image: faker.image.avatar(),
    name: faker.person.firstName(),
    handle: faker.internet.displayName(),
    feedback: faker.lorem.sentence(),
    date: faker.date.past().toDateString(),
    id: uuidv4(),
  }));

export default function Testimonial() {
  return (
    <>
      <style>{`
            @keyframes marqueeScroll {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
            }

            .marquee-inner {
                animation: marqueeScroll 25s linear infinite;
            }

            .marquee-reverse {
                animation-direction: reverse;
            }
        `}</style>
      <div
        className="flex scroll-mt-12 flex-col items-center"
        id="testimonials"
      >
        <Badge
          title="Simple Process"
          style="text-primary-600"
          svgStyle="fill-primary-600"
        />
        <SectionTitle
          title="Testimonials"
          description="See what our users are saying about us"
        />
        <div className="marquee-row relative mx-auto w-full max-w-5xl overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent"></div>
          <div className="marquee-inner flex min-w-[200%] transform-gpu pt-10 pb-5">
            {topCardsData.map((card) => (
              <CreateCard key={card.id} card={card} />
            ))}
          </div>
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent md:w-40"></div>
        </div>

        <div className="marquee-row relative mx-auto w-full max-w-5xl overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent"></div>
          <div className="marquee-inner marquee-reverse flex min-w-[200%] transform-gpu pt-10 pb-5">
            {bottomCardsData.map((card) => (
              <CreateCard key={card.id} card={card} />
            ))}
          </div>
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent md:w-40"></div>
        </div>
      </div>
    </>
  );
}

const CreateCard = ({ card }: { card: CardData[number] }) => (
  <div className="mx-4 w-72 shrink-0 rounded-lg p-4 shadow transition-all duration-200 hover:shadow-lg">
    <div className="flex gap-2">
      {/* <img className="size-11 rounded-full" src={card.image} alt="User" /> */}
      <div className="relative size-11">
        <Image
          src={card.image}
          alt="User"
          className="rounded-full object-cover"
          width={40}
          height={40}
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <p>{card.name}</p>
          <svg
            className="mt-0.5"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Verified user icon</title>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z"
              fill="#2196F3"
            />
          </svg>
        </div>
        <span className="text-slate-500 text-xs">{card.handle}</span>
      </div>
    </div>
    <p className="py-4 text-gray-800 text-sm">{card.feedback}</p>
    <div className="flex items-center justify-between text-slate-500 text-xs">
      <div className="flex items-center gap-1">
        <span>Posted on</span>
        <a
          href="https://x.com"
          target="_blank"
          className="hover:text-sky-500"
          rel="noopener"
        >
          <svg
            width="11"
            height="10"
            viewBox="0 0 11 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Icon representing the social media platform X</title>
            <path
              d="m.027 0 4.247 5.516L0 10h.962l3.742-3.926L7.727 10H11L6.514 4.174 10.492 0H9.53L6.084 3.616 3.3 0zM1.44.688h1.504l6.64 8.624H8.082z"
              fill="currentColor"
            />
          </svg>
        </a>
      </div>
      <p>{card.date}</p>
    </div>
  </div>
);
