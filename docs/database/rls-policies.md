# Row Level Security (RLS) Policies

This document describes the Row Level Security policies implemented in the ourStories database to ensure proper data isolation and security.

## Overview

Row Level Security (RLS) is enabled on all tables in the ourStories database to ensure that users can only access data they own or are authorized to view. This provides multi-tenant data isolation at the database level.

## Security Model

### Core Principles

1. **User Isolation**: Users can only access their own data
2. **Parent-Child Relationship**: Parents can access their children's data
3. **Admin Override**: Admin users can access all data for support purposes
4. **Authenticated Access**: All operations require valid authentication

### Authentication Integration

- Uses Supabase Auth with `auth.uid()` function
- User IDs in the `users` table match `auth.users.id`
- All policies check authentication state before granting access

## Table-by-Table Policy Breakdown

### 1. Users Table

**Purpose**: Store user profile information extending Supabase auth.users

**RLS Policies**:

```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON "public"."users"
FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON "public"."users"
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON "public"."users"
FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON "public"."users"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'admin'
));
```

**Security Features**:

- ✅ Users can only access their own profile data
- ✅ Profile creation is restricted to authenticated users
- ✅ Admin users can view all profiles for support
- ❌ Users cannot view other user profiles
- ❌ Users cannot modify other user profiles

### 2. Child Profiles Table

**Purpose**: Store information about children for personalized content

**RLS Policies**:

```sql
-- Parents can view their children's profiles
CREATE POLICY "Parents can view their children's profiles" ON "public"."child_profiles"
FOR SELECT USING (auth.uid() = parent_id);

-- Parents can create children's profiles
CREATE POLICY "Parents can create children's profiles" ON "public"."child_profiles"
FOR INSERT WITH CHECK (auth.uid() = parent_id);

-- Parents can update their children's profiles
CREATE POLICY "Parents can update their children's profiles" ON "public"."child_profiles"
FOR UPDATE USING (auth.uid() = parent_id);

-- Parents can delete their children's profiles
CREATE POLICY "Parents can delete their children's profiles" ON "public"."child_profiles"
FOR DELETE USING (auth.uid() = parent_id);

-- Admins can view all child profiles
CREATE POLICY "Admins can view all child profiles" ON "public"."child_profiles"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'admin'
));
```

**Security Features**:

- ✅ Parents can manage their own children's profiles
- ✅ Complete CRUD operations for owned profiles
- ✅ Admin oversight for support purposes
- ❌ Parents cannot access other families' children
- ❌ Cross-family data access is prevented

### 3. Books Table

**Purpose**: Store generated storybooks and metadata

**RLS Policies**:

```sql
-- Users can view books for their children
CREATE POLICY "Users can view books for their children" ON "public"."books"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.child_profiles cp
  WHERE cp.id = books.child_profile_id AND cp.parent_id = auth.uid()
));

-- Users can create books for their children
CREATE POLICY "Users can create books for their children" ON "public"."books"
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.child_profiles cp
  WHERE cp.id = books.child_profile_id AND cp.parent_id = auth.uid()
));

-- Users can update books for their children
CREATE POLICY "Users can update books for their children" ON "public"."books"
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.child_profiles cp
  WHERE cp.id = books.child_profile_id AND cp.parent_id = auth.uid()
));

-- Users can delete books for their children
CREATE POLICY "Users can delete books for their children" ON "public"."books"
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.child_profiles cp
  WHERE cp.id = books.child_profile_id AND cp.parent_id = auth.uid()
));

-- Admins can view all books
CREATE POLICY "Admins can view all books" ON "public"."books"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'admin'
));
```

**Security Features**:

- ✅ Books are accessible only through child ownership
- ✅ Indirect access control via child_profiles relationship
- ✅ Full CRUD operations for owned books
- ✅ Admin access for content moderation
- ❌ Direct book access without child ownership
- ❌ Cross-family book access

### 4. Book Pages Table

**Purpose**: Store individual pages within books

**RLS Policies**:

```sql
-- Users can view pages of their children's books
CREATE POLICY "Users can view pages of their children's books" ON "public"."book_pages"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.books b
  JOIN public.child_profiles cp ON b.child_profile_id = cp.id
  WHERE b.id = book_pages.book_id AND cp.parent_id = auth.uid()
));

-- Users can create pages for their children's books
CREATE POLICY "Users can create pages for their children's books" ON "public"."book_pages"
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.books b
  JOIN public.child_profiles cp ON b.child_profile_id = cp.id
  WHERE b.id = book_pages.book_id AND cp.parent_id = auth.uid()
));

-- Users can update pages of their children's books
CREATE POLICY "Users can update pages of their children's books" ON "public"."book_pages"
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.books b
  JOIN public.child_profiles cp ON b.child_profile_id = cp.id
  WHERE b.id = book_pages.book_id AND cp.parent_id = auth.uid()
));

-- Users can delete pages of their children's books
CREATE POLICY "Users can delete pages of their children's books" ON "public"."book_pages"
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.books b
  JOIN public.child_profiles cp ON b.child_profile_id = cp.id
  WHERE b.id = book_pages.book_id AND cp.parent_id = auth.uid()
));

-- Admins can view all book pages
CREATE POLICY "Admins can view all book pages" ON "public"."book_pages"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'admin'
));
```

