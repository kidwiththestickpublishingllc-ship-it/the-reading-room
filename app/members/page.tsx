"use client";

import { useEffect, useState } from "react";

export default function MembersRoom() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for Supabase auth later
    const fakeUser = {
      name: "Founding Reader",
      membership: "Gold",
    };

    setTimeout(() => {
      setUser(fakeUser);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black">
        <p className="animate-pulse">Entering the Reading Room...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-3xl mb-4">Members Only</h1>
        <p className="mb-6">You must be a member to enter.</p>
        <button className="bg-purple-600 px-6 py-2 rounded-lg hover:bg-purple-800">
          Join TTL
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      
      <h1 className="text-4xl font-bold mb-6">
        Welcome to The Tiniest Library Members Room
      </h1>

      <p className="mb-8 text-gray-300">
        Membership Level: {user.membership}
      </p>

      <section className="grid md:grid-cols-3 gap-6">

        <div className="bg-gray-800 p-6 rounded-xl hover:scale-105 transition">
          <h2 className="text-xl font-semibold mb-2">📚 Exclusive Stories</h2>
          <p className="text-gray-400">
            Access premium and unreleased content from our writers.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl hover:scale-105 transition">
          <h2 className="text-xl font-semibold mb-2">✍️ Writers Room</h2>
          <p className="text-gray-400">
            Collaborate and interact with TTL authors.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl hover:scale-105 transition">
          <h2 className="text-xl font-semibold mb-2">🔥 Adult Section</h2>
          <p className="text-gray-400">
            Members-only premium content (18+).
          </p>
        </div>

      </section>
    </main>
  );
}