-- Create uploaded_files table for storing file metadata from UploadThing
CREATE TABLE IF NOT EXISTS "public"."uploaded_files" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "file_type" "text",
    "upload_type" "text" NOT NULL, -- 'general', 'child_photo', 'avatar'
    "validation_type" "text" NOT NULL, -- matches the validation type from UploadThing
    "uploadthing_key" "text", -- UploadThing file key for deletion
    "uploadthing_file_id" "text", -- UploadThing file ID
    "metadata" "jsonb" DEFAULT '{}'::"jsonb", -- Additional metadata from UploadThing
    "associated_entity_type" "text", -- 'user', 'child_profile', 'book', 'book_page'
    "associated_entity_id" "uuid", -- ID of the associated entity
    "is_active" boolean DEFAULT true, -- For soft deletion
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Set table owner
ALTER TABLE "public"."uploaded_files" OWNER TO "postgres";

-- Add primary key constraint
ALTER TABLE ONLY "public"."uploaded_files"
    ADD CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint to users table
ALTER TABLE ONLY "public"."uploaded_files"
    ADD CONSTRAINT "uploaded_files_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX "idx_uploaded_files_user_id" ON "public"."uploaded_files" USING "btree" ("user_id");
CREATE INDEX "idx_uploaded_files_upload_type" ON "public"."uploaded_files" USING "btree" ("upload_type");
CREATE INDEX "idx_uploaded_files_validation_type" ON "public"."uploaded_files" USING "btree" ("validation_type");
CREATE INDEX "idx_uploaded_files_associated_entity" ON "public"."uploaded_files" USING "btree" ("associated_entity_type", "associated_entity_id");
CREATE INDEX "idx_uploaded_files_created_at" ON "public"."uploaded_files" USING "btree" ("created_at");
CREATE INDEX "idx_uploaded_files_is_active" ON "public"."uploaded_files" USING "btree" ("is_active");
CREATE INDEX "idx_uploaded_files_uploadthing_key" ON "public"."uploaded_files" USING "btree" ("uploadthing_key");

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER "update_uploaded_files_updated_at" 
    BEFORE UPDATE ON "public"."uploaded_files" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Add RLS (Row Level Security) policies
ALTER TABLE "public"."uploaded_files" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own uploaded files
CREATE POLICY "Users can view own uploaded files" ON "public"."uploaded_files"
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own uploaded files
CREATE POLICY "Users can insert own uploaded files" ON "public"."uploaded_files"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own uploaded files
CREATE POLICY "Users can update own uploaded files" ON "public"."uploaded_files"
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete own uploaded files" ON "public"."uploaded_files"
    FOR DELETE USING (auth.uid() = user_id); 