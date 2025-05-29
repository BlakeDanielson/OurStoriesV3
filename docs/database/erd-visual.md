# Visual Entity Relationship Diagram

## ourStories Database Schema - Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ourStories Database Schema                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│       Users         │         │   ChildProfiles     │         │       Books         │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ 🔑 id (UUID)        │◄────────┤ 🔑 id (UUID)        │         │ 🔑 id (UUID)        │
│ 📧 email            │    1:M  │ 🔗 user_id (FK)     │    1:M  │ 🔗 user_id (FK)     │
│ 👤 full_name        │         │ 👶 name             │◄────────┤ 🔗 child_profile_id │
│ 🖼️ avatar_url       │         │ 🎂 age              │  (opt)  │ 📖 title            │
│ 💳 subscription_tier│         │ 📚 reading_level    │         │ 📝 description      │
│ ⏰ subscription_exp │         │ 🎯 interests[]      │         │ 🎨 theme            │
│ ⚙️ preferences      │         │ 🦸 favorite_chars[] │         │ 📊 reading_level    │
│ 📅 created_at       │         │ 🎓 learning_goals[] │         │ ⚡ generation_status│
│ 🔄 updated_at       │         │ 🖼️ avatar_url       │         │ 📈 generation_prog  │
└─────────────────────┘         │ 🧠 personality_traits│        │ 🎨 style_preferences│
                                │ 📅 created_at       │         │ 💭 story_prompt     │
                                │ 🔄 updated_at       │         │ 📄 total_pages     │
                                └─────────────────────┘         │ ⏱️ estimated_read   │
                                                                │ 🌐 is_public        │
                                                                │ 🖼️ cover_image_url  │
                                                                │ 📅 created_at       │
                                                                │ 🔄 updated_at       │
                                                                │ ✅ completed_at     │
                                                                └─────────────────────┘
                                                                          │
                                                                          │ 1:M
                                                                          ▼
                                ┌─────────────────────┐         ┌─────────────────────┐
                                │   UserFeedback      │         │     BookPages       │
                                ├─────────────────────┤         ├─────────────────────┤
                                │ 🔑 id (UUID)        │         │ 🔑 id (UUID)        │
                                │ 🔗 user_id (FK)     │         │ 🔗 book_id (FK)     │
                                │ 🔗 child_profile_id │         │ 🔢 page_number      │
                                │ 🔗 book_id (FK)     │         │ 📝 content          │
                                │ ⭐ rating (1-5)     │         │ 🖼️ image_url        │
                                │ 💬 comment          │         │ 🎨 image_prompt     │
                                │ 📊 reading_progress │         │ ♿ alt_text         │
                                │ ⏱️ read_duration    │         │ ⚡ generation_status│
                                │ ❤️ favorite_page    │         │ 📅 created_at       │
                                │ 👍 would_recommend  │         │ 🔄 updated_at       │
                                │ 📅 created_at       │         └─────────────────────┘
                                │ 🔄 updated_at       │
                                └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Relationship Summary                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Users (1) ──────────── (M) ChildProfiles                                      │
│ Users (1) ──────────── (M) Books                                              │
│ Users (1) ──────────── (M) UserFeedback                                       │
│ ChildProfiles (1) ──── (M) Books (optional)                                   │
│ ChildProfiles (1) ──── (M) UserFeedback                                       │
│ Books (1) ──────────── (M) BookPages                                          │
│ Books (1) ──────────── (M) UserFeedback                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Supabase Integration                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 🔐 Auth: Users.id matches auth.users.id                                       │
│ 🛡️ RLS: Row Level Security on all tables                                      │
│ 📡 Real-time: Books table for generation status updates                       │
│ 💾 Storage: Image URLs point to Supabase Storage buckets                      │
│ 🔍 Indexes: Optimized for user_id, book_id, child_profile_id queries          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                Data Flow                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. User signs up → Users table created                                        │
│ 2. User creates child profile → ChildProfiles table                           │
│ 3. User requests story → Books table (status: pending)                        │
│ 4. AI generates story → BookPages table + image generation                    │
│ 5. Real-time updates → Books.generation_status changes                        │
│ 6. User reads story → UserFeedback table                                      │
│ 7. Images stored → Supabase Storage buckets                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. UUID Primary Keys

- **Why**: Better for distributed systems, no collision risk
- **Supabase**: Native UUID support with uuid_generate_v4()

### 2. JSONB for Flexible Data

- **preferences**: User settings that may evolve
- **personality_traits**: AI-specific child characteristics
- **style_preferences**: Art style choices for book generation

### 3. Array Types for Lists

- **interests[]**: Child's hobbies and interests
- **favorite_characters[]**: Preferred character types
- **learning_goals[]**: Educational objectives

### 4. Enum Types for Controlled Values

- **subscription_tier**: free, premium, family
- **reading_level**: beginner, intermediate, advanced
- **generation_status**: pending, generating, completed, failed

### 5. Timestamp Tracking

- **created_at**: When record was created
- **updated_at**: Last modification time
- **completed_at**: When book generation finished

### 6. Optional Relationships

- **child_profile_id** in Books: Books can be created without specific child
- **child_profile_id** in UserFeedback: Feedback can be general or child-specific

### 7. Progress Tracking

- **generation_progress**: 0-100% for real-time updates
- **reading_progress**: Track how much child has read

### 8. Security Considerations

- **RLS Policies**: Ensure data isolation between users
- **Child Data Protection**: Special handling for children's information
- **Content Moderation**: Family-friendly content validation
