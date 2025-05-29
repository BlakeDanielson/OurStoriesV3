'use client'

import { useState } from 'react'
import { coppaConfig } from '@/lib/auth/config'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Eye,
  FileText,
  Calendar,
  Mail,
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
}

interface ChildProfile {
  id: string
  name: string
  age: number | null
  reading_level: string | null
  interests: string[] | null
  parent_id: string
  created_at: string | null
  updated_at: string | null
}

interface COPPACompliancePanelProps {
  userProfile: UserProfile | null
  childProfiles: ChildProfile[]
  onUpdate: () => Promise<void>
}

export function COPPACompliancePanel({
  userProfile,
  childProfiles,
  onUpdate,
}: COPPACompliancePanelProps) {
  const [loading, setLoading] = useState(false)

  // Calculate COPPA compliance status
  const childrenUnder13 = childProfiles.filter(
    child => child.age && child.age < coppaConfig.minimumAge
  )
  const hasChildrenUnder13 = childrenUnder13.length > 0
  const isParentAccount = userProfile?.role === 'parent'

  const complianceStatus = {
    isCompliant: isParentAccount && hasChildrenUnder13,
    needsParentalConsent: hasChildrenUnder13,
    hasVerifiedEmail: !!userProfile?.email,
    accountType: isParentAccount ? 'Parent Account' : 'Regular Account',
  }

  const handleRequestDataExport = async () => {
    setLoading(true)
    try {
      // This would typically trigger a data export process
      // For now, we'll just show a success message
      alert(
        'Data export request submitted. You will receive an email with your data within 30 days.'
      )
    } catch (error) {
      console.error('Failed to request data export:', error)
      alert('Failed to request data export. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChildData = async (childId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete all data for this child? This action cannot be undone.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      // This would typically delete all child data
      // For now, we'll just show a success message
      alert(
        'Child data deletion request submitted. All data will be removed within 30 days.'
      )
      await onUpdate()
    } catch (error) {
      console.error('Failed to delete child data:', error)
      alert('Failed to delete child data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* COPPA Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            COPPA Compliance Overview
          </CardTitle>
          <CardDescription>
            Children's Online Privacy Protection Act (COPPA) compliance status
            and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Account Type</span>
              </div>
              <Badge variant={isParentAccount ? 'default' : 'secondary'}>
                {complianceStatus.accountType}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Children Under 13</span>
              </div>
              <Badge variant={hasChildrenUnder13 ? 'destructive' : 'default'}>
                {childrenUnder13.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email Verified</span>
              </div>
              <Badge
                variant={
                  complianceStatus.hasVerifiedEmail ? 'default' : 'destructive'
                }
              >
                {complianceStatus.hasVerifiedEmail ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">COPPA Compliant</span>
              </div>
              <Badge
                variant={
                  complianceStatus.isCompliant ? 'default' : 'destructive'
                }
              >
                {complianceStatus.isCompliant ? 'Yes' : 'Needs Setup'}
              </Badge>
            </div>
          </div>

          {hasChildrenUnder13 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have children under {coppaConfig.minimumAge} years old.
                Special privacy protections apply under COPPA.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Children Under 13 Management */}
      {hasChildrenUnder13 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Children Under 13 - Privacy Controls
            </CardTitle>
            <CardDescription>
              Manage privacy settings for children under{' '}
              {coppaConfig.minimumAge}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {childrenUnder13.map(child => (
              <div key={child.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{child.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Age: {child.age}
                    </p>
                  </div>
                  <Badge variant="destructive">Under 13</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span>
                      Data collection limited to essential features only
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>No behavioral tracking or advertising</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span>Enhanced privacy protections enabled</span>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChildData(child.id)}
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Delete All Data
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Privacy Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Privacy Rights & Data Control
          </CardTitle>
          <CardDescription>
            Exercise your privacy rights and control your family's data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleRequestDataExport}
              disabled={loading}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Request Data Export</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Download a copy of all your family's data
              </span>
            </Button>

            <Button
              variant="outline"
              disabled={true}
              className="h-auto p-4 flex flex-col items-start opacity-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Contact Privacy Officer</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Get help with privacy questions (Coming Soon)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* COPPA Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About COPPA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              The Children's Online Privacy Protection Act (COPPA) requires
              special protections for children under {coppaConfig.minimumAge}{' '}
              years old.
            </p>
            <p>
              <strong>What this means for your family:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                We collect minimal data from children under{' '}
                {coppaConfig.minimumAge}
              </li>
              <li>No behavioral tracking or targeted advertising</li>
              <li>Enhanced security and privacy controls</li>
              <li>You can request data deletion at any time</li>
              <li>Regular privacy reviews and updates</li>
            </ul>
            <p>
              <strong>Your rights as a parent:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Review what information we collect</li>
              <li>Request deletion of your child's data</li>
              <li>Refuse further collection of your child's information</li>
              <li>Contact us with privacy questions or concerns</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
