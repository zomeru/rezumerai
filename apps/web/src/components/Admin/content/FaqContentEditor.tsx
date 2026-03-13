import type { FaqInformation } from "@rezumerai/types";
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

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function FaqContentEditor({
  value,
  onChange,
}: {
  value: FaqInformation;
  onChange: (value: FaqInformation) => void;
}): React.JSX.Element {
  return (
    <div className="space-y-6">
      <AdminPanel>
        <div>
          <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">FAQ Basics</p>
          <h2 className="mt-2 font-semibold text-slate-900 text-xl">Help center content</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <AdminFieldLabel label="FAQ title">
            <AdminInput
              ariaLabel="FAQ title"
              value={value.title}
              onChange={(nextValue) => onChange({ ...value, title: nextValue })}
              className="w-full"
            />
          </AdminFieldLabel>
          <AdminFieldLabel label="Summary">
            <AdminTextarea
              ariaLabel="FAQ summary"
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
            <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Categories</p>
            <h2 className="mt-2 font-semibold text-slate-900 text-xl">FAQ groupings</h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                categories: [
                  ...value.categories,
                  {
                    id: `category-${value.categories.length + 1}`,
                    title: `Category ${value.categories.length + 1}`,
                    items: [
                      {
                        id: `faq-item-${value.categories.length + 1}-1`,
                        question: "New question",
                        answer: "New answer",
                        tags: [],
                      },
                    ],
                  },
                ],
              })
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            Add category
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {value.categories.map((category, categoryIndex) => (
            <div key={category.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">Category {categoryIndex + 1}</p>
                <ArrayItemControls
                  label={`category ${categoryIndex + 1}`}
                  disableMoveDown={categoryIndex === value.categories.length - 1}
                  disableMoveUp={categoryIndex === 0}
                  onMoveDown={() =>
                    onChange({
                      ...value,
                      categories: moveItem(value.categories, categoryIndex, categoryIndex + 1),
                    })
                  }
                  onMoveUp={() =>
                    onChange({
                      ...value,
                      categories: moveItem(value.categories, categoryIndex, categoryIndex - 1),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...value,
                      categories: value.categories.filter((_, currentIndex) => currentIndex !== categoryIndex),
                    })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AdminFieldLabel label="Category ID">
                  <AdminInput
                    ariaLabel={`Category ${categoryIndex + 1} id`}
                    value={category.id}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        categories: value.categories.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex ? { ...currentCategory, id: nextValue } : currentCategory,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
                <AdminFieldLabel label="Category title">
                  <AdminInput
                    ariaLabel={`Category ${categoryIndex + 1} title`}
                    value={category.title}
                    onChange={(nextValue) =>
                      onChange({
                        ...value,
                        categories: value.categories.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex ? { ...currentCategory, title: nextValue } : currentCategory,
                        ),
                      })
                    }
                    className="w-full"
                  />
                </AdminFieldLabel>
              </div>

              <div className="mt-5 space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">FAQ item {itemIndex + 1}</p>
                      <ArrayItemControls
                        label={`FAQ item ${itemIndex + 1}`}
                        disableMoveDown={itemIndex === category.items.length - 1}
                        disableMoveUp={itemIndex === 0}
                        onMoveDown={() =>
                          onChange({
                            ...value,
                            categories: value.categories.map((currentCategory, currentIndex) =>
                              currentIndex === categoryIndex
                                ? {
                                    ...currentCategory,
                                    items: moveItem(currentCategory.items, itemIndex, itemIndex + 1),
                                  }
                                : currentCategory,
                            ),
                          })
                        }
                        onMoveUp={() =>
                          onChange({
                            ...value,
                            categories: value.categories.map((currentCategory, currentIndex) =>
                              currentIndex === categoryIndex
                                ? {
                                    ...currentCategory,
                                    items: moveItem(currentCategory.items, itemIndex, itemIndex - 1),
                                  }
                                : currentCategory,
                            ),
                          })
                        }
                        onRemove={() =>
                          onChange({
                            ...value,
                            categories: value.categories.map((currentCategory, currentIndex) =>
                              currentIndex === categoryIndex
                                ? {
                                    ...currentCategory,
                                    items: currentCategory.items.filter(
                                      (_, currentItemIndex) => currentItemIndex !== itemIndex,
                                    ),
                                  }
                                : currentCategory,
                            ),
                          })
                        }
                      />
                    </div>

                    <div className="mt-4 grid gap-4">
                      <AdminFieldLabel label="Question">
                        <AdminInput
                          ariaLabel={`FAQ item ${itemIndex + 1} question`}
                          value={item.question}
                          onChange={(nextValue) =>
                            onChange({
                              ...value,
                              categories: value.categories.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      items: currentCategory.items.map((currentItem, currentItemIndex) =>
                                        currentItemIndex === itemIndex
                                          ? { ...currentItem, question: nextValue }
                                          : currentItem,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            })
                          }
                          className="w-full"
                        />
                      </AdminFieldLabel>
                      <AdminFieldLabel label="Answer">
                        <AdminTextarea
                          ariaLabel={`FAQ item ${itemIndex + 1} answer`}
                          value={item.answer}
                          onChange={(nextValue) =>
                            onChange({
                              ...value,
                              categories: value.categories.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      items: currentCategory.items.map((currentItem, currentItemIndex) =>
                                        currentItemIndex === itemIndex
                                          ? { ...currentItem, answer: nextValue }
                                          : currentItem,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            })
                          }
                          rows={4}
                        />
                      </AdminFieldLabel>
                      <AdminFieldLabel label="Tags (comma separated)">
                        <AdminInput
                          ariaLabel={`FAQ item ${itemIndex + 1} tags`}
                          value={item.tags.join(", ")}
                          onChange={(nextValue) =>
                            onChange({
                              ...value,
                              categories: value.categories.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      items: currentCategory.items.map((currentItem, currentItemIndex) =>
                                        currentItemIndex === itemIndex
                                          ? { ...currentItem, tags: splitTags(nextValue) }
                                          : currentItem,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            })
                          }
                          className="w-full"
                        />
                      </AdminFieldLabel>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    categories: value.categories.map((currentCategory, currentIndex) =>
                      currentIndex === categoryIndex
                        ? {
                            ...currentCategory,
                            items: [
                              ...currentCategory.items,
                              {
                                id: `${currentCategory.id}-item-${currentCategory.items.length + 1}`,
                                question: "New question",
                                answer: "New answer",
                                tags: [],
                              },
                            ],
                          }
                        : currentCategory,
                    ),
                  })
                }
                className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
              >
                Add FAQ item
              </button>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
