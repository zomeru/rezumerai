/**
 * Queue alerting system.
 *
 * Monitors queue depth and sends alerts when thresholds are exceeded.
 * Supports multiple alert channels (webhook, Slack).
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger({ module: "alerts" });

export interface AlertConfig {
  /** Warning threshold - alert when queue depth exceeds this */
  warningThreshold: number;
  /** Critical threshold - urgent alert when queue depth exceeds this */
  criticalThreshold: number;
  /** Cooldown period in seconds between alerts for the same queue */
  cooldownSeconds: number;
  /** Enable/disable alerting */
  enabled: boolean;
  /** Webhook URL for alerts (optional) */
  webhookUrl?: string | null;
  /** Slack webhook URL (optional) */
  slackWebhookUrl?: string | null;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  warningThreshold: 100,
  criticalThreshold: 500,
  cooldownSeconds: 300, // 5 minutes
  enabled: true,
};

interface AlertState {
  lastAlertTime: Map<string, number>;
  alertCounts: Map<string, number>;
}

const alertState: AlertState = {
  lastAlertTime: new Map(),
  alertCounts: new Map(),
};

let config: AlertConfig = { ...DEFAULT_ALERT_CONFIG };

/**
 * Configure alerting thresholds and channels.
 */
export function configureAlerts(newConfig: Partial<AlertConfig>): void {
  config = { ...config, ...newConfig };
  logger.info({ config }, "Alert configuration updated");
}

/**
 * Get current alert configuration.
 */
export function getAlertConfig(): AlertConfig {
  return { ...config };
}

/**
 * Check queue depth and send alerts if thresholds are exceeded.
 */
export async function checkQueueDepth(
  queueName: string,
  depth: number,
): Promise<{ alerted: boolean; level: "none" | "warning" | "critical" }> {
  if (!config.enabled) {
    return { alerted: false, level: "none" };
  }

  // Determine alert level
  let level: "none" | "warning" | "critical" = "none";
  if (depth >= config.criticalThreshold) {
    level = "critical";
  } else if (depth >= config.warningThreshold) {
    level = "warning";
  }

  if (level === "none") {
    return { alerted: false, level: "none" };
  }

  // Check cooldown
  const now = Date.now();
  const lastAlert = alertState.lastAlertTime.get(queueName) ?? 0;
  const cooldownMs = config.cooldownSeconds * 1000;

  if (now - lastAlert < cooldownMs) {
    // Still in cooldown, skip alert
    return { alerted: false, level: "none" };
  }

  // Send alert
  await sendAlert(queueName, depth, level);

  // Update state
  alertState.lastAlertTime.set(queueName, now);
  const count = (alertState.alertCounts.get(queueName) ?? 0) + 1;
  alertState.alertCounts.set(queueName, count);

  return { alerted: true, level };
}

/**
 * Send alert to configured channels.
 */
async function sendAlert(queueName: string, depth: number, level: "warning" | "critical"): Promise<void> {
  const timestamp = new Date().toISOString();
  const alertCount = alertState.alertCounts.get(queueName) ?? 0;

  const message = {
    timestamp,
    queue: queueName,
    depth,
    level,
    alertCount,
    thresholds: {
      warning: config.warningThreshold,
      critical: config.criticalThreshold,
    },
  };

  if (level === "critical") {
    logger.warn({ queueName, depth, alertCount, thresholds: message.thresholds }, "Queue critical alert");
  } else {
    logger.warn({ queueName, depth, alertCount, thresholds: message.thresholds }, "Queue warning alert");
  }

  // Send to webhook if configured
  if (config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      logger.error({ err: error, queueName }, "Failed to send webhook alert");
    }
  }

  // Send to Slack if configured
  if (config.slackWebhookUrl) {
    try {
      const slackMessage = {
        text: `Queue Alert: ${level.toUpperCase()}`,
        attachments: [
          {
            color: level === "critical" ? "danger" : "warning",
            fields: [
              { title: "Queue", value: queueName, short: true },
              { title: "Depth", value: depth.toString(), short: true },
              {
                title: "Thresholds",
                value: `Warning: ${config.warningThreshold}, Critical: ${config.criticalThreshold}`,
                short: false,
              },
            ],
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      await fetch(config.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      });
    } catch (error) {
      logger.error({ err: error, queueName }, "Failed to send Slack alert");
    }
  }
}

/**
 * Get alert statistics.
 */
export function getAlertStats(): {
  totalAlerts: number;
  alertsByQueue: Record<string, number>;
  lastAlerts: Record<string, string>;
} {
  const alertsByQueue: Record<string, number> = {};
  const lastAlerts: Record<string, string> = {};

  for (const [queue, count] of alertState.alertCounts.entries()) {
    alertsByQueue[queue] = count;
  }

  for (const [queue, timestamp] of alertState.lastAlertTime.entries()) {
    lastAlerts[queue] = new Date(timestamp).toISOString();
  }

  return {
    totalAlerts: Object.values(alertsByQueue).reduce((a, b) => a + b, 0),
    alertsByQueue,
    lastAlerts,
  };
}

/**
 * Reset alert state (for testing).
 */
export function resetAlertState(): void {
  alertState.lastAlertTime.clear();
  alertState.alertCounts.clear();
}
