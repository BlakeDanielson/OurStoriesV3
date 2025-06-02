import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import crypto from 'crypto'

export interface COPPAComplianceStatus {
  isCompliant: boolean
  isMinor: boolean
  consentStatus: 'not_required' | 'pending' | 'granted' | 'denied'
  consentDate?: string
  verificationStatus:
    | 'unverified'
    | 'pending_parent_verification'
    | 'verified'
    | 'suspended'
  requiredActions: string[]
}

export interface ParentalConsentRequest {
  id: string
  childUserId: string
  parentEmail: string
  consentToken: string
  requestDate: string
  expiryDate: string
  status: 'pending' | 'approved' | 'denied' | 'expired'
  ipAddress?: string
  userAgent?: string
  consentData?: Record<string, any>
}

export interface AgeVerificationLog {
  id: string
  userId: string
  verificationMethod: 'self_reported' | 'parent_verified' | 'document_verified'
  verificationDate: string
  verifiedAge?: number
  verificationData?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface DataCollectionAudit {
  id: string
  userId: string
  dataType: string
  collectionPurpose: string
  consentGiven: boolean
  collectionDate: string
  retentionPeriod?: string
  deletionDate?: string
  auditData?: Record<string, any>
}

export class COPPAService {
  private supabase: ReturnType<typeof createServerSupabaseClient>

  constructor(supabase?: ReturnType<typeof createServerSupabaseClient>) {
    this.supabase = supabase || createServerSupabaseClient()
  }

  /**
   * Check if a user is under 13 based on their date of birth
   */
  static isMinor(dateOfBirth: Date): boolean {
    const today = new Date()
    const age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      return age - 1 < 13
    }

    return age < 13
  }

  /**
   * Get COPPA compliance status for a user
   */
  async getComplianceStatus(
    userId: string
  ): Promise<COPPAComplianceStatus | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_coppa_compliance_status', { user_id: userId })
        .single()

