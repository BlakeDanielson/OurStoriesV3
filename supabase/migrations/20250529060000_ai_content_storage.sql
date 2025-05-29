-- AI Content Storage Migration
-- This migration adds comprehensive storage for AI-generated content, conversation history, and analytics

-- Create enum types for AI content
CREATE TYPE "public"."ai_content_type" AS ENUM (
    'story_outline',
    'story_content',
    'story_revision',
    'character_description',
    'scene_description',
    'educational_content'
);

CREATE TYPE "public"."ai_provider" AS ENUM (
    'openai',
    'anthropic',
    'google',
    'custom'
);

CREATE TYPE "public"."conversation_entry_type" AS ENUM (
    'user_input',
    'ai_response',
    'system_message',
    'metadata'
);

CREATE TYPE "public"."analytics_event_type" AS ENUM (
    'content_generation',
    'content_revision',
    'user_interaction',
    'error_occurred',
    'performance_metric'
);

-- AI Generated Content table
CREATE TABLE IF NOT EXISTS "public"."ai_generated_content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "child_profile_id" "uuid",
    "book_id" "uuid",
    "content_type" "public"."ai_content_type" NOT NULL,
    "provider" "public"."ai_provider" NOT NULL,
    "model_name" "text" NOT NULL,
    "prompt_template_version" "text",
    "input_prompt" "text" NOT NULL,
    "raw_response" "text" NOT NULL,
    "parsed_content" "jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "quality_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "token_usage" "jsonb" DEFAULT '{}'::"jsonb",
    "generation_time_ms" integer,
    "cost_usd" numeric(10,6),
    "version" integer DEFAULT 1,
    "parent_content_id" "uuid", -- For revisions
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Conversation History table
CREATE TABLE IF NOT EXISTS "public"."conversation_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "child_profile_id" "uuid",
    "entry_type" "public"."conversation_entry_type" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "token_count" integer,
    "relevance_score" numeric(3,2),
    "sequence_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Conversation Sessions table
CREATE TABLE IF NOT EXISTS "public"."conversation_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "child_profile_id" "uuid",
    "session_name" "text",
    "context_summary" "text",
    "total_entries" integer DEFAULT 0,
    "total_tokens" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- User AI Preferences table
CREATE TABLE IF NOT EXISTS "public"."user_ai_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "child_profile_id" "uuid",
    "preferred_provider" "public"."ai_provider",
    "preferred_model" "text",
    "safety_level" "text" DEFAULT 'strict',
    "content_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "language_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "generation_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Analytics Events table
CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "child_profile_id" "uuid",
    "session_id" "uuid",
    "event_type" "public"."analytics_event_type" NOT NULL,
    "event_name" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "performance_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "error_details" "jsonb",
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Content Metadata table for enhanced search and categorization
CREATE TABLE IF NOT EXISTS "public"."content_metadata" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_table" "text" NOT NULL, -- 'ai_generated_content', 'books', etc.
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "keywords" "text"[] DEFAULT '{}'::"text"[],
    "reading_level" "text",
    "educational_topics" "text"[] DEFAULT '{}'::"text"[],
    "content_hash" "text", -- For duplicate detection
    "search_vector" "tsvector",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add primary keys
ALTER TABLE ONLY "public"."ai_generated_content"
    ADD CONSTRAINT "ai_generated_content_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_ai_preferences"
    ADD CONSTRAINT "user_ai_preferences_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."content_metadata"
    ADD CONSTRAINT "content_metadata_pkey" PRIMARY KEY ("id");

-- Add unique constraints
ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_session_sequence_key" UNIQUE ("session_id", "sequence_number");

