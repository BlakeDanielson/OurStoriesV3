import { Metadata } from 'next'
import { SignUpForm } from '../components/SignUpForm'

export const metadata: Metadata = {
  title: 'Sign Up | ourStories',
  description:
    'Create your ourStories account to start generating personalized stories for your family.',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4 py-12">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}
