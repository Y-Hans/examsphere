// Add 'featureOverrides TenantFeatureOverride[]' to the Tenant model
// Add 'usageRecords UsageRecord[]' to the User and Tenant models

model FeatureFlag {
  id              String   @id @default(uuid()) @db.VarChar(36)
  key             String   @unique @db.VarChar(100)
  description     String?  @db.VarChar(500)
  defaultEnabled  Boolean  @default(false) @map("default_enabled")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  overrides       TenantFeatureOverride[]

  @@map("feature_flags")
}

model TenantFeatureOverride {
  tenantId String @map("tenant_id") @db.VarChar(36)
  flagId   String @map("flag_id") @db.VarChar(36)
  enabled  Boolean @default(false)

  tenant   Tenant       @relation(fields: [tenantId], references: [id])
  flag     FeatureFlag  @relation(fields: [flagId], references: [id])

  @@primary_key([tenantId, flagId])
  @@map("tenant_feature_overrides")
}

model UsageRecord {
  id         String   @id @default(uuid()) @db.VarChar(36)
  userId     String   @map("user_id") @db.VarChar(36)
  tenantId   String   @map("tenant_id") @db.VarChar(36)
  metric     String   @db.VarChar(50) // e.g., 'AI_TOKENS', 'MOCK_TESTS'
  period     String   @db.VarChar(20) // e.g., '2024-05'
  count      Int      @default(0)
  limit      Int      @default(0)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  user       User     @relation(fields: [userId], references: [id])
  tenant     Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([userId, metric, period])
  @@map("usage_records")
}