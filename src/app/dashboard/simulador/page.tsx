'use client';

import React, { useState, useEffect } from 'react';
import { ResultadoAcceso, Empleado, EstadoEmpleado } from '@/types';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { registrarAccesoLocal } from '@/lib/historialStore';
import { useNotifications } from '@/context/NotificationContext';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

// DTO real del backend POST /api/accesos/molinete (ResultadoAccesoResponseDTO)
interface ResultadoMolineteDTO {
  idHistorial?: string;
  numeroDocumentoIngresado?: string;
  codigoTarjetaRfid?: string;
  nombreEmpleado?: string;
  nombreArea?: string;
  resultado: ResultadoAcceso;
  color?: string;
  motivo?: string;
  fechaHora?: string;
}

export default function SimuladorAccesoPage() {
  const { agregarNotificacion } = useNotifications();
  // Doble factor también en el simulador interno: documento Y tarjeta de la
  // misma persona (mismo criterio del kiosco público).
  const [documento, setDocumento] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [areaId, setAreaId] = useState('3');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    import('@/lib/usuariosStore').then(({ getUsuariosSistema }) => getUsuariosSistema());
    import('@/lib/personalStore').then(({ getEmpleados }) => getEmpleados());
  }, []);

  const [resultado, setResultado] = useState<{
    estado: ResultadoAcceso;
    motivo?: string;
    timestamp: string;
    areaConsultada?: string;
    perfil?: Empleado;
  } | null>(null);

  const areasDemoInicial = [
    { id: '3', nombre: 'Laboratorio de Síntesis Molecular (Área A)' },
    { id: '4', nombre: 'Sala Limpia de Liofilización (Área B)' },
    { id: '5', nombre: 'Almacén Central (Área C)' },
    { id: '6', nombre: 'Oficinas Administrativas (Área D)' },
    { id: '1', nombre: 'Laboratorio de Bioseguridad 1' },
    { id: '2', nombre: 'Zona de Empaque 1' },
  ];

  // Áreas reales del backend (antes quemadas: los ids 3-6 no existen en la BD
  // y validar contra ellos siempre daba "área no encontrada").
  const [areasDemo, setAreasDemo] = useState(areasDemoInicial);

  useEffect(() => {
    api.get('/catalogos/areas-restringidas')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAreasDemo(res.data.map((a: { id: number; nombre: string }) => ({ id: String(a.id), nombre: a.nombre })));
          setAreaId((prev) => (res.data.some((a: { id: number }) => String(a.id) === prev) ? prev : String(res.data[0].id)));
        }
      })
      .catch(() => {});
  }, []);

  const handleSimular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim() || !tarjeta.trim()) {
      toast.error('Por favor ingresa el número de documento Y el carnet RFID (doble factor).');
      return;
    }

    setLoading(true);
    setResultado(null);
    
    toast.loading('Analizando credencial en el servidor biométrico...', { id: 'scan-toast' });

    const areaSeleccionada = areasDemo.find((a) => a.id === areaId)?.nombre ?? 'Área General';

    // Función de resolución y fallback local (doble factor: ambas credenciales
    // deben pertenecer a la misma persona)
    const buscarEnLocal = async (doc: string, rfid: string, area: string) => {
      const { buscarPorDocumento, buscarPorRfid } = await import('@/lib/personalStore');
      const { buscarUsuarioPorDocumento } = await import('@/lib/usuariosStore');
      let empleado: Empleado | null = null;
      let esUsuarioSistema = false;
      let rolSistema = '';

      const usuarioSistema = buscarUsuarioPorDocumento(doc.trim());
      if (usuarioSistema) {
        esUsuarioSistema = true;
        rolSistema = usuarioSistema.rol;
          const estadoMapeado: EstadoEmpleado = usuarioSistema.estado === 'ACTIVO' ? 'ACTIVO' : usuarioSistema.estado === 'BLOQUEADO' ? 'BLOQUEADO' : 'INACTIVO';
          empleado = {
            id: usuarioSistema.id,
            departamentoId: 0,
            departamentoNombre: usuarioSistema.rol === 'ADMINISTRADOR' ? 'Dirección General' : 'Supervisión y Control',
            areaPrincipalNombre: 'Acceso Maestro (Todas las zonas)',
            areasAutorizadas: [
              'Laboratorio de Síntesis Molecular (Área A)',
              'Sala Limpia de Liofilización (Área B)',
              'Almacén Central (Área C)',
              'Oficinas Administrativas (Área D)',
              'Laboratorio de Bioseguridad 1',
              'Zona de Empaque 1'
            ],
            tipoDocumento: 'CC',
            numeroDocumento: usuarioSistema.documento,
            nombres: usuarioSistema.nombres,
            apellidos: usuarioSistema.apellidos,
            correo: usuarioSistema.correo,
            telefono: 'Oficina Central',
            estado: estadoMapeado,
          };
        } else {
          const porDocumento = buscarPorDocumento(doc.trim());
          const porTarjeta = buscarPorRfid(rfid.trim());
          if (!porDocumento || !porTarjeta) {
            empleado = null;
          } else if (porDocumento.numeroDocumento !== porTarjeta.numeroDocumento) {
            const estadoFinal: ResultadoAcceso = 'DENEGADO';
            const motivo = 'El documento y la tarjeta no corresponden a la misma persona.';
            toast.error('Acceso Denegado', { id: 'scan-toast' });

            setResultado({
              estado: estadoFinal,
              motivo,
              timestamp: new Date().toISOString(),
              areaConsultada: area,
            });

            registrarAccesoLocal({
              nombreArea: area,
              numeroDocumentoIngresado: doc,
              codigoTarjetaRfid: rfid,
              resultado: estadoFinal,
              motivo,
              fechaHora: new Date().toISOString(),
            });
            return;
          } else {
            empleado = porDocumento;
          }
        }

      const timestampActual = new Date().toISOString();

      if (!empleado) {
        const estadoFinal: ResultadoAcceso = 'NO_REGISTRADO';
        const motivo = 'Credencial no registrada en el padrón del laboratorio.';
        toast.warning('Credencial Desconocida', { id: 'scan-toast' });
        
        setResultado({
          estado: estadoFinal,
          motivo,
          timestamp: timestampActual,
          areaConsultada: area,
        });

        registrarAccesoLocal({
          nombreArea: area,
          numeroDocumentoIngresado: doc,
          codigoTarjetaRfid: rfid,
          resultado: estadoFinal,
          motivo,
          fechaHora: timestampActual,
        });
        return;
      }

      if (empleado.estado === 'BLOQUEADO' || empleado.estado === 'INACTIVO') {
        const estadoFinal: ResultadoAcceso = 'DENEGADO';
        const motivo = `Credencial en estado ${empleado.estado}. Acceso revocado por protocolo de seguridad.`;
        toast.error(`Acceso Denegado — ${empleado.estado}`, { id: 'scan-toast' });

        setResultado({
          estado: estadoFinal,
          perfil: empleado,
          areaConsultada: area,
          motivo,
          timestamp: timestampActual,
        });

        registrarAccesoLocal({
          nombreArea: area,
          numeroDocumentoIngresado: doc,
          codigoTarjetaRfid: rfid,
          resultado: estadoFinal,
          motivo,
          nombreEmpleado: `${empleado.nombres} ${empleado.apellidos}`,
          fechaHora: timestampActual,
        });
        return;
      }

      // Validación de acceso por zona
      const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const areaActualNorm = normalizar(area);

      // Si es administrador o supervisor de accesos, posee acceso maestro
      const esAdmin = esUsuarioSistema && (rolSistema === 'ADMINISTRADOR' || rolSistema === 'SUPERVISOR_ACCESOS');

      const tieneAccesoZona = esAdmin || (empleado.areasAutorizadas?.some((a) => {
        const aNorm = normalizar(a);
        return aNorm === areaActualNorm || aNorm.includes(areaActualNorm) || areaActualNorm.includes(aNorm);
      }) ?? false);

      const estadoFinal: ResultadoAcceso = tieneAccesoZona ? 'AUTORIZADO' : 'DENEGADO';
      const motivo = tieneAccesoZona
        ? (esAdmin ? `Acceso maestro concedido como ${rolSistema}.` : `Autorización válida para ${area}.`)
        : `No posee permiso de ingreso autorizado para ${area}.`;

      if (tieneAccesoZona) toast.success('Acceso Permitido', { id: 'scan-toast' });
      else toast.error('Acceso Denegado', { id: 'scan-toast' });

      setResultado({
        estado: estadoFinal,
        perfil: empleado,
        areaConsultada: area,
        motivo,
        timestamp: timestampActual,
      });

      registrarAccesoLocal({
        nombreArea: area,
        numeroDocumentoIngresado: doc,
        codigoTarjetaRfid: rfid,
        resultado: estadoFinal,
        motivo: tieneAccesoZona ? undefined : motivo,
        nombreEmpleado: `${empleado.nombres} ${empleado.apellidos}`,
        fechaHora: timestampActual,
      });
    };

    try {
      // Simulación de delay de lectura biométrica de torniquete
      await new Promise((resolve) => setTimeout(resolve, 800));

      const res = await api.post<ResultadoMolineteDTO>('/accesos/molinete', {
        numeroDocumento: documento.trim(),
        codigoTarjetaRfid: tarjeta.trim(),
        areaId: parseInt(areaId, 10),
      });

      const estado = res.data.resultado;
      const timestampActual = res.data.fechaHora || new Date().toISOString();

      setResultado({
        estado,
        motivo: res.data.motivo || undefined,
        timestamp: timestampActual,
        areaConsultada: res.data.nombreArea || areaSeleccionada,
        perfil: res.data.nombreEmpleado ? {
          id: 0,
          departamentoId: 0,
          tipoDocumento: 'CC',
          numeroDocumento: res.data.numeroDocumentoIngresado || documento,
          nombres: res.data.nombreEmpleado.split(' ')[0] || res.data.nombreEmpleado,
          apellidos: res.data.nombreEmpleado.split(' ').slice(1).join(' ') || '',
          correo: 'personal@laboratorioxyz.com',
          telefono: 'Registrado en Servidor',
          estado: estado === 'AUTORIZADO' ? 'ACTIVO' : 'BLOQUEADO',
          areaPrincipalNombre: res.data.nombreArea || areaSeleccionada,
        } : undefined,
      });

      if (estado === 'AUTORIZADO') {
        toast.success('Acceso Permitido', { id: 'scan-toast' });
      } else if (estado === 'DENEGADO') {
        toast.error('Acceso Denegado', { id: 'scan-toast' });
      } else {
        toast.warning('Credencial Desconocida', { id: 'scan-toast' });
      }

    } catch (error) {
      // Fallback a lógica local si no hay backend (o si la API falla)
      await buscarEnLocal(documento, tarjeta, areaSeleccionada);
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    AUTORIZADO: {
      bg: 'bg-emerald-50/90 backdrop-blur-md',
      border: 'border-emerald-300',
      text: 'text-emerald-950',
      glow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]',
      icon: 'text-emerald-600',
      iconBg: 'bg-emerald-100 border-emerald-300',
      alertBg: 'bg-emerald-100/90 border-emerald-300 text-emerald-900',
      AlertIcon: ShieldCheck,
    },
    DENEGADO: {
      bg: 'bg-red-50/90 backdrop-blur-md',
      border: 'border-red-300',
      text: 'text-red-950',
      glow: 'shadow-[0_0_40px_rgba(244,63,94,0.2)]',
      icon: 'text-red-600',
      iconBg: 'bg-red-100 border-red-300',
      alertBg: 'bg-red-100/90 border-red-300 text-red-900',
      AlertIcon: ShieldAlert,
    },
    NO_REGISTRADO: {
      bg: 'bg-amber-50/90 backdrop-blur-md',
      border: 'border-amber-300',
      text: 'text-amber-950',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100 border-amber-300',
      alertBg: 'bg-amber-100/90 border-amber-300 text-amber-900',
      AlertIcon: AlertCircle,
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-slate-800">Simulador de Esclusa y Control de Acceso</h1>
        <p className="text-xs text-slate-500/70 mt-1">
          Validación biométrica e inspección de credenciales RFID en tiempo real con registro inmutable en bitácora.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel de Configuración del Escaneo */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-emerald-200/40 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-emerald-200/30 pb-4">
            <div className="p-2.5 rounded-2xl bg-emerald-600/10 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-slate-800 text-sm">Punto de Verificación</h2>
              <p className="text-[11px] text-slate-500/70">Selecciona el área donde se ubica el lector</p>
            </div>
          </div>

          <form onSubmit={handleSimular} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500/70 uppercase tracking-wider">
                Zona de Bioseguridad Destino
              </label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-emerald-50/30 border border-emerald-200/60 text-slate-800 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all shadow-xs"
              >
                {areasDemo.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500/70 uppercase tracking-wider">
                Doble Credencial Requerida
              </label>
              <p className="text-[10px] text-slate-500/60">
                Por seguridad se exigen documento <strong>y</strong> tarjeta de la misma persona.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500/70 uppercase tracking-wider">
                  Número de Documento
                </label>
                <span className="text-[10px] font-medium text-slate-500/50">{documento.length}/20</span>
              </div>
              <input
                type="text"
                required
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej. 10001234 o 1012345678"
                className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200/60 text-slate-800 font-mono text-base focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all placeholder:text-slate-500/30 shadow-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500/70 uppercase tracking-wider">
                  Código de Tarjeta RFID
                </label>
                <span className="text-[10px] font-medium text-slate-500/50">{tarjeta.length}/20</span>
              </div>
              <input
                type="text"
                required
                value={tarjeta}
                onChange={(e) => setTarjeta(e.target.value)}
                placeholder="Ej. RFID-001 o XYZ123"
                className="w-full px-5 py-4 rounded-xl bg-white border border-emerald-200/60 text-slate-800 font-mono text-base focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all placeholder:text-slate-500/30 shadow-xs"
              />
              <p className="text-[10px] text-slate-500/60">
                💡 Prueba con documento + tarjeta del mismo empleado registrados en el padrón.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <ScanLine className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'ANALIZANDO CREDENCIAL...' : 'ESCANEAR EN TORNIQUETE'}
            </button>
          </form>
        </div>

        {/* Panel de Resultado Animado */}
        <div className="lg:col-span-7 flex flex-col justify-center min-h-[480px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full h-full min-h-[450px] rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-emerald-200/40 flex flex-col items-center justify-center p-12 relative overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    className="w-32 h-32 rounded-full border-2 border-emerald-600/40 absolute"
                  />
                  <motion.div
                    animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, ease: 'easeOut' }}
                    className="w-32 h-32 rounded-full border-2 border-emerald-600/20 absolute"
                  />
                </div>
                <ScanLine className="w-16 h-16 text-emerald-600 relative z-10 animate-bounce" />
                <h3 className="text-emerald-600 font-mono font-bold mt-6 relative z-10 tracking-widest animate-pulse text-sm">
                  VALIDANDO PERMISOS Y BIOMETRÍA...
                </h3>
              </motion.div>
            ) : resultado ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className={`rounded-[2.5rem] overflow-hidden ${colors[resultado.estado].bg} border ${colors[resultado.estado].border} ${colors[resultado.estado].glow} p-8 relative`}
              >
                <div className="text-center mb-6 relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.15 }}
                    className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${colors[resultado.estado].iconBg} border`}
                  >
                    {resultado.estado === 'AUTORIZADO' && <CheckCircle2 className={`w-10 h-10 ${colors[resultado.estado].icon}`} />}
                    {resultado.estado === 'DENEGADO' && <XCircle className={`w-10 h-10 ${colors[resultado.estado].icon}`} />}
                    {resultado.estado === 'NO_REGISTRADO' && <AlertCircle className={`w-10 h-10 ${colors[resultado.estado].icon}`} />}
                  </motion.div>
                  <h2 className={`text-3xl font-heading font-black tracking-tight ${colors[resultado.estado].text}`}>
                    {resultado.estado === 'AUTORIZADO' ? 'ACCESO OTORGADO' : resultado.estado === 'DENEGADO' ? 'ACCESO DENEGADO' : 'NO REGISTRADO'}
                  </h2>
                </div>

                {resultado.perfil && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-black/5 shadow-xs"
                  >
                    <div className="flex items-center gap-5 border-b border-gray-200/60 pb-5 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50/40 border border-emerald-200/40 flex items-center justify-center text-3xl">
                        {resultado.perfil.fotoPerfil ? (
                          <img src={resultado.perfil.fotoPerfil} alt="Perfil" className="w-full h-full rounded-2xl object-cover" />
                        ) : '👤'}
                      </div>
                      <div>
                        <p className={`text-lg font-heading font-bold ${colors[resultado.estado].text}`}>
                          {resultado.perfil.nombres} {resultado.perfil.apellidos}
                        </p>
                        <p className="text-xs text-slate-500/70">{resultado.perfil.departamentoNombre || 'Personal Autorizado'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-500/80">
                      <div>
                        <span className="text-slate-500/50 block mb-1">Documento Identidad</span>
                        <span className="font-mono font-bold text-slate-800">{resultado.perfil.tipoDocumento} {resultado.perfil.numeroDocumento}</span>
                      </div>
                      <div>
                        <span className="text-slate-500/50 block mb-1">Estado de Credencial</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white border border-emerald-200/40 font-bold">
                          {resultado.perfil.estado}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500/50 block mb-1">Área Principal</span>
                        <span className="font-semibold text-slate-800">{resultado.perfil.areaPrincipalNombre || 'Laboratorio Central'}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mensaje de Resultado con el color EXACTO según el estado */}
                {resultado.motivo && (
                  <div className={`mt-5 p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 shadow-xs ${colors[resultado.estado].alertBg}`}>
                    {resultado.estado === 'AUTORIZADO' ? (
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{resultado.motivo}</span>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between text-[11px] text-slate-500/50 font-mono">
                  <span>LOG: {new Date(resultado.timestamp).toLocaleTimeString()}</span>
                  <span>ZONA: {resultado.areaConsultada}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full min-h-[450px] rounded-[2.5rem] bg-emerald-50/20 border border-emerald-200/40 border-dashed flex flex-col items-center justify-center p-12 text-slate-500/40"
              >
                <ScanLine className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-heading font-bold">ESCLUSAS EN ESPERA DE LECTURA</p>
                <p className="text-xs text-slate-500/50 mt-1">Ingresa una credencial a la izquierda para simular el paso</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
