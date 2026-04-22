"use client";

import { useMemo, useState } from "react";

const USERS = [
  { id: 1, name: "Quang Huy", email: "huy@mail.com", role: "ADMIN", active: true },
  { id: 2, name: "Wang Qi", email: "qi@mail.com", role: "USER", active: true },
  { id: 3, name: "Someone", email: "someone@mail.com", role: "USER", active: false },
];

export default function UsersPage() {
  const [q, setQ] = useState("");

  const rows = useMemo(
    () => USERS.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <main className="container-app space-y-4">
      <header className="glass-card">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-slate-300">Fake data preview for admin UX.</p>
        <input
          className="input-base mt-3 md:w-80"
          placeholder="Search by name/email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </header>

      <section className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-white/10 text-sm text-slate-300">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.role === "ADMIN" ? "bg-amber-400/20 text-amber-300" : "bg-cyan-400/20 text-cyan-300"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{u.active ? "Active" : "Disabled"}</td>
                <td className="space-x-2 px-4 py-3">
                  <button className="rounded-xl border border-white/10 px-3 py-1.5">Edit</button>
                  <button className="rounded-xl border border-rose-300/40 px-3 py-1.5 text-rose-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}