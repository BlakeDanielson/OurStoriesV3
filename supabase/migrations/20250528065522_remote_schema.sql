

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."book_status" AS ENUM (
    'draft',
    'generating',
    'completed',
    'failed'
);


ALTER TYPE "public"."book_status" OWNER TO "postgres";


CREATE TYPE "public"."reading_status" AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."reading_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'parent',
    'child',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_books_with_progress"("user_id" "uuid", "child_profile_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "status" "public"."book_status", "cover_image_url" "text", "total_pages" integer, "estimated_reading_time" integer, "genre" "text", "themes" "text"[], "child_name" "text", "child_id" "uuid", "reading_status" "public"."reading_status", "rating" integer, "reading_progress" "jsonb", "created_at" timestamp with time zone, "completed_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.status,
        b.cover_image_url,
        b.total_pages,
        b.estimated_reading_time,
        b.genre,
        b.themes,
        cp.name as child_name,
        cp.id as child_id,
        COALESCE(uf.reading_status, 'not_started'::reading_status) as reading_status,
        uf.rating,
        COALESCE(uf.reading_progress, '{}'::jsonb) as reading_progress,
        b.created_at,
        b.completed_at
    FROM public.books b
    JOIN public.child_profiles cp ON b.child_profile_id = cp.id
    LEFT JOIN public.user_feedback uf ON b.id = uf.book_id AND uf.user_id = get_books_with_progress.user_id
    WHERE cp.parent_id = get_books_with_progress.user_id
    AND (get_books_with_progress.child_profile_id IS NULL OR cp.id = get_books_with_progress.child_profile_id)
    ORDER BY b.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_books_with_progress"("user_id" "uuid", "child_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_children_with_book_counts"("parent_user_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "age" integer, "interests" "text"[], "favorite_characters" "text"[], "reading_level" "text", "avatar_url" "text", "book_count" bigint, "completed_books" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.name,
        cp.age,
        cp.interests,
        cp.favorite_characters,
        cp.reading_level,
        cp.avatar_url,
        COUNT(b.id) as book_count,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_books,
        cp.created_at
    FROM public.child_profiles cp
    LEFT JOIN public.books b ON cp.id = b.child_profile_id
    WHERE cp.parent_id = parent_user_id
    GROUP BY cp.id, cp.name, cp.age, cp.interests, cp.favorite_characters, 
             cp.reading_level, cp.avatar_url, cp.created_at
    ORDER BY cp.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_children_with_book_counts"("parent_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_reading_statistics"("user_id" "uuid") RETURNS TABLE("total_books" bigint, "completed_books" bigint, "in_progress_books" bigint, "total_children" bigint, "favorite_genres" "text"[], "total_reading_time" integer, "books_this_month" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT b.id) as total_books,
        COUNT(DISTINCT CASE WHEN uf.reading_status = 'completed' THEN b.id END) as completed_books,
        COUNT(DISTINCT CASE WHEN uf.reading_status = 'in_progress' THEN b.id END) as in_progress_books,
        COUNT(DISTINCT cp.id) as total_children,
        ARRAY_AGG(DISTINCT b.genre) FILTER (WHERE b.genre IS NOT NULL) as favorite_genres,
        COALESCE(SUM(b.estimated_reading_time), 0)::INTEGER as total_reading_time,
        COUNT(DISTINCT CASE WHEN b.created_at >= DATE_TRUNC('month', NOW()) THEN b.id END) as books_this_month
    FROM public.child_profiles cp
    LEFT JOIN public.books b ON cp.id = b.child_profile_id
    LEFT JOIN public.user_feedback uf ON b.id = uf.book_id AND uf.user_id = get_reading_statistics.user_id
    WHERE cp.parent_id = get_reading_statistics.user_id;
END;
$$;


