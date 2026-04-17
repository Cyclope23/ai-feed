'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) setErr('Credenziali non valide');
    else window.location.href = '/admin';
  };

  return (
    <main className="container mx-auto p-6 max-w-sm">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
               className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
               className="w-full p-2 border rounded" required />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button className="w-full p-2 bg-purple-600 text-white rounded">Accedi</button>
      </form>
    </main>
  );
}
