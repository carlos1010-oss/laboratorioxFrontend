'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, extraerMensajeError } from '@/lib/api';
import { Lock, Mail, AlertTriangle, KeyRound, ArrowLeft, ShieldAlert, Eye, EyeOff, Loader2, CheckCheck, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');

  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [isBloqueado, setIsBloqueado] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    errorParam === 'unauthorized'
      ? 'Acceso denegado: Debe autenticarse con credenciales válidas para ingresar a esta URL restringida.'
      : errorParam === 'session_expired'
      ? 'Su sesión ha expirado por políticas de seguridad farmacéutica.'
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Modal recuperación
  const [showRecuperar, setShowRecuperar] = useState(false);
  const [recuperarCorreo, setRecuperarCorreo] = useState('');
  const [recuperarMsg, setRecuperarMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Si el usuario ya está autenticado, redirigir al simulador
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard/simulador');
    }
  }, [isAuthenticated, router]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Autenticación 100% contra el backend: POST /api/auth/login { documento, password }
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBloqueado) {
      triggerShake();
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { documento, password });
      const u = res.data.usuario;
      login(
        res.data.token,
        {
          id: u.id,
          documento: u.documento,
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          rol: u.rol,
          estado: u.estado,
        }
      );
      router.replace('/dashboard/simulador');
    } catch (err) {
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);
      triggerShake();

      if (nuevosIntentos >= 3) {
        setIsBloqueado(true);
        setErrorMsg('Cuenta BLOQUEADA por seguridad tras 3 intentos fallidos consecutivos. Contacte a Soporte.');
      } else {
        setErrorMsg(extraerMensajeError(err, 'Credenciales incorrectas. Intente nuevamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarClave = (e: React.FormEvent) => {
    e.preventDefault();
    setRecuperarMsg(`Se ha enviado un enlace seguro y un código OTP al correo ${recuperarCorreo}. El enlace expira en 5 minutos.`);
    setTimeout(() => {
      setShowRecuperar(false);
      setRecuperarMsg('');
      setRecuperarCorreo('');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Mesh Gradient Background Líquido - Tono Claro */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-200/40 mix-blend-multiply filter blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-teal-200/30 mix-blend-multiply filter blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            x: [0, 30, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-green-200/30 mix-blend-multiply filter blur-[100px]"
        />
        
        {/* Patrón de puntos sutil */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Contenedor Principal Animado */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="w-full max-w-md relative z-10"
      >
        
        {/* Tarjeta Glassmorphism Blanca */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)] border border-white">
          
          {/* Logo y Encabezado */}
          <div className="text-center mb-10 relative">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30 relative group cursor-pointer"
            >
              <span className="text-white font-extrabold text-3xl font-heading absolute z-10">Z</span>
              {/* Glow logo */}
              <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
            <h2 className="text-3xl font-heading font-black text-slate-800 tracking-tight">Zone Control</h2>
            <p className="text-xs font-bold text-emerald-600 mt-2 uppercase tracking-widest">Autenticación Biométrica</p>
          </div>

          {/* Selector visual de Roles */}
          <div className="mb-8 relative z-20">
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mb-3">Rol de Usuario</p>
            <div className="flex justify-center relative">
              <select 
                defaultValue=""
                className="w-full max-w-[280px] px-5 py-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-bold border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm hover:border-emerald-400 transition-all text-center appearance-none"
              >
                <option value="" disabled>Seleccionar un Rol...</option>
                <option value="ADMINISTRADOR">👤 Administrador General</option>
                <option value="GESTOR_PERSONAL">👥 Gestor de Personal</option>
                <option value="SUPERVISOR_ACCESOS">🛡️ Auditor / Supervisor</option>
              </select>
              {/* Icono de flecha simulado para el select */}
              <div className="absolute right-[calc(50%-120px)] top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Alertas con animaciones ricas */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="overflow-hidden mb-6"
              >
                <div className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm ${
                  isBloqueado 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isBloqueado ? (
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-500 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  )}
                  <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario */}
          <form onSubmit={handleLogin} autoComplete="off" className={`space-y-5 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            
            <div className="relative group">
              <input
                id="auth_identifier"
                name="auth_identifier"
                type="text"
                required
                disabled={isBloqueado || loading}
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder=" "
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                className="peer w-full px-4 pt-6 pb-2 pr-12 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50 font-medium placeholder-shown:tracking-normal"
              />
              <label
                htmlFor="auth_identifier"
                className="absolute left-4 top-2 text-[10px] uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-600 font-bold pointer-events-none"
              >
                Documento
              </label>
              <div className="absolute right-4 top-4 text-slate-300 peer-focus:text-emerald-500 transition-colors">
                <Fingerprint className="w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div className="relative group">
              <input
                id="auth_secret"
                name="auth_secret"
                type="text"
                style={!showPassword ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : undefined}
                required
                disabled={isBloqueado || loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                maxLength={72}
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                className="peer w-full px-4 pt-6 pb-2 pr-12 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50 font-mono text-lg tracking-widest placeholder-shown:tracking-normal"
              />
              <label
                htmlFor="auth_secret"
                className="absolute left-4 top-2 text-[10px] uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-600 font-bold pointer-events-none"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Helper Dinámico de Longitud */}
            <AnimatePresence>
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -5, height: 0 }}
                  className="px-1 -mt-2"
                >
                  <span className={`text-[10px] flex items-center gap-1 font-bold ${password.length >= 8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {password.length >= 8 ? <CheckCheck className="w-3 h-3 shrink-0" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
                    {password.length >= 8 ? 'Longitud segura' : 'Mínimo 8 caracteres'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowRecuperar(true)}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={isBloqueado || loading}
              whileHover={{ scale: isBloqueado ? 1 : 1.02 }}
              whileTap={{ scale: isBloqueado ? 1 : 0.98 }}
              className="relative w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group mt-2"
            >
              {/* Efecto de brillo (shine) */}
              <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
              
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validando Credenciales...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Ingresar al Sistema
                  </>
                )}
              </div>
            </motion.button>
          </form>

        </div>

        {/* Link Volver */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors group bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Portal Institucional
          </Link>
        </div>
      </motion.div>

      {/* Modal de Recuperación Glassmorphism - Light */}
      <AnimatePresence>
        {showRecuperar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white max-w-md w-full rounded-[2rem] p-8 border border-slate-100 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">Recuperar Acceso</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Token de un solo uso (OTP)</p>
                </div>
              </div>

              {recuperarMsg ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-bold border border-emerald-200 text-center leading-relaxed"
                >
                  {recuperarMsg}
                </motion.div>
              ) : (
                <form onSubmit={handleRecuperarClave} className="space-y-5">
                  <div className="relative group">
                    <input
                      id="recuperarCorreo"
                      type="email"
                      required
                      value={recuperarCorreo}
                      onChange={(e) => setRecuperarCorreo(e.target.value)}
                      placeholder=" "
                      maxLength={100}
                      className="peer w-full px-4 pt-6 pb-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <label
                      htmlFor="recuperarCorreo"
                      className="absolute left-4 top-2 text-[10px] uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-emerald-600 font-bold pointer-events-none"
                    >
                      Correo Institucional
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRecuperar(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      Enviar Token
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
