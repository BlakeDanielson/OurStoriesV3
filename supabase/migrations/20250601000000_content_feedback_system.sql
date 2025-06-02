-- Content Feedback System Migration
-- This migration adds a simple feedback system for books and pages with thumbs up/down ratings and optional text comments

-- Create enum for feedback types
CREATE TYPE "public"."feedback_type" AS ENUM (
    'thumbs_up',
    'thumbs_down'
);

-- Create enum for content types that can receive feedback
CREATE TYPE "public"."content_type" AS ENUM (
    'book',
    'page'
);

-- Content Feedback table
CREATE TABLE IF NOT EXISTS "public"."content_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "public"."content_type" NOT NULL,
    "content_id" "uuid" NOT NULL, -- book_id or page_id
    "book_id" "uuid" NOT NULL, -- always store book_id for easier querying
    "page_number" integer, -- null for book feedback, page number for page feedback
    "feedback_type" "public"."feedback_type" NOT NULL,
    "comment" "text", -- optional text feedback
    "metadata" "jsonb" DEFAULT '{}'::"jsonb", -- for future extensibility
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add primary key
ALTER TABLE ONLY "public"."content_feedback"
    ADD CONSTRAINT "content_feedback_pkey" PRIMARY KEY ("id");

-- Add unique constraint to prevent duplicate feedback from same user for same content
ALTER TABLE ONLY "public"."content_feedback"
    ADD CONSTRAINT "content_feedback_user_content_unique" UNIQUE ("user_id", "content_type", "content_id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."content_feedback"
    ADD CONSTRAINT "content_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."content_feedback"
    ADD CONSTRAINT "content_feedback_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX "idx_content_feedback_user_id" ON "public"."content_feedback" USING "btree" ("user_id");
CREATE INDEX "idx_content_feedback_book_id" ON "public"."content_feedback" USING "btree" ("book_id");
CREATE INDEX "idx_content_feedback_content_type" ON "public"."content_feedback" USING "btree" ("content_type");
CREATE INDEX "idx_content_feedback_feedback_type" ON "public"."content_feedback" USING "btree" ("feedback_type");
CREATE INDEX "idx_content_feedback_created_at" ON "public"."content_feedback" USING "btree" ("created_at");

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER "update_content_feedback_updated_at" 
    BEFORE UPDATE ON "public"."content_feedback" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Function to get feedback summary for a book
CREATE OR REPLACE FUNCTION "public"."get_book_feedback_summary"("book_id_param" "uuid") 
RETURNS TABLE(
    "thumbs_up_count" bigint,
    "thumbs_down_count" bigint,
    "total_feedback_count" bigint,
    "positive_percentage" numeric
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN feedback_type = 'thumbs_up' THEN 1 END) as thumbs_up_count,
        COUNT(CASE WHEN feedback_type = 'thumbs_down' THEN 1 END) as thumbs_down_count,
        COUNT(*) as total_feedback_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN feedback_type = 'thumbs_up' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as positive_percentage
    FROM public.content_feedback
    WHERE book_id = book_id_param;
END;
$$;

-- Function to get feedback summary for a specific page
CREATE OR REPLACE FUNCTION "public"."get_page_feedback_summary"("book_id_param" "uuid", "page_number_param" integer) 
RETURNS TABLE(
    "thumbs_up_count" bigint,
    "thumbs_down_count" bigint,
    "total_feedback_count" bigint,
    "positive_percentage" numeric
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN feedback_type = 'thumbs_up' THEN 1 END) as thumbs_up_count,
        COUNT(CASE WHEN feedback_type = 'thumbs_down' THEN 1 END) as thumbs_down_count,
        COUNT(*) as total_feedback_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN feedback_type = 'thumbs_up' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as positive_percentage
    FROM public.content_feedback
    WHERE book_id = book_id_param 
    AND content_type = 'page' 
    AND page_number = page_number_param;
END;
$$;

-- Function to get user's feedback for specific content
CREATE OR REPLACE FUNCTION "public"."get_user_content_feedback"("user_id_param" "uuid", "content_type_param" "public"."content_type", "content_id_param" "uuid") 
RETURNS TABLE(
    "id" "uuid",
    "feedback_type" "public"."feedback_type",
    "comment" "text",
    "created_at" timestamp with time zone
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cf.id,
        cf.feedback_type,
        cf.comment,
        cf.created_at
    FROM public.content_feedback cf
    WHERE cf.user_id = user_id_param 
    AND cf.content_type = content_type_param 
    AND cf.content_id = content_id_param;
END;
$$;

-- Function to get admin feedback statistics
CREATE OR REPLACE FUNCTION "public"."get_feedback_admin_stats"() 
RETURNS TABLE(
    "total_feedback" bigint,
    "thumbs_up_count" bigint,
    "thumbs_down_count" bigint,
    "positive_percentage" numeric,
    "book_feedback_count" bigint,
    "page_feedback_count" bigint
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN feedback_type = 'thumbs_up' THEN 1 END) as thumbs_up_count,
        COUNT(CASE WHEN feedback_type = 'thumbs_down' THEN 1 END) as thumbs_down_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN feedback_type = 'thumbs_up' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
        END as positive_percentage,
        COUNT(CASE WHEN content_type = 'book' THEN 1 END) as book_feedback_count,
        COUNT(CASE WHEN content_type = 'page' THEN 1 END) as page_feedback_count
    FROM public.content_feedback;
END;
$$;

-- Enable RLS
ALTER TABLE "public"."content_feedback" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all feedback (for aggregate stats)
CREATE POLICY "Users can view all feedback" ON "public"."content_feedback"
    FOR SELECT USING (true);

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON "public"."content_feedback"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback" ON "public"."content_feedback"
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback" ON "public"."content_feedback"
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE "public"."content_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."content_feedback" TO "service_role"; 