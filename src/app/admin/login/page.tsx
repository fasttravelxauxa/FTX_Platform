'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Lock, Mail, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
          setLoading(false);
          return;
        }

        // Successfully logged in
        router.push('/admin');
        return;
      }

      // Fallback for local demo credentials
      if (
        (email === 'admin@fasttravelxauxa.pe' || email === 'admin') &&
        (password === 'admin123' || password === 'admin')
      ) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ftx_admin_auth', 'true');
        }
        router.push('/admin');
      } else {
        setErrorMsg('Credenciales incorrectas para demostración (Usar admin / admin123).');
      }
    } catch (err) {
      setErrorMsg('Error de autenticación. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crusoe-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-crusoe-600/20 blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-crusoe-500/20 blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2.5 group mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-500 text-crusoe-950 font-bold shadow-lg shadow-crusoe-500/30">
            <Car className="h-7 w-7" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Fast Travel <span className="text-crusoe-400">Xauxa</span>
          </span>
        </Link>

        <h2 className="text-center text-2xl font-extrabold text-white">Acceso Administrativo</h2>
        <p className="mt-1 text-center text-xs text-crusoe-300">
          Panel de Control Operativo y Validación de Pagos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-crusoe-200">
          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-crusoe-950 mb-2">Correo Electrónico Administrador</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-crusoe-600" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fasttravelxauxa.pe"
                  className="w-full rounded-xl border border-crusoe-300 pl-10 pr-4 py-3 text-sm focus:border-crusoe-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-crusoe-950 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-crusoe-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-crusoe-300 pl-10 pr-4 py-3 text-sm focus:border-crusoe-600 focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-full py-3.5 text-base">
              Iniciar Sesión Admin
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-crusoe-100 flex items-center justify-between text-xs text-crusoe-800">
            <Link href="/" className="inline-flex items-center gap-1 font-bold text-crusoe-700 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a la web
            </Link>
            <div className="flex items-center gap-1 text-[11px] text-gray-700">
              <ShieldCheck className="h-3.5 w-3.5 text-crusoe-600" />
              <span>Conexión Cifrada SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
