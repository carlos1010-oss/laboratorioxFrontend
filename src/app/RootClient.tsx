'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  Microscope,
  Activity,
  CheckCircle2,
  KeyRound,
  Fingerprint,
  ScanFace,
  AlertTriangle,
  Biohazard,
  Database,
  Globe2,
  Cpu,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Zap,
  Github,
  Linkedin,
  Thermometer,
  Wind
} from 'lucide-react';

export default function PortalPublicoPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated && pathname === '/') {
      logout();
    }
  }, [isAuthenticated, logout, pathname]);

  // Floating background elements generated on render
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const floatingOrbs = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    size: (i * 50) + 100,
    x: (i * 15) % 100,
    y: (i * 20) % 100,
    duration: 15 + i * 2,
    delay: i
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-primary selection:text-white overflow-hidden relative">
      
      {/* Floating Background Elements */}
      {isClient && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {floatingOrbs.map((orb) => (
            <motion.div
              key={orb.id}
              className="absolute rounded-full mix-blend-multiply filter blur-3xl opacity-30"
              style={{
                width: orb.size,
                height: orb.size,
                left: `${orb.x}%`,
                top: `${orb.y}%`,
                background: orb.id % 2 === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(14, 165, 233, 0.4)',
              }}
              animate={{
                x: [0, 50, -50, 0],
                y: [0, 50, -50, 0],
                scale: [1, 1.2, 0.9, 1]
              }}
              transition={{
                duration: orb.duration,
                repeat: Infinity,
                ease: "linear",
                delay: orb.delay
              }}
            />
          ))}
        </div>
      )}

      {/* 1. Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="border-b border-brand-accent/20 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-primary to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-brand-primary/30 cursor-pointer"
            >
              Z
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xl text-brand-dark tracking-tight">Zone Control</span>
                <motion.span 
                  
                  className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide border border-emerald-200"
                >
                  v2.0 TOP
                </motion.span>
              </div>
              <span className="block text-xs font-semibold text-brand-primary">
                Laboratorio Farmacéutico XYZ • Sistema Central
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Conexión Encriptada SSL</span>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xs">
                Cerrando sesión segura...
              </div>
            ) : (
              <>
                <Link href="/molinete">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-brand-primary/30 text-brand-primary font-semibold text-xs transition-shadow shadow-sm hover:shadow-md"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Validar ingreso
                  </motion.div>
                </Link>
                <Link href="/login" replace>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-xs transition-shadow shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40"
                  >
                    <KeyRound className="w-4 h-4" />
                    Portal Operativo
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      <main className="flex-1 relative z-10">
        
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <motion.div 
                  
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-primary/20 text-brand-primary text-xs font-extrabold shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Auditoría Estricta 21 CFR Part 11 & GMP
                </motion.div>

                <h1 className="text-5xl sm:text-7xl font-heading font-black text-brand-dark leading-[1.1] tracking-tight">
                  Control de Acceso <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-500">
                    Perimetral Biológico
                  </span>
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-xl font-light">
                  Plataforma unificada para la autenticación biométrica, asignación de permisos por niveles de bioseguridad y gestión de esclusas estériles de alta contención.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {isAuthenticated && user ? (
                    <div className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-300 text-slate-500 font-bold text-sm shadow-xl transition-all">
                      Cerrando sesión...
                    </div>
                  ) : (
                    <Link href="/login">
                      <motion.div
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-primary to-emerald-600 text-white font-bold text-sm shadow-xl shadow-brand-primary/30 transition-all cursor-pointer relative overflow-hidden group"
                      >
                        <motion.div 
                          className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" 
                        />
                        <ScanFace className="w-5 h-5" />
                        Identificación Biométrica
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* 3D FLOATING CARDS RIGHT SIDE */}
              <div className="relative h-[500px] w-full perspective-1000 hidden lg:block">
                
                {/* Central Card */}
                <motion.div 
                  
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 z-20"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100/50 pb-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Acceso Solicitado</p>
                      <p className="text-brand-dark font-black">Esclusa BSL-3</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      />
                    </div>
                    <p className="text-xs text-center text-slate-500 font-medium">Verificando credenciales biométricas...</p>
                  </div>
                </motion.div>

                {/* Floating Card Left */}
                <motion.div 
                  initial={{ opacity: 0, x: -100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  
                  className="absolute top-16 left-0 w-64 bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-3xl shadow-2xl border border-slate-700/50 z-10"
                >
                  <div className="flex items-center gap-3">
                    <Biohazard className="w-8 h-8 text-rose-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Riesgo Biológico</p>
                      <p className="font-bold text-sm">Contención Máxima</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Card Right */}
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  
                  className="absolute bottom-24 right-0 w-64 bg-white/70 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/60 z-30"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-brand-dark">Sincronización Activa</p>
                      <p className="text-[10px] text-slate-500">Bitácora Inmutable 21 CFR</p>
                    </div>
                  </div>
                </motion.div>

                {/* New Floating Mini-Card 1: Temperatura */}
                <motion.div 
                  
                  className="absolute top-10 right-10 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50 z-10 flex items-center gap-2"
                >
                  <Thermometer className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Temp. Interna</p>
                    <p className="text-sm font-black text-slate-700">21.5 °C</p>
                  </div>
                </motion.div>

                {/* New Floating Mini-Card 2: Presión */}
                <motion.div 
                  
                  className="absolute bottom-10 left-10 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 z-20 flex items-center gap-2 text-white"
                >
                  <Wind className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Presión Dif.</p>
                    <p className="text-sm font-black">-15.2 Pa</p>
                  </div>
                </motion.div>

                {/* New Floating Mini-Card 3: HEPA */}
                <motion.div 
                  
                  className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-slate-100 z-0 flex items-center gap-2"
                >
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Filtros HEPA</p>
                    <p className="text-sm font-black text-slate-700">Flujo Nominal</p>
                  </div>
                </motion.div>

              </div>

            </div>
          </div>
        </section>

        {/* NIVELES DE BIOSEGURIDAD (Continuous Scroll Animations) */}
        <section className="py-24 bg-[#030712] text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-heading font-black mb-4">Niveles de Bioseguridad (BSL)</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Control estricto segmentado por zonas. El sistema de interbloqueo reacciona instantáneamente a intentos de vulneración.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { 
                  level: 'BSL-1', color: 'from-blue-500 to-blue-600', text: 'Bajo Riesgo', icon: ShieldCheck, hex: '#3b82f6',
                  details: [
                    { label: 'EPI Requerido', value: 'Bata y Guantes Básicos', icon: ShieldCheck },
                    { label: 'Presión Aire', value: 'Positiva / Neutra', icon: Wind },
                    { label: 'Control Acceso', value: 'Registro Estándar', icon: Fingerprint }
                  ]
                },
                { 
                  level: 'BSL-2', color: 'from-yellow-500 to-yellow-600', text: 'Riesgo Moderado', icon: AlertTriangle, hex: '#eab308',
                  details: [
                    { label: 'EPI Requerido', value: 'Protección Facial y Guantes', icon: ShieldCheck },
                    { label: 'Presión Aire', value: 'Negativa (-10 Pa)', icon: Wind },
                    { label: 'Control Acceso', value: 'Biometría Básica', icon: Fingerprint }
                  ]
                },
                { 
                  level: 'BSL-3', color: 'from-orange-500 to-orange-600', text: 'Alto Riesgo', icon: Biohazard, hex: '#f97316',
                  details: [
                    { label: 'EPI Requerido', value: 'Respirador N95 y Traje Tyvek', icon: ShieldCheck },
                    { label: 'Presión Aire', value: 'Negativa Controlada (-15 Pa)', icon: Wind },
                    { label: 'Control Acceso', value: 'Autenticación Doble Factor', icon: Fingerprint }
                  ]
                },
                { 
                  level: 'BSL-4', color: 'from-rose-600 to-red-700', text: 'Riesgo Extremo', icon: Biohazard, hex: '#e11d48',
                  details: [
                    { label: 'EPI Requerido', value: 'Traje Presurizado Autónomo', icon: ShieldCheck },
                    { label: 'Presión Aire', value: 'Altamente Negativa (-30 Pa)', icon: Wind },
                    { label: 'Control Acceso', value: 'Seguridad Global de Estado', icon: Fingerprint }
                  ]
                }
              ].map((bsl, i) => (
                <motion.div
                  key={bsl.level}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -15, scale: 1.02 }}
                  className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group cursor-default shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)] hover:shadow-[0_0_60px_-15px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[420px]"
                >
                  {/* Animated Big Orb inside the card */}
                  <motion.div 
                    
                    className="absolute -top-12 -right-12 w-64 h-64 rounded-full filter blur-[30px] opacity-30 mix-blend-screen group-hover:opacity-50 pointer-events-none transition-opacity duration-700"
                    style={{ backgroundColor: bsl.hex }}
                  />

                  {/* Header */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-inner">
                        <bsl.icon className="w-8 h-8 drop-shadow-md" style={{ color: bsl.hex }} />
                      </div>
                      <span className="font-mono text-xs font-bold px-3 py-1 rounded-full border shadow-sm" style={{ borderColor: `${bsl.hex}50`, color: bsl.hex, backgroundColor: `${bsl.hex}15` }}>
                        ZONE {i+1}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black mb-1 text-white drop-shadow-md">{bsl.level}</h3>
                    <p className="text-slate-300 text-sm font-medium mb-8 drop-shadow-sm">{bsl.text}</p>
                  </div>

                  {/* Details List */}
                  <div className="relative z-10 space-y-4">
                    {bsl.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-colors shadow-sm">
                        <detail.icon className="w-4 h-4 mt-0.5 text-slate-400 group-hover:text-white transition-colors" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">{detail.label}</p>
                          <p className="text-xs font-semibold text-white mt-0.5">{detail.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bottom Threat Level Bar */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-900">
                    <motion.div 
                      
                      className="h-full"
                      style={{ backgroundColor: bsl.hex, width: `${(i+1)*25}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* MÓDULOS DE ARQUITECTURA */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 space-y-20">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              className="flex flex-col md:flex-row gap-12 items-center"
            >
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  <Database className="w-4 h-4" />
                  Arquitectura Resiliente
                </div>
                <h2 className="text-4xl font-heading font-black text-brand-dark">Trazabilidad Inmutable</h2>
                <p className="text-slate-600 leading-relaxed">
                  Cada evento dentro de la instalación, desde el acceso a un cuarto limpio hasta un intento fallido de autenticación, se registra con un hash criptográfico en la bitácora de auditoría. Ningún administrador puede alterar el historial.
                </p>
                <ul className="space-y-4">
                  {[
                    'Firmas digitales vinculadas al personal',
                    'Bloqueo automático ante vulneraciones',
                    'Integridad de datos garantizada por Triggers PostgreSQL'
                  ].map((item, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-3 text-sm font-bold text-slate-700"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-500 font-mono ml-2">sys_audit.log</span>
                  </div>
                  <div className="space-y-2 font-mono text-xs text-slate-400">
                    <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:false}} transition={{delay:0.2}} className="text-emerald-400">[OK] 14:02:01 - Acceso Autorizado: Area BSL-2 (User: 0000000001)</motion.div>
                    <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:false}} transition={{delay:0.4}} className="text-rose-400">[DENIED] 14:05:12 - Intento fallido BSL-3: Nivel Insuficiente</motion.div>
                    <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:false}} transition={{delay:0.6}} className="text-blue-400">[SYNC] 14:10:00 - Sincronizando bitácora con Matriz Global...</motion.div>
                    <motion.div animate={{opacity:[0,1,0]}} transition={{repeat:Infinity, duration:1}} className="inline-block w-2 h-4 bg-slate-400 mt-2" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Cpu, title: 'Edge Computing', desc: 'Validación en milisegundos directamente en los terminales de las esclusas.', colorCode: '#10b981', iconBg: 'bg-emerald-50 text-emerald-600' },
                { icon: Microscope, title: 'Gestión de Padrón', desc: 'Control absoluto del personal, con suspensiones instantáneas ante riesgos.', colorCode: '#3b82f6', iconBg: 'bg-blue-50 text-blue-600' },
                { icon: Globe2, title: 'Exportación Global', desc: 'Reportes en PDF y CSV compatibles con normativas internacionales de salud.', colorCode: '#6366f1', iconBg: 'bg-indigo-50 text-indigo-600' }
              ].map((mod, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -10 }}
                  className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group relative overflow-hidden"
                >
                  {/* Animated Big Orb inside the card */}
                  <motion.div 
                    
                    className="absolute -top-16 -right-16 w-64 h-64 rounded-full mix-blend-multiply filter blur-[20px] opacity-40 pointer-events-none"
                    style={{ backgroundColor: mod.colorCode }}
                  />
                  
                  <motion.div 
                    
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm relative z-10 ${mod.iconBg}`}
                  >
                    <mod.icon className="w-6 h-6" />
                  </motion.div>
                  <h3 className="font-heading font-black text-lg text-brand-dark mb-3 relative z-10">{mod.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10">
                    {mod.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Gran Footer Interactivo */}
      <footer className="bg-[#0B1120] text-slate-400 pt-24 pb-12 relative z-10 overflow-hidden border-t border-slate-800">
        {/* Glow effect at the top of the footer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[100px] bg-brand-primary/20 blur-[100px]" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Columna 1: Marca y Estado */}
            <div className="space-y-6">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 cursor-pointer group w-fit"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-all">
                  Z
                </div>
                <span className="font-heading font-extrabold text-2xl text-white tracking-tight">Zone Control</span>
              </motion.div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Plataforma de alta seguridad biológica. Operando bajo estrictos estándares ISO 14644 y FDA 21 CFR Part 11.
              </p>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm cursor-default">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-300">Todos los sistemas operativos</span>
              </div>
            </div>

            {/* Columna 2: Enlaces Rápidos */}
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Módulos</h4>
              <ul className="space-y-3">
                {['Panel Operativo', 'Auditoría en Tiempo Real', 'Gestión de Credenciales', 'Reportes Globales'].map((item, i) => (
                  <motion.li 
                    key={i}
                    whileHover={{ x: 5, color: '#34d399' }}
                    className="flex items-center gap-2 cursor-pointer transition-colors w-fit"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Columna 3: Contacto */}
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Centro de Mando</h4>
              <ul className="space-y-4">
                <motion.li whileHover={{ x: 5 }} className="flex items-start gap-3 cursor-pointer group w-fit">
                  <MapPin className="w-5 h-5 text-slate-500 group-hover:text-brand-primary transition-colors mt-0.5" />
                  <span className="text-sm leading-relaxed">Tech Park BSL-3<br/>Zona Franca de Innovación</span>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} className="flex items-center gap-3 cursor-pointer group w-fit">
                  <Phone className="w-5 h-5 text-slate-500 group-hover:text-brand-primary transition-colors" />
                  <span className="text-sm">+57 (601) 555-0199</span>
                </motion.li>
                <motion.li whileHover={{ x: 5 }} className="flex items-center gap-3 cursor-pointer group w-fit">
                  <Mail className="w-5 h-5 text-slate-500 group-hover:text-brand-primary transition-colors" />
                  <span className="text-sm">security@laboratorioxyz.com</span>
                </motion.li>
              </ul>
            </div>

            {/* Columna 4: Suscripción a Alertas */}
            <div className="space-y-6">
              <h4 className="text-white font-bold mb-2 text-lg">Alertas de Sistema</h4>
              <p className="text-sm text-slate-400">Recibe notificaciones de mantenimiento y parches de seguridad.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="admin@correo.com" 
                  className="w-full bg-slate-800/50 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-slate-600"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-1 top-1 bottom-1 bg-brand-primary text-white rounded-lg px-3 flex items-center justify-center hover:bg-emerald-500 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <motion.a whileHover={{ y: -3, color: '#fff' }} className="text-slate-500 transition-colors cursor-pointer"><Github className="w-5 h-5" /></motion.a>
                <motion.a whileHover={{ y: -3, color: '#fff' }} className="text-slate-500 transition-colors cursor-pointer"><Linkedin className="w-5 h-5" /></motion.a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 Laboratorio Farmacéutico XYZ S.A. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs font-medium">
              <motion.span whileHover={{ color: '#fff' }} className="cursor-pointer transition-colors">Política de Privacidad</motion.span>
              <motion.span whileHover={{ color: '#fff' }} className="cursor-pointer transition-colors">Acuerdo de Confidencialidad</motion.span>
              <motion.span whileHover={{ color: '#fff' }} className="cursor-pointer transition-colors">ISO/IEC 27001</motion.span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