ALTER TABLE ONLY "public"."user_ai_preferences"
    ADD CONSTRAINT "user_ai_preferences_user_child_key" UNIQUE ("user_id", "child_profile_id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."ai_generated_content"
    ADD CONSTRAINT "ai_generated_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ai_generated_content"
    ADD CONSTRAINT "ai_generated_content_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ai_generated_content"
    ADD CONSTRAINT "ai_generated_content_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ai_generated_content"
    ADD CONSTRAINT "ai_generated_content_parent_content_id_fkey" FOREIGN KEY ("parent_content_id") REFERENCES "public"."ai_generated_content"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conversation_history"
    ADD CONSTRAINT "conversation_history_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_ai_preferences"
    ADD CONSTRAINT "user_ai_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_ai_preferences"
    ADD CONSTRAINT "user_ai_preferences_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX "idx_ai_generated_content_user_id" ON "public"."ai_generated_content" USING "btree" ("user_id");
CREATE INDEX "idx_ai_generated_content_child_profile_id" ON "public"."ai_generated_content" USING "btree" ("child_profile_id");
CREATE INDEX "idx_ai_generated_content_book_id" ON "public"."ai_generated_content" USING "btree" ("book_id");
CREATE INDEX "idx_ai_generated_content_content_type" ON "public"."ai_generated_content" USING "btree" ("content_type");
CREATE INDEX "idx_ai_generated_content_provider" ON "public"."ai_generated_content" USING "btree" ("provider");
CREATE INDEX "idx_ai_generated_content_created_at" ON "public"."ai_generated_content" USING "btree" ("created_at");
CREATE INDEX "idx_ai_generated_content_is_active" ON "public"."ai_generated_content" USING "btree" ("is_active");
CREATE INDEX "idx_ai_generated_content_parent_content_id" ON "public"."ai_generated_content" USING "btree" ("parent_content_id");

CREATE INDEX "idx_conversation_history_session_id" ON "public"."conversation_history" USING "btree" ("session_id");
CREATE INDEX "idx_conversation_history_user_id" ON "public"."conversation_history" USING "btree" ("user_id");
CREATE INDEX "idx_conversation_history_child_profile_id" ON "public"."conversation_history" USING "btree" ("child_profile_id");
CREATE INDEX "idx_conversation_history_entry_type" ON "public"."conversation_history" USING "btree" ("entry_type");
CREATE INDEX "idx_conversation_history_created_at" ON "public"."conversation_history" USING "btree" ("created_at");
CREATE INDEX "idx_conversation_history_sequence_number" ON "public"."conversation_history" USING "btree" ("sequence_number");

CREATE INDEX "idx_conversation_sessions_user_id" ON "public"."conversation_sessions" USING "btree" ("user_id");
CREATE INDEX "idx_conversation_sessions_child_profile_id" ON "public"."conversation_sessions" USING "btree" ("child_profile_id");
CREATE INDEX "idx_conversation_sessions_is_active" ON "public"."conversation_sessions" USING "btree" ("is_active");
CREATE INDEX "idx_conversation_sessions_last_activity_at" ON "public"."conversation_sessions" USING "btree" ("last_activity_at");
CREATE INDEX "idx_conversation_sessions_expires_at" ON "public"."conversation_sessions" USING "btree" ("expires_at");

CREATE INDEX "idx_user_ai_preferences_user_id" ON "public"."user_ai_preferences" USING "btree" ("user_id");
CREATE INDEX "idx_user_ai_preferences_child_profile_id" ON "public"."user_ai_preferences" USING "btree" ("child_profile_id");

CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");
CREATE INDEX "idx_analytics_events_child_profile_id" ON "public"."analytics_events" USING "btree" ("child_profile_id");
CREATE INDEX "idx_analytics_events_session_id" ON "public"."analytics_events" USING "btree" ("session_id");
CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");
CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at");

CREATE INDEX "idx_content_metadata_content_id" ON "public"."content_metadata" USING "btree" ("content_id");
CREATE INDEX "idx_content_metadata_content_table" ON "public"."content_metadata" USING "btree" ("content_table");
CREATE INDEX "idx_content_metadata_tags" ON "public"."content_metadata" USING "gin" ("tags");
CREATE INDEX "idx_content_metadata_categories" ON "public"."content_metadata" USING "gin" ("categories");
CREATE INDEX "idx_content_metadata_keywords" ON "public"."content_metadata" USING "gin" ("keywords");
CREATE INDEX "idx_content_metadata_search_vector" ON "public"."content_metadata" USING "gin" ("search_vector");

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER "update_ai_generated_content_updated_at" 
    BEFORE UPDATE ON "public"."ai_generated_content" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_conversation_sessions_updated_at" 
    BEFORE UPDATE ON "public"."conversation_sessions" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_user_ai_preferences_updated_at" 
    BEFORE UPDATE ON "public"."user_ai_preferences" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "update_content_metadata_updated_at" 
    BEFORE UPDATE ON "public"."content_metadata" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Create function to update search vector for content metadata
CREATE OR REPLACE FUNCTION "public"."update_content_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.categories, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.keywords, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.educational_topics, ' '), '')
    );
    RETURN NEW;
