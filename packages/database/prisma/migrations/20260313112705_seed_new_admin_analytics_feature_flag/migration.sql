INSERT INTO "feature_flag" (
  "id",
  "name",
  "enabled",
  "description",
  "rolloutPercentage",
  "createdAt",
  "updatedAt"
)
VALUES (
  'cfeatflagadminanalytics01',
  'new_admin_analytics_ui',
  false,
  'Controls the new admin analytics experience with interactive charts.',
  100,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;
