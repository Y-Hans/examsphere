import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-2xl font-bold text-indigo-600">ExamSphere</span>
            <div className="flex gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Crack JEE & NEET with <span className="text-indigo-600">AI-Powered</span> Learning
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Real exam simulation, adaptive practice, AI tutor, and personalized analytics.
            Built for students, coaching institutes, and schools.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Start Free Today
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Real Exam Interface', desc: 'Practice with a pixel-perfect JEE/NEET exam simulator with timer, palette, and keyboard navigation.' },
            { title: 'AI Tutor & Planner', desc: 'Get 24/7 doubt resolution, personalized study plans, and AI-generated practice tests.' },
            { title: 'Deep Analytics', desc: 'Track accuracy, speed, weak topics, and get rank predictions based on your performance.' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