END;
$$;

-- Create trigger for search vector updates
CREATE OR REPLACE TRIGGER "update_content_metadata_search_vector" 
    BEFORE INSERT OR UPDATE ON "public"."content_metadata" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_content_search_vector"();

-- Create function to cleanup expired conversation sessions
CREATE OR REPLACE FUNCTION "public"."cleanup_expired_conversations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Delete expired conversation sessions and their history
    WITH deleted_sessions AS (
        DELETE FROM public.conversation_sessions 
        WHERE expires_at < NOW() 
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_sessions;
    
    RETURN deleted_count;
END;
$$;

-- Create function to get AI content with metadata
CREATE OR REPLACE FUNCTION "public"."get_ai_content_with_metadata"(
    "user_id" "uuid", 
    "content_type_filter" "public"."ai_content_type" DEFAULT NULL,
    "child_profile_id_filter" "uuid" DEFAULT NULL,
    "limit_count" integer DEFAULT 50
) RETURNS TABLE(
    "id" "uuid",
    "content_type" "public"."ai_content_type",
    "provider" "public"."ai_provider",
    "model_name" "text",
    "parsed_content" "jsonb",
    "quality_scores" "jsonb",
    "metadata" "jsonb",
    "child_name" "text",
    "book_title" "text",
    "created_at" timestamp with time zone
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        agc.id,
        agc.content_type,
        agc.provider,
        agc.model_name,
        agc.parsed_content,
        agc.quality_scores,
        agc.metadata,
        cp.name as child_name,
        b.title as book_title,
        agc.created_at
    FROM public.ai_generated_content agc
    LEFT JOIN public.child_profiles cp ON agc.child_profile_id = cp.id
    LEFT JOIN public.books b ON agc.book_id = b.id
    WHERE agc.user_id = get_ai_content_with_metadata.user_id
    AND agc.is_active = true
    AND (content_type_filter IS NULL OR agc.content_type = content_type_filter)
    AND (child_profile_id_filter IS NULL OR agc.child_profile_id = child_profile_id_filter)
    ORDER BY agc.created_at DESC
    LIMIT limit_count;
END;
$$;

-- Create function to get conversation session with history
CREATE OR REPLACE FUNCTION "public"."get_conversation_with_history"(
    "session_id" "uuid",
    "user_id" "uuid"
) RETURNS TABLE(
    "session_id" "uuid",
    "session_name" "text",
    "context_summary" "text",
    "total_entries" integer,
    "last_activity_at" timestamp with time zone,
    "history" "jsonb"
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id as session_id,
        cs.session_name,
        cs.context_summary,
        cs.total_entries,
        cs.last_activity_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ch.id,
                    'entry_type', ch.entry_type,
                    'content', ch.content,
                    'metadata', ch.metadata,
                    'token_count', ch.token_count,
                    'relevance_score', ch.relevance_score,
                    'sequence_number', ch.sequence_number,
                    'created_at', ch.created_at
                ) ORDER BY ch.sequence_number
            ) FILTER (WHERE ch.id IS NOT NULL),
            '[]'::jsonb
        ) as history
    FROM public.conversation_sessions cs
    LEFT JOIN public.conversation_history ch ON cs.id = ch.session_id
    WHERE cs.id = get_conversation_with_history.session_id
    AND cs.user_id = get_conversation_with_history.user_id
    GROUP BY cs.id, cs.session_name, cs.context_summary, cs.total_entries, cs.last_activity_at;
