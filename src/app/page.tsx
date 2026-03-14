export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-black text-gray-900">BScale Integrations</h1>
      <p className="text-sm text-gray-600">
        Open the Connections Center to manage OAuth integrations and account sync.
      </p>
      <a
        href="/dashboard/connections"
        className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
      >
        Open Connections Center
      </a>
    </main>
  );
}
