import { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, FileText, Users, Lock, Eye, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | ourStories',
  description:
    "Learn how ourStories protects your family's privacy and complies with COPPA regulations.",
}

export default function PrivacyPolicyPage() {
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
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          Your family's privacy is our top priority
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Last Updated: {lastUpdated}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            COPPA Compliant
          </Badge>
        </div>
      </div>

      {/* Quick Summary */}
      <Card className="mb-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy at a Glance
          </CardTitle>
          <CardDescription>
            Here's what you need to know about how we protect your family's
            information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold">We Don't Sell Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Your personal information and your children's data are never
                  sold to third parties.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold">COPPA Compliant</h4>
                <p className="text-sm text-muted-foreground">
                  Special protections for children under 13 with full parental
                  control.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-semibold">Secure by Design</h4>
                <p className="text-sm text-muted-foreground">
                  All data is encrypted and protected with industry-standard
                  security.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <h4 className="font-semibold">You're in Control</h4>
                <p className="text-sm text-muted-foreground">
                  Access, modify, or delete your family's data at any time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="prose prose-lg max-w-none">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="mb-6">
              Welcome to ourStories ("we," "our," or "us"). We are committed to
              protecting your privacy and the privacy of your children. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our AI-powered
              personalized children's book platform.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-yellow-800">
                Important: This service is designed for families with children.
                We take special care to comply with the Children's Online
                Privacy Protection Act (COPPA) and other applicable privacy
                laws.
              </p>
            </div>

            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">
              Personal Information You Provide
            </h3>
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Account Information:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  Email address (required for account creation and
                  communication)
                </li>
                <li>Full name (first and last name)</li>
                <li>Age (for COPPA compliance and age-appropriate content)</li>
                <li>
                  Password (stored securely using industry-standard encryption)
                </li>
                <li>Profile picture (optional)</li>
                <li>Account type (parent or regular user)</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Child Profile Information:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Child's name</li>
                <li>Child's age or age range</li>
                <li>
                  Personality traits (selected from predefined options or custom
                  entries)
                </li>
                <li>Hobbies and interests</li>
                <li>Reading preferences and level</li>
                <li>Learning goals</li>
                <li>Favorite characters</li>
                <li>Photos for story personalization (optional)</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              Children's Privacy (COPPA Compliance)
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">
                Special Protections for Children Under 13
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Parental Consent:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      We require verifiable parental consent before collecting
                      information from children under 13
                    </li>
                    <li>
                      Parents can review, modify, or delete their child's
                      information at any time
                    </li>
                    <li>
                      Parents can refuse further collection of their child's
                      information
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    Limited Data Collection:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      We collect only information necessary for the service
                    </li>
                    <li>
                      No behavioral tracking or targeted advertising for
                      children
                    </li>
                    <li>
                      No sharing of children's information with third parties
                      (except service providers)
                    </li>
                    <li>Enhanced security measures for children's accounts</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Parental Rights:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      Review what information we have collected from your child
                    </li>
                    <li>Request deletion of your child's information</li>
                    <li>Refuse further collection of information</li>
                    <li>Contact us with questions or concerns</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Security Measures</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Encryption:</strong> All data is encrypted in transit
                  and at rest
                </li>
                <li>
                  <strong>Access Controls:</strong> Strict access controls and
                  authentication requirements
                </li>
                <li>
                  <strong>Regular Audits:</strong> Regular security assessments
                  and vulnerability testing
                </li>
                <li>
                  <strong>Secure Infrastructure:</strong> Industry-standard
                  cloud security practices
                </li>
                <li>
                  <strong>Employee Training:</strong> Regular privacy and
                  security training for all staff
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mb-4">Your Rights and Choices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Access and Control
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Update your profile and preferences at any time</li>
                  <li>Request a copy of your data in a portable format</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Parental Controls
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Add, edit, or remove child profiles</li>
                  <li>Set reading levels and content preferences</li>
                  <li>Control what information is collected and used</li>
                  <li>Request deletion of child's data at any time</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our
                privacy practices, please contact us:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <strong>Email:</strong> privacy@ourstories.com
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
                This Privacy Policy is designed to comply with COPPA, GDPR,
                CCPA, and other applicable privacy laws. We are committed to
                protecting your family's privacy and providing a safe, secure
                environment for creating personalized children's stories.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