ALTER FUNCTION "public"."get_reading_statistics"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_books"("user_id" "uuid", "search_term" "text", "genre_filter" "text" DEFAULT NULL::"text", "child_filter" "uuid" DEFAULT NULL::"uuid", "status_filter" "public"."book_status" DEFAULT NULL::"public"."book_status") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "status" "public"."book_status", "cover_image_url" "text", "genre" "text", "child_name" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.status,
        b.cover_image_url,
        b.genre,
        cp.name as child_name,
        b.created_at
    FROM public.books b
    JOIN public.child_profiles cp ON b.child_profile_id = cp.id
    WHERE cp.parent_id = search_books.user_id
    AND (search_term IS NULL OR 
         b.title ILIKE '%' || search_term || '%' OR 
         b.description ILIKE '%' || search_term || '%' OR
         cp.name ILIKE '%' || search_term || '%')
    AND (genre_filter IS NULL OR b.genre = genre_filter)
    AND (child_filter IS NULL OR cp.id = child_filter)
    AND (status_filter IS NULL OR b.status = status_filter)
    ORDER BY b.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."search_books"("user_id" "uuid", "search_term" "text", "genre_filter" "text", "child_filter" "uuid", "status_filter" "public"."book_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_book_status"("book_id" "uuid", "new_status" "public"."book_status", "total_pages_count" integer DEFAULT NULL::integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    book_owner UUID;
BEGIN
    -- Check if user owns this book
    SELECT cp.parent_id INTO book_owner
    FROM public.books b
    JOIN public.child_profiles cp ON b.child_profile_id = cp.id
    WHERE b.id = book_id;
    
    IF book_owner != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: You do not own this book';
    END IF;
    
    -- Update the book status
    UPDATE public.books 
    SET 
        status = new_status,
        total_pages = COALESCE(total_pages_count, total_pages),
        completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = book_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_book_status"("book_id" "uuid", "new_status" "public"."book_status", "total_pages_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."book_pages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "book_id" "uuid" NOT NULL,
    "page_number" integer NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "image_prompt" "text",
    "audio_url" "text",
    "page_type" "text" DEFAULT 'story'::"text",
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."book_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "child_profile_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."book_status" DEFAULT 'draft'::"public"."book_status",
    "cover_image_url" "text",
    "total_pages" integer DEFAULT 0,
    "estimated_reading_time" integer,
    "genre" "text",
    "themes" "text"[] DEFAULT '{}'::"text"[],
    "ai_prompt" "text",
    "generation_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."child_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "interests" "text"[] DEFAULT '{}'::"text"[],
    "favorite_characters" "text"[] DEFAULT '{}'::"text"[],
    "reading_level" "text",
    "avatar_url" "text",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "child_profiles_age_check" CHECK ((("age" >= 0) AND ("age" <= 18)))
);


ALTER TABLE "public"."child_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "child_profile_id" "uuid",
    "rating" integer,
    "comment" "text",
    "reading_status" "public"."reading_status" DEFAULT 'not_started'::"public"."reading_status",
    "reading_progress" "jsonb" DEFAULT '{}'::"jsonb",
    "favorite_pages" integer[] DEFAULT '{}'::integer[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'parent'::"public"."user_role",
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."book_pages"
    ADD CONSTRAINT "book_pages_book_id_page_number_key" UNIQUE ("book_id", "page_number");



ALTER TABLE ONLY "public"."book_pages"
    ADD CONSTRAINT "book_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."child_profiles"
    ADD CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_book_id_key" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_book_pages_book_id" ON "public"."book_pages" USING "btree" ("book_id");



CREATE INDEX "idx_book_pages_page_number" ON "public"."book_pages" USING "btree" ("page_number");



CREATE INDEX "idx_books_child_profile_id" ON "public"."books" USING "btree" ("child_profile_id");



CREATE INDEX "idx_books_created_at" ON "public"."books" USING "btree" ("created_at");



CREATE INDEX "idx_books_genre" ON "public"."books" USING "btree" ("genre");



CREATE INDEX "idx_books_status" ON "public"."books" USING "btree" ("status");



CREATE INDEX "idx_child_profiles_age" ON "public"."child_profiles" USING "btree" ("age");



CREATE INDEX "idx_child_profiles_parent_id" ON "public"."child_profiles" USING "btree" ("parent_id");



CREATE INDEX "idx_user_feedback_book_id" ON "public"."user_feedback" USING "btree" ("book_id");



CREATE INDEX "idx_user_feedback_child_profile_id" ON "public"."user_feedback" USING "btree" ("child_profile_id");



CREATE INDEX "idx_user_feedback_rating" ON "public"."user_feedback" USING "btree" ("rating");



CREATE INDEX "idx_user_feedback_user_id" ON "public"."user_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "update_book_pages_updated_at" BEFORE UPDATE ON "public"."book_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_books_updated_at" BEFORE UPDATE ON "public"."books" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_child_profiles_updated_at" BEFORE UPDATE ON "public"."child_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_feedback_updated_at" BEFORE UPDATE ON "public"."user_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."book_pages"
    ADD CONSTRAINT "book_pages_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."child_profiles"
    ADD CONSTRAINT "child_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view all book pages" ON "public"."book_pages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all books" ON "public"."books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all child profiles" ON "public"."child_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all feedback" ON "public"."user_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all users" ON "public"."users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Parents can create children's profiles" ON "public"."child_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can delete their children's profiles" ON "public"."child_profiles" FOR DELETE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can update their children's profiles" ON "public"."child_profiles" FOR UPDATE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can view their children's profiles" ON "public"."child_profiles" FOR SELECT USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Users can create books for their children" ON "public"."books" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."child_profiles" "cp"
  WHERE (("cp"."id" = "books"."child_profile_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can create pages for their children's books" ON "public"."book_pages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."books" "b"
     JOIN "public"."child_profiles" "cp" ON (("b"."child_profile_id" = "cp"."id")))
  WHERE (("b"."id" = "book_pages"."book_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own feedback" ON "public"."user_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete books for their children" ON "public"."books" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."child_profiles" "cp"
  WHERE (("cp"."id" = "books"."child_profile_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete pages of their children's books" ON "public"."book_pages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."books" "b"
     JOIN "public"."child_profiles" "cp" ON (("b"."child_profile_id" = "cp"."id")))
  WHERE (("b"."id" = "book_pages"."book_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own feedback" ON "public"."user_feedback" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update books for their children" ON "public"."books" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."child_profiles" "cp"
  WHERE (("cp"."id" = "books"."child_profile_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can update pages of their children's books" ON "public"."book_pages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."books" "b"
     JOIN "public"."child_profiles" "cp" ON (("b"."child_profile_id" = "cp"."id")))
  WHERE (("b"."id" = "book_pages"."book_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own feedback" ON "public"."user_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view books for their children" ON "public"."books" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."child_profiles" "cp"
  WHERE (("cp"."id" = "books"."child_profile_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can view pages of their children's books" ON "public"."book_pages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."books" "b"
     JOIN "public"."child_profiles" "cp" ON (("b"."child_profile_id" = "cp"."id")))
  WHERE (("b"."id" = "book_pages"."book_id") AND ("cp"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own feedback" ON "public"."user_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."book_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_books_with_progress"("user_id" "uuid", "child_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_books_with_progress"("user_id" "uuid", "child_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_books_with_progress"("user_id" "uuid", "child_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_children_with_book_counts"("parent_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_children_with_book_counts"("parent_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_children_with_book_counts"("parent_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reading_statistics"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_reading_statistics"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reading_statistics"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_books"("user_id" "uuid", "search_term" "text", "genre_filter" "text", "child_filter" "uuid", "status_filter" "public"."book_status") TO "anon";
GRANT ALL ON FUNCTION "public"."search_books"("user_id" "uuid", "search_term" "text", "genre_filter" "text", "child_filter" "uuid", "status_filter" "public"."book_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_books"("user_id" "uuid", "search_term" "text", "genre_filter" "text", "child_filter" "uuid", "status_filter" "public"."book_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_book_status"("book_id" "uuid", "new_status" "public"."book_status", "total_pages_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_status"("book_id" "uuid", "new_status" "public"."book_status", "total_pages_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_status"("book_id" "uuid", "new_status" "public"."book_status", "total_pages_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."book_pages" TO "anon";
GRANT ALL ON TABLE "public"."book_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."book_pages" TO "service_role";



GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."child_profiles" TO "anon";
GRANT ALL ON TABLE "public"."child_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."child_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