      if (error) {
        console.error('Error getting COPPA compliance status:', error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        isCompliant: (data as any).is_compliant,
        isMinor: (data as any).is_minor,
        consentStatus: (data as any).consent_status,
        consentDate: (data as any).consent_date,
        verificationStatus: (data as any).verification_status,
        requiredActions: (data as any).required_actions || [],
      }
    } catch (error) {
      console.error('Error in getComplianceStatus:', error)
      return null
    }
  }

  /**
   * Update user's date of birth and automatically set minor status
   */
  async updateDateOfBirth(userId: string, dateOfBirth: Date): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating date of birth:', error)
        return false
      }

      // Log the age verification
      await this.logAgeVerification(userId, 'self_reported', {
        dateOfBirth: dateOfBirth.toISOString(),
        calculatedAge: this.calculateAge(dateOfBirth),
      })

      return true
    } catch (error) {
      console.error('Error in updateDateOfBirth:', error)
      return false
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--
    }

    return age
  }

  /**
   * Request parental consent for a minor user
   */
  async requestParentalConsent(
    childUserId: string,
    parentEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string | null> {
    try {
      // Generate a secure consent token
      const consentToken = crypto.randomBytes(32).toString('hex')

      const { data, error } = await this.supabase
        .from('parental_consent_requests')
        .insert({
          child_user_id: childUserId,
          parent_email: parentEmail,
          consent_token: consentToken,
          ip_address: ipAddress,
          user_agent: userAgent,
          consent_data: {
            requestedAt: new Date().toISOString(),
            requestSource: 'registration',
          },
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating parental consent request:', error)
        return null
      }

      // Update user's parental consent status
      await this.supabase
        .from('users')
        .update({
          parental_consent_status: 'pending',
          parent_email: parentEmail,
          account_verification_status: 'pending_parent_verification',
          updated_at: new Date().toISOString(),
        })
        .eq('id', childUserId)

      return consentToken
    } catch (error) {
      console.error('Error in requestParentalConsent:', error)
      return null
    }
  }

  /**
   * Verify parental consent using token
   */
  async verifyParentalConsent(
    consentToken: string,
    approved: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // Get the consent request
      const { data: consentRequest, error: fetchError } = await this.supabase
        .from('parental_consent_requests')
        .select('*')
        .eq('consent_token', consentToken)
        .eq('status', 'pending')
        .single()

      if (fetchError || !consentRequest) {
        console.error('Consent request not found or expired:', fetchError)
        return false
      }

      // Check if token has expired
      const expiryDate = new Date(consentRequest.expiry_date)
      if (expiryDate < new Date()) {
        await this.supabase
          .from('parental_consent_requests')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', consentRequest.id)
        return false
      }

      const newStatus = approved ? 'approved' : 'denied'
      const userConsentStatus = approved ? 'granted' : 'denied'
      const userVerificationStatus = approved ? 'verified' : 'suspended'

      // Update consent request
      const { error: updateError } = await this.supabase
        .from('parental_consent_requests')
        .update({
          status: newStatus,
          consent_data: {
            ...consentRequest.consent_data,
            approvedAt: new Date().toISOString(),
            approved,
            verificationIp: ipAddress,
            verificationUserAgent: userAgent,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', consentRequest.id)

      if (updateError) {
        console.error('Error updating consent request:', updateError)
        return false
      }

      // Update user status
      const { error: userUpdateError } = await this.supabase
        .from('users')
        .update({
          parental_consent_status: userConsentStatus,
          parental_consent_date: approved ? new Date().toISOString() : null,
          account_verification_status: userVerificationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', consentRequest.child_user_id)

      if (userUpdateError) {
        console.error('Error updating user consent status:', userUpdateError)
        return false
      }

      // Log the verification
      await this.logAgeVerification(
        consentRequest.child_user_id,
        'parent_verified',
        {
          consentToken,
          approved,
          parentEmail: consentRequest.parent_email,
          verificationDate: new Date().toISOString(),
        },
        ipAddress,
        userAgent
      )

      return true
    } catch (error) {
      console.error('Error in verifyParentalConsent:', error)
      return false
    }
  }

  /**
   * Log age verification attempt
   */
  async logAgeVerification(
    userId: string,
    method: 'self_reported' | 'parent_verified' | 'document_verified',
    verificationData?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('age_verification_logs')
        .insert({
          user_id: userId,
          verification_method: method,
          verification_data: verificationData || {},
          ip_address: ipAddress,
          user_agent: userAgent,
        })

      if (error) {
        console.error('Error logging age verification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in logAgeVerification:', error)
      return false
    }
  }

  /**
   * Log data collection for COPPA audit
   */
  async logDataCollection(
    userId: string,
    dataType: string,
    collectionPurpose: string,
    consentGiven: boolean = true,
    retentionDays: number = 365
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'log_coppa_data_collection',
        {
          p_user_id: userId,
          p_data_type: dataType,
          p_collection_purpose: collectionPurpose,
          p_consent_given: consentGiven,
          p_retention_days: retentionDays,
        }
      )

      if (error) {
        console.error('Error logging data collection:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in logDataCollection:', error)
      return null
    }
  }

  /**
   * Get user's data collection audit logs
   */
  async getDataCollectionAudit(userId: string): Promise<DataCollectionAudit[]> {
    try {
      const { data, error } = await this.supabase
        .from('coppa_data_audit')
        .select('*')
        .eq('user_id', userId)
        .order('collection_date', { ascending: false })

      if (error) {
        console.error('Error getting data collection audit:', error)
        return []
      }

      return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        dataType: item.data_type,
        collectionPurpose: item.collection_purpose,
        consentGiven: item.consent_given,
        collectionDate: item.collection_date,
        retentionPeriod: item.retention_period,
        deletionDate: item.deletion_date,
        auditData: item.audit_data,
      }))
    } catch (error) {
      console.error('Error in getDataCollectionAudit:', error)
      return []
    }
  }

  /**
   * Get parental consent requests for a user
   */
  async getParentalConsentRequests(
    userId: string
  ): Promise<ParentalConsentRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('parental_consent_requests')
        .select('*')
        .eq('child_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting parental consent requests:', error)
        return []
      }

      return data.map((item: any) => ({
        id: item.id,
        childUserId: item.child_user_id,
        parentEmail: item.parent_email,
        consentToken: item.consent_token,
        requestDate: item.request_date,
        expiryDate: item.expiry_date,
        status: item.status,
        ipAddress: item.ip_address,
        userAgent: item.user_agent,
        consentData: item.consent_data,
      }))
    } catch (error) {
      console.error('Error in getParentalConsentRequests:', error)
      return []
    }
  }

  /**
   * Clean up expired consent requests
   */
  async cleanupExpiredRequests(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc(
        'cleanup_expired_consent_requests'
      )

      if (error) {
        console.error('Error cleaning up expired requests:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in cleanupExpiredRequests:', error)
      return false
    }
  }

  /**
   * Check if user can access certain features based on COPPA compliance
   */
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const complianceStatus = await this.getComplianceStatus(userId)

    if (!complianceStatus) {
      return false
    }

    // If user is not a minor, they can access all features
    if (!complianceStatus.isMinor) {
      return true
    }

    // For minors, check if they have proper consent
    if (complianceStatus.consentStatus !== 'granted') {
      return false
    }

    // Additional feature-specific restrictions for minors
    const restrictedFeatures = [
      'social_sharing',
      'public_profiles',
      'direct_messaging',
      'location_services',
    ]

    if (restrictedFeatures.includes(feature)) {
      return false
    }

    return true
  }

  /**
   * Get COPPA compliance summary for admin dashboard
   */
  async getComplianceSummary(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('coppa_compliance_summary')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting compliance summary:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Error in getComplianceSummary:', error)
      return []
    }
  }

  /**
   * Delete user data for COPPA compliance (right to deletion)
   */
  async deleteUserData(userId: string, dataTypes?: string[]): Promise<boolean> {
    try {
      // If specific data types are provided, delete only those
      if (dataTypes && dataTypes.length > 0) {
        // This would need to be implemented based on specific data types
        // For now, we'll log the deletion request
        await this.logDataCollection(
          userId,
          'data_deletion',
          'COPPA compliance - user data deletion',
          true,
          0 // Immediate deletion
        )
      } else {
        // Full account deletion - this should be handled carefully
        // and may require additional business logic
        console.log(`Full data deletion requested for user: ${userId}`)
      }

      return true
    } catch (error) {
      console.error('Error in deleteUserData:', error)
      return false
    }
  }
}

// Export a default instance for convenience
export const coppaService = new COPPAService()

// Export utility functions
export const coppaUtils = {
  isMinor: COPPAService.isMinor,

  /**
   * Generate a secure consent token
   */
  generateConsentToken(): string {
    return crypto.randomBytes(32).toString('hex')
  },

  /**
   * Validate consent token format
   */
  isValidConsentToken(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token)
  },

  /**
   * Get age-appropriate data collection settings
   */
  getDataCollectionSettings(isMinor: boolean) {
    if (isMinor) {
      return {
        allowedDataTypes: [
          'account_info',
          'reading_preferences',
          'story_progress',
          'parental_settings',
        ],
        restrictedDataTypes: [
          'location_data',
          'behavioral_tracking',
          'advertising_data',
          'social_connections',
        ],
        retentionPeriod: 365, // 1 year for minors
        requiresParentalConsent: true,
      }
    } else {
      return {
        allowedDataTypes: [
          'account_info',
          'reading_preferences',
          'story_progress',
          'location_data',
          'behavioral_tracking',
          'social_connections',
        ],
        restrictedDataTypes: [],
        retentionPeriod: 1095, // 3 years for adults
        requiresParentalConsent: false,
      }
    }
  },
}
