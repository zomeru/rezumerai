import { createAuditLog } from "../../../../observability/audit";

export async function auditAdminAssistantUsage(options: {
  userId: string;
  reply: string;
  toolNames: string[];
  request: Request;
}): Promise<void> {
  await createAuditLog({
    category: "USER_ACTION",
    eventType: "ADMIN_AI_ASSISTANT_CHAT",
    action: "RUN",
    resourceType: "AI_ASSISTANT",
    userId: options.userId,
    endpoint: new URL(options.request.url).pathname,
    method: options.request.method.toUpperCase(),
    serviceName: "AiService.runAssistantChat",
    requestMetadata: {
      toolNames: options.toolNames,
      replyLength: options.reply.length,
    },
  });
}
