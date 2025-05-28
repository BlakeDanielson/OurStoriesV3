export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-blue-600 mb-6">ourStories</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create magical, one-of-a-kind storybooks where your child is the
            main character, featuring their unique appearance, personality
            traits, and hobbies woven into original narratives and
            illustrations.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Create Your Book
            </button>
            <button className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              View Examples
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="text-center p-6 border border-gray-200 rounded-lg">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold mb-2">
            AI-Powered Illustrations
          </h3>
          <p className="text-gray-600">
            Advanced AI creates beautiful, personalized illustrations featuring
            your child
          </p>
        </div>

        <div className="text-center p-6 border border-gray-200 rounded-lg">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">Unique Stories</h3>
          <p className="text-gray-600">
            Every story is crafted specifically for your child&apos;s interests
            and personality
          </p>
        </div>

        <div className="text-center p-6 border border-gray-200 rounded-lg">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="text-lg font-semibold mb-2">Print & Digital</h3>
          <p className="text-gray-600">
            Get beautiful printed books delivered or enjoy digital versions
            instantly
          </p>
        </div>
      </div>
    </main>
  )
}
