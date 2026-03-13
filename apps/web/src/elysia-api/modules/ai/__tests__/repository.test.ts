import { describe, expect, it, mock } from "bun:test";
import { AiRepository } from "../repository";

function createDb() {
  return {
    aiTextOptimizerCredits: {
      findUnique: mock(),
      updateMany: mock(),
      upsert: mock(),
    },
    $transaction: mock(),
  };
}

describe("AiRepository.getDailyCredits", () => {
  it("returns fresh credits without opening a transaction", async () => {
    const now = new Date("2026-03-12T10:00:00.000Z");
    const db = createDb();

    db.aiTextOptimizerCredits.findUnique.mockResolvedValue({
      credits: 7,
      lastResetAt: now,
    });

    const result = await AiRepository.getDailyCredits(db as never, "user_123", 100, now);

    expect(result).toEqual({
      remainingCredits: 7,
      dailyLimit: 100,
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("resets stale credits inside a transaction only when needed", async () => {
    const now = new Date("2026-03-12T10:00:00.000Z");
    const staleBoundary = new Date("2026-03-11T10:00:00.000Z");
    const db = createDb();
    const tx = {
      aiTextOptimizerCredits: {
        findUnique: mock()
          .mockResolvedValueOnce({
            lastResetAt: staleBoundary,
          })
          .mockResolvedValueOnce({
            credits: 100,
          }),
        updateMany: mock().mockResolvedValue({ count: 1 }),
        upsert: mock(),
      },
    };

    db.aiTextOptimizerCredits.findUnique.mockResolvedValue({
      credits: 2,
      lastResetAt: staleBoundary,
    });
    db.$transaction.mockImplementation(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx));

    const result = await AiRepository.getDailyCredits(db as never, "user_123", 100, now);

    expect(result).toEqual({
      remainingCredits: 100,
      dailyLimit: 100,
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.aiTextOptimizerCredits.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.aiTextOptimizerCredits.upsert).not.toHaveBeenCalled();
  });
});
