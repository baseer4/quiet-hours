import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Welcome</h1>
      <Link
        href="/scheduler"
        className="btn btn-primary"
      >
        Go to Scheduler
      </Link>
    </main>
  );
}
