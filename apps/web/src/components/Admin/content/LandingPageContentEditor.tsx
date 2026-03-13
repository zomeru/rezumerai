import type { LandingFeatureIcon, LandingPageInformation } from "@rezumerai/types";
import { AdminFieldLabel, AdminInput, AdminPanel, AdminSelect, AdminTextarea } from "../AdminUI";
import ArrayItemControls from "./ArrayItemControls";

const FEATURE_ICON_OPTIONS: Array<{ value: LandingFeatureIcon; label: string }> = [
  { value: "sparkles", label: "Sparkles" },
  { value: "target", label: "Target" },
  { value: "file-text", label: "File text" },
  { value: "shield", label: "Shield" },
  { value: "messages", label: "Messages" },
];

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

export default function LandingPageContentEditor({
  value,
  onChange,
}: {
  value: LandingPageInformation;
  onChange: (value: LandingPageInformation) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-6">
      <AdminPanel>
        <div>
          <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Banner And Hero</p>
          <h2 className="mt-2 font-semibold text-slate-900 text-xl">Landing page basics</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <AdminFieldLabel label="Banner tag">
            <AdminInput
              ariaLabel="Banner tag"
              value={value.bannerTag}
              onChange={(nextValue) => onChange({ ...value, bannerTag: nextValue })}
              className="w-full"
            />
          </AdminFieldLabel>
          <AdminFieldLabel label="Hero title">
            <AdminInput
              ariaLabel="Hero title"
              value={value.hero.title}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  hero: { ...value.hero, title: nextValue },
                })
              }
              className="w-full"
            />
          </AdminFieldLabel>
          <AdminFieldLabel label="Hero description">
            <AdminTextarea
              ariaLabel="Hero description"
              value={value.hero.description}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  hero: { ...value.hero, description: nextValue },
                })
              }
              rows={4}
            />
          </AdminFieldLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFieldLabel label="Primary CTA label">
              <AdminInput
                ariaLabel="Primary CTA label"
                value={value.hero.primaryCtaLabel}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    hero: { ...value.hero, primaryCtaLabel: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
            <AdminFieldLabel label="Secondary CTA label">
              <AdminInput
                ariaLabel="Secondary CTA label"
                value={value.hero.secondaryCtaLabel}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    hero: { ...value.hero, secondaryCtaLabel: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
          </div>
          <AdminFieldLabel label="Trust badges (one per line)">
            <AdminTextarea
              ariaLabel="Trust badges"
              value={joinLines(value.hero.trustBadges)}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  hero: { ...value.hero, trustBadges: splitLines(nextValue) },
                })
              }
              rows={4}
            />
          </AdminFieldLabel>
        </div>
      </AdminPanel>

      <AdminPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Feature Section</p>
            <h2 className="mt-2 font-semibold text-slate-900 text-xl">Product value props</h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                featureSection: {
                  ...value.featureSection,
                  items: [
                    ...value.featureSection.items,
                    {
                      title: `Feature ${value.featureSection.items.length + 1}`,
                      description: "Add feature description.",
                      icon: "sparkles",
                    },
                  ],
                },
              })
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            Add feature item
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFieldLabel label="Eyebrow">
              <AdminInput
                ariaLabel="Feature section eyebrow"
                value={value.featureSection.eyebrow}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    featureSection: { ...value.featureSection, eyebrow: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
            <AdminFieldLabel label="Title">
              <AdminInput
                ariaLabel="Feature section title"
                value={value.featureSection.title}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    featureSection: { ...value.featureSection, title: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
          </div>
          <AdminFieldLabel label="Description">
            <AdminTextarea
              ariaLabel="Feature section description"
              value={value.featureSection.description}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  featureSection: { ...value.featureSection, description: nextValue },
                })
              }
              rows={4}
            />
          </AdminFieldLabel>
        </div>

        <div className="mt-5 space-y-4">
          {value.featureSection.items.map((item, index) => (
            <div
              key={`${item.title}-${item.description}-${item.icon}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">Feature item {index + 1}</p>
                <ArrayItemControls
                  label={`feature item ${index + 1}`}
                  disableMoveDown={index === value.featureSection.items.length - 1}
                  disableMoveUp={index === 0}
                  onMoveDown={() =>
                    onChange({
                      ...value,
                      featureSection: {
                        ...value.featureSection,
                        items: moveItem(value.featureSection.items, index, index + 1),
                      },
                    })
                  }
                  onMoveUp={() =>
                    onChange({
                      ...value,
                      featureSection: {
                        ...value.featureSection,
                        items: moveItem(value.featureSection.items, index, index - 1),
                      },
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...value,
                      featureSection: {
                        ...value.featureSection,
                        items: value.featureSection.items.filter((_, currentIndex) => currentIndex !== index),
                      },
                    })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AdminFieldLabel label="Title">
                  <AdminInput
                    ariaLabel={`Feature item ${index + 1} title`}
                    value={item.title}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        featureSection: {
                          ...value.featureSection,
                          items: value.featureSection.items.map((currentItem, currentIndex) =>
                            currentIndex === index ? { ...currentItem, title: nextValue } : currentItem,
                          ),
                        },
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
                <AdminSelect
                  label="Icon"
                  value={item.icon}
                  onChange={(nextValue) =>
                    onChange({
                      ...value,
                      featureSection: {
                        ...value.featureSection,
                        items: value.featureSection.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, icon: nextValue as LandingFeatureIcon }
                            : currentItem,
                        ),
                      },
                    })
                  }
                  options={FEATURE_ICON_OPTIONS}
                  className="w-full"
                />
              </div>
              <div className="mt-4">
                <AdminFieldLabel label="Description">
                  <AdminTextarea
                    ariaLabel={`Feature item ${index + 1} description`}
                    value={item.description}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        featureSection: {
                          ...value.featureSection,
                          items: value.featureSection.items.map((currentItem, currentIndex) =>
                            currentIndex === index ? { ...currentItem, description: nextValue } : currentItem,
                          ),
                        },
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
            <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Workflow Section</p>
            <h2 className="mt-2 font-semibold text-slate-900 text-xl">Step-by-step flow</h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                workflowSection: {
                  ...value.workflowSection,
                  items: [
                    ...value.workflowSection.items,
                    {
                      title: `Workflow item ${value.workflowSection.items.length + 1}`,
                      description: "Add workflow description.",
                    },
                  ],
                },
              })
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            Add workflow item
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFieldLabel label="Eyebrow">
              <AdminInput
                ariaLabel="Workflow section eyebrow"
                value={value.workflowSection.eyebrow}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    workflowSection: { ...value.workflowSection, eyebrow: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
            <AdminFieldLabel label="Title">
              <AdminInput
                ariaLabel="Workflow section title"
                value={value.workflowSection.title}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    workflowSection: { ...value.workflowSection, title: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
          </div>
          <AdminFieldLabel label="Description">
            <AdminTextarea
              ariaLabel="Workflow section description"
              value={value.workflowSection.description}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  workflowSection: { ...value.workflowSection, description: nextValue },
                })
              }
              rows={4}
            />
          </AdminFieldLabel>
        </div>

        <div className="mt-5 space-y-4">
          {value.workflowSection.items.map((item, index) => (
            <div
              key={`${item.title}-${item.description}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">Workflow item {index + 1}</p>
                <ArrayItemControls
                  label={`workflow item ${index + 1}`}
                  disableMoveDown={index === value.workflowSection.items.length - 1}
                  disableMoveUp={index === 0}
                  onMoveDown={() =>
                    onChange({
                      ...value,
                      workflowSection: {
                        ...value.workflowSection,
                        items: moveItem(value.workflowSection.items, index, index + 1),
                      },
                    })
                  }
                  onMoveUp={() =>
                    onChange({
                      ...value,
                      workflowSection: {
                        ...value.workflowSection,
                        items: moveItem(value.workflowSection.items, index, index - 1),
                      },
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...value,
                      workflowSection: {
                        ...value.workflowSection,
                        items: value.workflowSection.items.filter((_, currentIndex) => currentIndex !== index),
                      },
                    })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4">
                <AdminFieldLabel label="Title">
                  <AdminInput
                    ariaLabel={`Workflow item ${index + 1} title`}
                    value={item.title}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        workflowSection: {
                          ...value.workflowSection,
                          items: value.workflowSection.items.map((currentItem, currentIndex) =>
                            currentIndex === index ? { ...currentItem, title: nextValue } : currentItem,
                          ),
                        },
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
                <AdminFieldLabel label="Description">
                  <AdminTextarea
                    ariaLabel={`Workflow item ${index + 1} description`}
                    value={item.description}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        workflowSection: {
                          ...value.workflowSection,
                          items: value.workflowSection.items.map((currentItem, currentIndex) =>
                            currentIndex === index ? { ...currentItem, description: nextValue } : currentItem,
                          ),
                        },
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
        <div>
          <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">CTA And Footer</p>
          <h2 className="mt-2 font-semibold text-slate-900 text-xl">Closing content</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <AdminFieldLabel label="CTA title">
            <AdminInput
              ariaLabel="CTA section title"
              value={value.ctaSection.title}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  ctaSection: { ...value.ctaSection, title: nextValue },
                })
              }
              className="w-full"
            />
          </AdminFieldLabel>
          <AdminFieldLabel label="CTA description">
            <AdminTextarea
              ariaLabel="CTA section description"
              value={value.ctaSection.description}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  ctaSection: { ...value.ctaSection, description: nextValue },
                })
              }
              rows={4}
            />
          </AdminFieldLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFieldLabel label="CTA button label">
              <AdminInput
                ariaLabel="CTA section button label"
                value={value.ctaSection.primaryCtaLabel}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    ctaSection: { ...value.ctaSection, primaryCtaLabel: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
            <AdminFieldLabel label="CTA href">
              <AdminInput
                ariaLabel="CTA section href"
                value={value.ctaSection.primaryCtaHref}
                onChange={(nextValue) =>
                  onChange({
                    ...value,
                    ctaSection: { ...value.ctaSection, primaryCtaHref: nextValue },
                  })
                }
                className="w-full"
              />
            </AdminFieldLabel>
          </div>
          <AdminFieldLabel label="Footer description">
            <AdminTextarea
              ariaLabel="Footer description"
              value={value.footer.description}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  footer: { description: nextValue },
                })
              }
              rows={4}
            />
          </AdminFieldLabel>
        </div>
      </AdminPanel>
    </div>
  );
}