**Security Features**:

- ✅ Two-level relationship security (book → child → parent)
- ✅ Comprehensive JOIN-based access control
- ✅ Full CRUD operations for owned content
- ✅ Admin content moderation access
- ❌ Direct page access without ownership chain
- ❌ Cross-family page content access

### 5. User Feedback Table

**Purpose**: Track reading progress and user ratings

**RLS Policies**:

```sql
-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON "public"."user_feedback"
FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback" ON "public"."user_feedback"
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback" ON "public"."user_feedback"
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback" ON "public"."user_feedback"
FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON "public"."user_feedback"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'admin'
));
```

**Security Features**:

- ✅ Users own their feedback data
- ✅ Simple user_id-based access control
- ✅ Full CRUD operations for owned feedback
- ✅ Admin access for analytics and support
- ❌ Users cannot view others' feedback
- ❌ Cross-user feedback manipulation

## Admin Role Privileges

### Admin Access Patterns

Admin users (with `role = 'admin'`) have special privileges:

1. **Read Access**: Can view all data across all tables
2. **Support Operations**: Can access user data for troubleshooting
3. **Content Moderation**: Can review generated content
4. **Analytics**: Can access aggregated user data

### Admin Policy Pattern

```sql
CREATE POLICY "Admins can view all [table]" ON "public"."[table]"
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = auth.uid() AND u.role = 'admin'
));
```

## Security Testing

### Automated Testing

The project includes comprehensive RLS policy testing:

```bash
# Run RLS policy tests
npm run test:rls

# Test specific scenarios
node scripts/test-rls.js
```

### Test Coverage

The test suite validates:

- ✅ User isolation across all tables
- ✅ Parent-child relationship enforcement
- ✅ Admin privilege escalation
- ✅ CRUD operation restrictions
- ✅ Cross-user access prevention
- ✅ Authentication requirement enforcement

### Test Scenarios

1. **Positive Tests**: Verify authorized access works
2. **Negative Tests**: Verify unauthorized access is blocked
3. **Edge Cases**: Test boundary conditions and error states
4. **Admin Tests**: Verify admin override functionality

## Performance Considerations

### Index Strategy

RLS policies are optimized with strategic indexing:

```sql
-- User-based access patterns
CREATE INDEX idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX idx_books_child_profile_id ON books(child_profile_id);
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);

-- Admin role lookups
CREATE INDEX idx_users_role ON users(role);
```

### Query Optimization

- Policies use efficient JOIN patterns
- Subqueries are optimized for performance
- Indexes support policy filter conditions
- Admin checks are cached where possible

## Troubleshooting

### Common Issues

1. **Access Denied Errors**

   - Verify user authentication
   - Check auth.uid() returns valid UUID
   - Confirm user role assignments

2. **Policy Not Applied**

   - Ensure RLS is enabled on table
   - Verify policy syntax and conditions
   - Check for conflicting policies

3. **Performance Issues**
   - Review query execution plans
   - Ensure proper indexing
   - Optimize JOIN conditions

### Debugging Tools

```sql
-- Check current user
SELECT auth.uid();

-- Verify user role
SELECT role FROM users WHERE id = auth.uid();

-- Test policy conditions
SELECT EXISTS (
  SELECT 1 FROM child_profiles cp
  WHERE cp.parent_id = auth.uid()
);
```

## Best Practices

### Policy Design

1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Consistent Patterns**: Use similar policy structures across tables
3. **Clear Naming**: Use descriptive policy names
4. **Documentation**: Comment complex policy logic

### Development Workflow

1. **Test Early**: Validate policies during development
2. **Automated Testing**: Include RLS tests in CI/CD
3. **Regular Audits**: Review policies for security gaps
4. **Performance Monitoring**: Track policy impact on queries

### Security Guidelines

1. **Never Bypass RLS**: Always use authenticated clients
2. **Validate Inputs**: Sanitize data before database operations
3. **Monitor Access**: Log and audit data access patterns
4. **Regular Updates**: Keep policies current with schema changes

## Migration and Maintenance

### Schema Changes

When modifying tables:

1. Update RLS policies to match new columns
2. Test policy effectiveness with new schema
3. Update documentation and tests
4. Verify performance impact

### Policy Updates

When updating policies:

1. Test in development environment first
2. Validate with comprehensive test suite
3. Monitor performance after deployment
4. Document changes and rationale

This RLS implementation provides robust security for the ourStories platform while maintaining good performance and usability.
