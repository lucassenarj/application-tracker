-- CreateIndex
CREATE INDEX "Application_title_fts_idx" ON "Application" USING GIN (to_tsvector('english', "title"));

-- CreateIndex
CREATE INDEX "Company_name_fts_idx" ON "Company" USING GIN (to_tsvector('english', "name"));
