import { createHash } from "node:crypto";
import { MDocument } from "@mastra/rag";
import type { PrismaClient } from "@rezumerai/database";
import type { AiConfiguration, PublicContentTopic } from "@rezumerai/types";
import { getPublicAppContent, listConfiguredPublicTopics } from "@/lib/system-content";
import type { AssistantContextMessage } from "../assistant-agent/types";
import { embedAssistantTexts, ensureAssistantEmbeddingDimension, resolveAssistantVectorType } from "./embedder";
import { getAssistantVectorStore } from "./runtime";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

type PublicKnowledgeDocument = {
  content: string;
  summary: string;
  title: string;
  topic: PublicContentTopic;
};

const ASSISTANT_KNOWLEDGE_DATASET = "assistant-public-knowledge";
const ASSISTANT_KNOWLEDGE_INDEX = "assistant_public_knowledge_v1";
const ASSISTANT_KNOWLEDGE_TOP_K = 4;
const ASSISTANT_KNOWLEDGE_MIN_SCORE = 0.68;
const ASSISTANT_KNOWLEDGE_TOKEN_BUDGET = 650;

let knowledgeFingerprint: string | null = null;
let knowledgeSyncPromise: Promise<void> | null = null;

function estimateTokenCount(value: string): number {
  return Math.ceil(value.length / 4);
}

function buildKnowledgeFingerprint(documents: PublicKnowledgeDocument[], config: AiConfiguration): string {
  return createHash("sha1")
    .update(
      JSON.stringify({
        dimensions: config.EMBEDDING_DIMENSIONS,
        model: config.EMBEDDING_MODEL,
        provider: config.EMBEDDING_PROVIDER,
        documents,
      }),
    )
    .digest("hex");
}

function buildKnowledgeMarkdown(document: PublicKnowledgeDocument): string {
  return `# ${document.title}

${document.summary}

${document.content}`.trim();
}

async function listPublicKnowledgeDocuments(db: DatabaseClient): Promise<PublicKnowledgeDocument[]> {
  const topics = listConfiguredPublicTopics();
  const documents = await Promise.all(
    topics.map(async (topic) => {
      const content = await getPublicAppContent(topic, db);
      const sections = content.sections
        .map(
          (section) =>
            `## ${section.heading}

${section.points.map((point) => `- ${point}`).join("\n")}`,
        )
        .join("\n\n");

      return {
        topic,
        title: content.title,
        summary: content.summary,
        content: sections,
      } satisfies PublicKnowledgeDocument;
    }),
  );

  return documents;
}

async function buildKnowledgeChunks(db: DatabaseClient): Promise<
  Array<{
    id: string;
    text: string;
    metadata: Record<string, unknown>;
  }>