END;
$$;

-- Create function to get analytics summary
CREATE OR REPLACE FUNCTION "public"."get_analytics_summary"(
    "user_id" "uuid",
    "start_date" timestamp with time zone DEFAULT (NOW() - INTERVAL '30 days'),
    "end_date" timestamp with time zone DEFAULT NOW()
) RETURNS TABLE(
    "total_generations" bigint,
    "total_cost_usd" numeric,
    "avg_generation_time_ms" numeric,
    "total_tokens_used" bigint,
    "most_used_provider" "text",
    "content_type_breakdown" "jsonb",
    "daily_usage" "jsonb"
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(agc.id) as total_generations,
        COALESCE(SUM(agc.cost_usd), 0) as total_cost_usd,
        COALESCE(AVG(agc.generation_time_ms), 0) as avg_generation_time_ms,
        COALESCE(SUM((agc.token_usage->>'total_tokens')::integer), 0) as total_tokens_used,
        (
            SELECT agc2.provider::text 
            FROM public.ai_generated_content agc2 
            WHERE agc2.user_id = get_analytics_summary.user_id
            AND agc2.created_at BETWEEN start_date AND end_date
            GROUP BY agc2.provider 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_used_provider,
        (
            SELECT jsonb_object_agg(content_type, count)
            FROM (
                SELECT agc3.content_type, COUNT(*) as count
                FROM public.ai_generated_content agc3
                WHERE agc3.user_id = get_analytics_summary.user_id
                AND agc3.created_at BETWEEN start_date AND end_date
                GROUP BY agc3.content_type
            ) ct
        ) as content_type_breakdown,
        (
            SELECT jsonb_object_agg(date_day, daily_count)
            FROM (
                SELECT DATE(agc4.created_at) as date_day, COUNT(*) as daily_count
                FROM public.ai_generated_content agc4
                WHERE agc4.user_id = get_analytics_summary.user_id
                AND agc4.created_at BETWEEN start_date AND end_date
                GROUP BY DATE(agc4.created_at)
                ORDER BY date_day
            ) daily
        ) as daily_usage
    FROM public.ai_generated_content agc
    WHERE agc.user_id = get_analytics_summary.user_id
    AND agc.created_at BETWEEN start_date AND end_date;
END;
$$;

-- Set table ownership
ALTER TABLE "public"."ai_generated_content" OWNER TO "postgres";
ALTER TABLE "public"."conversation_history" OWNER TO "postgres";
ALTER TABLE "public"."conversation_sessions" OWNER TO "postgres";
ALTER TABLE "public"."user_ai_preferences" OWNER TO "postgres";
ALTER TABLE "public"."analytics_events" OWNER TO "postgres";
ALTER TABLE "public"."content_metadata" OWNER TO "postgres";

-- Set function ownership
ALTER FUNCTION "public"."cleanup_expired_conversations"() OWNER TO "postgres";
ALTER FUNCTION "public"."get_ai_content_with_metadata"("uuid", "public"."ai_content_type", "uuid", integer) OWNER TO "postgres";
ALTER FUNCTION "public"."get_conversation_with_history"("uuid", "uuid") OWNER TO "postgres";
ALTER FUNCTION "public"."get_analytics_summary"("uuid", timestamp with time zone, timestamp with time zone) OWNER TO "postgres";
ALTER FUNCTION "public"."update_content_search_vector"() OWNER TO "postgres"; 