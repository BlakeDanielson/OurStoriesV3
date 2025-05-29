import { Metadata } from 'next'
import { EmailVerificationForm } from '../components/EmailVerificationForm'

export const metadata: Metadata = {
  title: 'Verify Email | ourStories',
  description:
    'Verify your email address to complete your ourStories account setup and unlock all features.',
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4 py-12">
      <div className="w-full max-w-md">
        <EmailVerificationForm />
      </div>
    </div>
  )
}
