// Type definitions will be exported here
// Example: export type { User } from './user'
// Example: export type { Story } from './story'
// Example: export type { Character } from './character'

// Empty export to make this a valid module
export {}

// Database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  User,
  ChildProfile,
  Book,
  BookPage,
  UserFeedback,
  BookStatus,
  ReadingStatus,
  UserRole,
} from './database'

// Auth types
export type {
  User as SupabaseUser,
  Session,
  DatabaseUser,
  DatabaseUserInsert,
  DatabaseUserUpdate,
  AuthenticatedUser,
  AuthState,
  AuthErrorType,
  AuthResult,
  OAuthProvider,
  AuthActions,
  SessionExpiryInfo,
  SessionManagerConfig,
  UserMetadata,
  COPPAData,
  AuthContextType,
  RouteConfig,
  AuthMiddlewareResult,
  SignInFormData,
  SignUpFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
  ValidationRule,
  ValidationRules,
  AuthConfig,
  OAuthConfig,
  EmailTemplateConfig,
  StoredSession,
  AuthEventType,
  AuthEvent,
  AuthOperation,
  AuthOperationResult,
  AuthErrorDetails,
  AuthProviderConfig,
} from './auth'

// Auth utilities
export {
  AuthError,
  isAuthenticatedUser,
  hasValidSession,
  isOAuthProvider,
  isValidUserRole,
} from './auth'
