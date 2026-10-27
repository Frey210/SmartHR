ALTER TABLE "AppSetting"
  ADD COLUMN IF NOT EXISTS "correctionLimitDays" INTEGER CHECK ("correctionLimitDays" > 0);
