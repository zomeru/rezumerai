import type { ContentPage, DocumentSection } from "@rezumerai/types";
import { AdminFieldLabel, AdminInput, AdminPanel, AdminTextarea } from "../AdminUI";
import ArrayItemControls from "./ArrayItemControls";

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinLines(values: string[]): string {
  return values.join("\n");
}

function createSection(index: number): DocumentSection {
  return {
    id: `section-${index + 1}`,
    heading: `Section ${index + 1}`,
    paragraphs: ["Add paragraph content."],
    bullets: [],
  };
}

export default function ContentPageEditor({
  value,
  onChange,
}: {
  value: ContentPage;
  onChange: (value: ContentPage) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-6">
      <AdminPanel>
        <div>
          <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Page Basics</p>
          <h2 className="mt-2 font-semibold text-slate-900 text-xl">Document content</h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <AdminFieldLabel label="Title">
            <AdminInput
              ariaLabel="Page title"
              value={value.title}
              onChange={(nextValue) => onChange({ ...value, title: nextValue })}
              className="w-full"
            />
          </AdminFieldLabel>
          <AdminFieldLabel label="Last updated">
            <AdminInput
              ariaLabel="Last updated"
              value={value.lastUpdated}
              onChange={(nextValue) => onChange({ ...value, lastUpdated: nextValue })}
              className="w-full"
            />
          </AdminFieldLabel>
        </div>

        <div className="mt-4">
          <AdminFieldLabel label="Summary">
            <AdminTextarea
              ariaLabel="Page summary"
              value={value.summary}
              onChange={(nextValue) => onChange({ ...value, summary: nextValue })}
              rows={4}
            />
          </AdminFieldLabel>
        </div>
      </AdminPanel>

      <AdminPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Sections</p>
            <h2 className="mt-2 font-semibold text-slate-900 text-xl">Document sections</h2>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...value, sections: [...value.sections, createSection(value.sections.length)] })}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            Add section
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {value.sections.map((section, index) => (
            <div key={section.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">Section {index + 1}</p>
                <ArrayItemControls
                  label={`section ${index + 1}`}
                  disableMoveDown={index === value.sections.length - 1}
                  disableMoveUp={index === 0}
                  onMoveDown={() =>
                    onChange({
                      ...value,
                      sections: moveItem(value.sections, index, index + 1),
                    })
                  }
                  onMoveUp={() =>
                    onChange({
                      ...value,
                      sections: moveItem(value.sections, index, index - 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...value,
                      sections: value.sections.filter((_, currentIndex) => currentIndex !== index),
                    })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AdminFieldLabel label="Section ID">
                  <AdminInput
                    ariaLabel={`Section ${index + 1} id`}
                    value={section.id}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((currentSection, currentIndex) =>
                          currentIndex === index ? { ...currentSection, id: nextValue } : currentSection,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
                <AdminFieldLabel label="Heading">
                  <AdminInput
                    ariaLabel={`Section ${index + 1} heading`}
                    value={section.heading}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((currentSection, currentIndex) =>
                          currentIndex === index ? { ...currentSection, heading: nextValue } : currentSection,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <AdminFieldLabel label="Paragraphs (one per line)">
                  <AdminTextarea
                    ariaLabel={`Section ${index + 1} paragraphs`}
                    value={joinLines(section.paragraphs)}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((currentSection, currentIndex) =>
                          currentIndex === index
                            ? { ...currentSection, paragraphs: splitLines(nextValue) }
                            : currentSection,
                        ),
                      })
                    }
                    rows={5}
                  />
                </AdminFieldLabel>
                <AdminFieldLabel label="Bullets (one per line)">
                  <AdminTextarea
                    ariaLabel={`Section ${index + 1} bullets`}
                    value={joinLines(section.bullets)}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        sections: value.sections.map((currentSection, currentIndex) =>
                          currentIndex === index
                            ? { ...currentSection, bullets: splitLines(nextValue) }
                            : currentSection,
                        ),
                      })
                    }
                    rows={5}
                  />
                </AdminFieldLabel>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Cards</p>
            <h2 className="mt-2 font-semibold text-slate-900 text-xl">Supporting cards</h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                cards: [
                  ...value.cards,
                  {
                    title: `Card ${value.cards.length + 1}`,
                    description: "Add card description.",
                    items: [],
                  },
                ],
              })
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            Add card
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {value.cards.map((card, index) => (
            <div
              key={`${card.title}-${card.description}-${card.items.join("|")}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">Card {index + 1}</p>
                <ArrayItemControls
                  label={`card ${index + 1}`}
                  disableMoveDown={index === value.cards.length - 1}
                  disableMoveUp={index === 0}
                  onMoveDown={() =>
                    onChange({
                      ...value,
                      cards: moveItem(value.cards, index, index + 1),
                    })
                  }
                  onMoveUp={() =>
                    onChange({
                      ...value,
                      cards: moveItem(value.cards, index, index - 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...value,
                      cards: value.cards.filter((_, currentIndex) => currentIndex !== index),
                    })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AdminFieldLabel label="Card title">
                  <AdminInput
                    ariaLabel={`Card ${index + 1} title`}
                    value={card.title}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        cards: value.cards.map((currentCard, currentIndex) =>
                          currentIndex === index ? { ...currentCard, title: nextValue } : currentCard,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
                <AdminFieldLabel label="Description">
                  <AdminInput
                    ariaLabel={`Card ${index + 1} description`}
                    value={card.description}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        cards: value.cards.map((currentCard, currentIndex) =>
                          currentIndex === index ? { ...currentCard, description: nextValue } : currentCard,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
              </div>

              <div className="mt-4">
                <AdminFieldLabel label="Items (one per line)">
                  <AdminTextarea
                    ariaLabel={`Card ${index + 1} items`}
                    value={joinLines(card.items)}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        cards: value.cards.map((currentCard, currentIndex) =>
                          currentIndex === index ? { ...currentCard, items: splitLines(nextValue) } : currentCard,
                        ),
                      })
                    }
                    rows={4}
                  />
                </AdminFieldLabel>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Call To Action</p>
            <h2 className="mt-2 font-semibold text-slate-900 text-xl">Optional CTA</h2>
          </div>

          {value.cta ? (
            <button
              type="button"
              onClick={() => onChange({ ...value, cta: null })}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 text-sm transition-colors hover:bg-red-100"
            >
              Remove CTA
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChange({ ...value, cta: { label: "Learn more", href: "/" } })}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
            >
              Add CTA
            </button>
          )}
        </div>

        {value.cta ? <CtaFields value={value} onChange={onChange} /> : null}
      </AdminPanel>
    </div>
  );
}

function CtaFields({
  value,
  onChange,
}: {
  value: ContentPage;
  onChange: (value: ContentPage) => void;
}): React.JSX.Element {
  const cta = value.cta;

  if (!cta) {
    return <></>;
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <AdminFieldLabel label="CTA label">
        <AdminInput
          ariaLabel="CTA label"
          value={cta.label}
          onChange={(nextValue) => onChange({ ...value, cta: { ...cta, label: nextValue } })}
          className="w-full"
        />
      </AdminFieldLabel>
      <AdminFieldLabel label="CTA href">
        <AdminInput
          ariaLabel="CTA href"
          value={cta.href}
          onChange={(nextValue) => onChange({ ...value, cta: { ...cta, href: nextValue } })}
          className="w-full"
        />
      </AdminFieldLabel>
    </div>
  );
}