> {
  const documents = await listPublicKnowledgeDocuments(db);
  const chunks: Array<{
    id: string;
    text: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (const document of documents) {
    const mDocument = MDocument.fromMarkdown(buildKnowledgeMarkdown(document), {
      scope: "PUBLIC",
      sourceType: "public-content",
      title: document.title,
      topic: document.topic,
    });
    const documentChunks = await mDocument.chunk({
      strategy: "markdown",
      maxSize: document.topic === "faq" ? 550 : 700,
      overlap: 80,
    });

    documentChunks.forEach((chunk, index) => {
      const text = chunk.text.trim();

      if (!text) {
        return;
      }

      chunks.push({
        id: `assistant-public:${document.topic}:${index}`,
        text,
        metadata: {
          scope: "PUBLIC",
          sourceType: "public-content",
          title: document.title,
          topic: document.topic,
          chunkIndex: index,
          text,
        },
      });
    });
  }

  return chunks;
}

async function ensurePublicKnowledgeIndexed(db: DatabaseClient, config: AiConfiguration): Promise<void> {
  const documents = await listPublicKnowledgeDocuments(db);
  const nextFingerprint = buildKnowledgeFingerprint(documents, config);

  if (knowledgeFingerprint === nextFingerprint) {
    return;
  }

  if (knowledgeSyncPromise) {
    await knowledgeSyncPromise;

    if (knowledgeFingerprint === nextFingerprint) {
      return;
    }
  }

  knowledgeSyncPromise = (async () => {
    const chunks = await buildKnowledgeChunks(db);
    const { embeddings } = await embedAssistantTexts(
      config,
      chunks.map((chunk) => chunk.text),
    );
    const dimension = await ensureAssistantEmbeddingDimension(config);
    const vectorStore = getAssistantVectorStore();

    await vectorStore.createIndex({
      indexName: ASSISTANT_KNOWLEDGE_INDEX,
      dimension,
      metric: "cosine",
      vectorType: resolveAssistantVectorType(dimension),
      indexConfig: {
        type: "hnsw",
        hnsw: {
          m: 16,
          efConstruction: 64,
        },
      },
    });

    try {
      await vectorStore.deleteVectors({
        indexName: ASSISTANT_KNOWLEDGE_INDEX,
        filter: {
          dataset: ASSISTANT_KNOWLEDGE_DATASET,
        },
      });
    } catch {
      // Ignore empty-index cleanup failures; a following upsert still seeds the dataset.
    }

    await vectorStore.upsert({
      indexName: ASSISTANT_KNOWLEDGE_INDEX,
      ids: chunks.map((chunk) => chunk.id),
      vectors: embeddings,
      metadata: chunks.map((chunk) => ({
        ...chunk.metadata,
        dataset: ASSISTANT_KNOWLEDGE_DATASET,
        indexedAt: new Date().toISOString(),
        knowledgeFingerprint: nextFingerprint,
      })),
    });

    knowledgeFingerprint = nextFingerprint;
  })().finally(() => {
    knowledgeSyncPromise = null;
  });

  await knowledgeSyncPromise;
}

export async function buildAssistantKnowledgeContext(options: {
  config: AiConfiguration;
  db: DatabaseClient;
  latestUserMessage: string;
}): Promise<AssistantContextMessage | null> {
  if (!options.latestUserMessage.trim()) {
    return null;
  }

  await ensurePublicKnowledgeIndexed(options.db, options.config);

  const vectorStore = getAssistantVectorStore();
  const { embeddings } = await embedAssistantTexts(options.config, [options.latestUserMessage]);
  const queryVector = embeddings[0];

  if (!queryVector) {
    return null;
  }

  const results = await vectorStore.query({
    indexName: ASSISTANT_KNOWLEDGE_INDEX,
    queryVector,
    topK: ASSISTANT_KNOWLEDGE_TOP_K,
    minScore: ASSISTANT_KNOWLEDGE_MIN_SCORE,
    filter: {
      dataset: ASSISTANT_KNOWLEDGE_DATASET,
      scope: "PUBLIC",
    },
  });

  if (results.length === 0) {
    return null;
  }

  const intro = "Use the following approved Rezumerai public content only if it is relevant to the request:";
  const lines = [intro];
  let consumedTokens = estimateTokenCount(intro);

  for (const result of results) {
    const text = typeof result.metadata?.text === "string" ? result.metadata.text.trim() : "";

    if (!text) {
      continue;
    }

    const topic = typeof result.metadata?.topic === "string" ? result.metadata.topic : "public";
    const title = typeof result.metadata?.title === "string" ? result.metadata.title : "Public content";
    const snippet = `[${topic}] ${title}: ${text}`;
    const snippetTokens = estimateTokenCount(snippet);

    if (consumedTokens + snippetTokens > ASSISTANT_KNOWLEDGE_TOKEN_BUDGET) {
      break;
    }

    lines.push(snippet);
    consumedTokens += snippetTokens;
  }

  if (lines.length === 1) {
    return null;
  }

  return {
    role: "system",
    content: `${lines.join("\n\n")}\n\nDo not use this context for private account data, admin data, or unrelated general-knowledge questions.`,
  };
}
