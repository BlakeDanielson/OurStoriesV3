import { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Scale,
  Shield,
  Users,
  AlertTriangle,
  Mail,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | ourStories',
  description:
    'Read the terms and conditions for using the ourStories platform.',
}

export default function TermsOfServicePage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Scale className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Terms of Service</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          The terms and conditions for using ourStories
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Last Updated: {lastUpdated}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            COPPA Compliant
          </Badge>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="mb-8 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-800">
            By accessing or using ourStories, you agree to be bound by these
            Terms of Service and our Privacy Policy. If you do not agree to
            these terms, please do not use our service.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="prose prose-lg max-w-none">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              Welcome to ourStories! These Terms of Service ("Terms") govern
              your use of the ourStories platform, website, and services
              (collectively, the "Service"). By accessing or using our Service,
              you agree to be bound by these Terms and our Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold mb-4">
              2. Description of Service
            </h2>
            <p className="mb-4">
              ourStories is an AI-powered platform that creates personalized
              children's books. Our Service allows users to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-6">
              <li>
                Create custom stories featuring their children as main
                characters
              </li>
              <li>Generate personalized illustrations using AI technology</li>
              <li>
                Customize story content based on children's interests and traits
              </li>
              <li>Save and organize a digital library of personalized books</li>
              <li>Order physical copies of created books (when available)</li>
            </ul>

            <h2 className="text-2xl font-bold mb-4">
              3. Age Requirements and Parental Consent
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">General Users</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                <li>
                  Users must be at least 13 years old to create an account
                </li>
                <li>
                  Users between 13-17 must have parental permission to use the
                  Service
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">
                Children Under 13 (COPPA Compliance)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Children under 13 cannot create their own accounts</li>
                <li>
                  Parents or legal guardians must create accounts and provide
                  verifiable consent
                </li>
                <li>
                  We comply with the Children's Online Privacy Protection Act
                  (COPPA)
                </li>
                <li>
                  Parents have full control over their children's data and can
                  request deletion at any time
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              4. Account Registration and Security
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Creation</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain confidentiality of account credentials</li>
                  <li>Notify us of any unauthorized use</li>
                  <li>One person may not maintain multiple accounts</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Security</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>You're responsible for all account activities</li>
                  <li>Use strong passwords and enable 2FA when available</li>
                  <li>Don't share account credentials</li>
                  <li>We may suspend compromised accounts</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              5. Acceptable Use Policy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-green-800">
                  ✅ Permitted Uses
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  <li>Create personalized stories for your family</li>
                  <li>Upload photos with appropriate consent</li>
                  <li>Share stories within your family or with friends</li>
                  <li>Use the Service for personal, non-commercial purposes</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-red-800">
                  ❌ Prohibited Uses
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>Use for illegal or unauthorized purposes</li>
                  <li>Upload inappropriate or harmful content</li>
                  <li>Upload photos without proper consent</li>
                  <li>Reverse engineer our AI technology</li>
                  <li>Violate intellectual property rights</li>
                  <li>Harass or harm other users</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              6. Content and Intellectual Property
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Content</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    You retain ownership of photos and personal information you
                    upload
                  </li>
                  <li>
                    You grant us a license to use your content for providing the
                    Service
                  </li>
                  <li>
                    You must have the right to upload and use all content you
                    provide
                  </li>
                  <li>
                    You're responsible for ensuring content doesn't violate laws
                    or rights
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Our Content</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    AI-generated stories and illustrations are created
                    specifically for you
                  </li>
                  <li>
                    You receive a personal, non-commercial license to use
                    generated content
                  </li>
                  <li>Our AI technology and platform remain our property</li>
                  <li>
                    You may not redistribute or commercialize generated content
                    without permission
                  </li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              7. Privacy and Data Protection
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Data Collection and Use</h4>
                  <p className="text-sm text-muted-foreground">
                    Our collection and use of personal information is governed
                    by our Privacy Policy. We implement industry-standard
                    security measures and do not sell personal information to
                    third parties.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Parental Rights</h4>
                  <p className="text-sm text-muted-foreground">
                    Parents can review, modify, or delete their children's
                    information and refuse further data collection. We provide
                    comprehensive parental controls and privacy management
                    tools.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">8. Termination</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Termination by You
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    Terminate your account anytime through account settings
                  </li>
                  <li>Access to the Service will cease upon termination</li>
                  <li>Request data deletion per our Privacy Policy</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Termination by Us
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  We may terminate accounts for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Violating these Terms or Privacy Policy</li>
                  <li>Fraudulent or illegal activities</li>
                  <li>Uploading inappropriate content</li>
                  <li>Failure to pay applicable fees</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              9. Disclaimers and Limitations
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Important Disclaimers
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                <li>
                  The Service is provided "as is" without warranties of any kind
                </li>
                <li>
                  We don't guarantee the accuracy or quality of AI-generated
                  content
                </li>
                <li>We're not responsible for how you use generated content</li>
                <li>
                  Our liability is limited to the maximum extent permitted by
                  law
                </li>
                <li>
                  We're not liable for indirect, incidental, or consequential
                  damages
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="mb-4">
                If you have questions about these Terms of Service, please
                contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <strong>Email:</strong> legal@ourstories.com
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <strong>For COPPA-related inquiries:</strong>{' '}
                  coppa@ourstories.com
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-muted-foreground text-center">
                By using ourStories, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service and
                our Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
