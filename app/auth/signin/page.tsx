import { Metadata } from 'next'
import { SignInForm } from '../components/SignInForm'

export const metadata: Metadata = {
  title: 'Sign In | ourStories',
  description:
    'Sign in to your ourStories account to access your personalized stories and reading progress.',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  )
}
