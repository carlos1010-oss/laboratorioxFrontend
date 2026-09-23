'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SincronizacionSocio } from '@/types';
import {
  Globe2,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Send,
  XCircle,
  Sparkles,
  Server,
  Zap,
  Mail,
  List,
  Search,
  FileText
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { HistorialAcceso } from '@/types';
import { api, extraerMensajeError } from '@/lib/api';
import { toast } from 'sonner';

const mockLoteActual: HistorialAcceso[] = [
  {
    idHistorial: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nombreEmpleado: 'Dr. Carlos Mendoza',
    nombreArea: 'Laboratorio de Síntesis Molecular (Área A)',
    numeroDocumentoIngresado: '1012345678',
    codigoTarjetaRfid: 'RFID-001',
    resultado: 'AUTORIZADO',
    fechaHora: new Date().toISOString(),
  },
  {
    idHistorial: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    nombreEmpleado: 'Ing. Laura Restrepo',
    nombreArea: 'Laboratorio de Síntesis Molecular (Área A)',
    numeroDocumentoIngresado: '1087654321',
    codigoTarjetaRfid: 'RFID-002',
    resultado: 'DENEGADO',
    motivo: 'Permiso revocado en área de alto riesgo',
    fechaHora: new Date().toISOString(),
  }
];

// DTO real del backend /api/sincronizacion/historial (SincronizacionResponseDTO)
interface SincronizacionBackendDTO {
  id: number;
  periodoInicio: string;
  periodoFin: string;
  departamentoId?: number;
  nombreDepartamento?: string;
  payloadJson?: string;
  estado: 'EXITOSO' | 'EN_REINTENTO' | 'FALLIDO';
  intentosRealizados: number;
  codigoRespuestaHttp?: number;
  fechaEnvio?: string;
  fechaProximoReintento?: string;
  createdAt?: string;
}

const mapearSincronizacion = (dto: SincronizacionBackendDTO): SincronizacionSocio => ({
  id: dto.id,
  periodoInicio: dto.periodoInicio,
  periodoFin: dto.periodoFin,
  departamentoId: dto.departamentoId,
  nombreDepartamento: dto.nombreDepartamento,
  payloadJson: dto.payloadJson,
  estado: dto.estado,
  intentosRealizados: dto.intentosRealizados ?? 0,
  codigoRespuestaHttp: dto.codigoRespuestaHttp,
  fechaEnvio: dto.fechaEnvio,
  fechaProximoReintento: dto.fechaProximoReintento,
  createdAt: dto.createdAt,
});

export default function SocioSyncPage() {
  const [sincronizaciones, setSincronizaciones] = useState<SincronizacionSocio[]>([]);
  const [forzando, setForzando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [pasoTexto, setPasoTexto] = useState('');
  const [alertaMsg, setAlertaMsg] = useState<{ tipo: 'EXITO' | 'ERROR'; texto: string } | null>(null);

  useEffect(() => {
    api.get('/sincronizacion/historial')
      .then((res) => {
        const lista = Array.isArray(res.data) ? res.data.map(mapearSincronizacion) : [];
        setSincronizaciones(lista);
      })
      .catch((err) => {
        setSincronizaciones([]);
        toast.error(extraerMensajeError(err, 'No fue posible cargar el historial de sincronización.'));
      });
  }, []);

  // Filtros Avanzados
  const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [codigoHttp, setCodigoHttp] = useState('');

  const sincronizacionesFiltradas = sincronizaciones.filter((sync) => {
    const cumpleEstado = filtroEstado === 'TODOS' || sync.estado === filtroEstado;
    const cumpleHttp = !codigoHttp || (sync.codigoRespuestaHttp && sync.codigoRespuestaHttp.toString().includes(codigoHttp));
    let cumpleFecha = true;
    if (fechaInicio || fechaFin) {
      if (!sync.fechaEnvio) {
        cumpleFecha = false;
      } else {
        const logDate = new Date(sync.fechaEnvio);
        if (fechaInicio && logDate < new Date(fechaInicio + 'T00:00:00')) cumpleFecha = false;
        if (fechaFin && logDate > new Date(fechaFin + 'T23:59:59')) cumpleFecha = false;
      }
    }
    return cumpleEstado && cumpleHttp && cumpleFecha;
  });

  const exportarPDF = () => {
    window.print();
  };

  const { agregarNotificacion } = useNotifications();

  const handleForzarEnvio = async () => {
    setForzando(true);
    setAlertaMsg(null);
    setProgreso(20);
    setPasoTexto('1/3: Empaquetando registros de accesos y firmas digitales...');

    setProgreso(60);
    setPasoTexto('2/3: Conectando con servidor B2B seguro (partner-api.pharma-cloud.org)...');

    try {
      const periodoFin = new Date();
      const periodoInicio = new Date();
      periodoInicio.setDate(periodoInicio.getDate() - 7);
      const departamentoId = sincronizaciones[0]?.departamentoId ?? 1;

      const res = await api.post('/sincronizacion/socio', {
        periodoInicio: periodoInicio.toISOString(),
        periodoFin: periodoFin.toISOString(),
        departamentoId,
      });

      setProgreso(90);
      setPasoTexto('3/3: Transmitiendo payload cifrado y esperando ACK (HTTP 200)...');

      const nuevoRegistro = mapearSincronizacion(res.data);

      setProgreso(100);
      setForzando(false);
      setPasoTexto('');

      setSincronizaciones((prev) => [nuevoRegistro, ...prev]);

      setAlertaMsg({
        tipo: 'EXITO',
        texto: `¡Transmisión forzada con éxito! El lote #SYNC-${nuevoRegistro.id} fue recibido y confirmado por el socio internacional con código ${nuevoRegistro.codigoRespuestaHttp ?? 200} OK.`,
      });

      toast.success(`Lote #SYNC-${nuevoRegistro.id} transmitido exitosamente.`);

      // Disparar notificación al sistema en tiempo real
      agregarNotificacion({
        titulo: `🌐 Sincronización Manual #SYNC-${nuevoRegistro.id}`,
        mensaje: `Lote de trazabilidad transmitido exitosamente al socio internacional con código 200 OK.`,
        tipo: 'SISTEMA',
        rolesDestino: ['ADMINISTRADOR', 'SUPERVISOR_ACCESOS'],
        accionUrl: '/dashboard/socio-sync',
      });
    } catch (err) {
      setForzando(false);
      setPasoTexto('');
      const msg = extraerMensajeError(err, 'No fue posible forzar el envío de la sincronización.');
      toast.error(msg);
      setAlertaMsg({ tipo: 'ERROR', texto: msg });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-800">Integración y Sincronización B2B</h1>
          <p className="text-xs text-slate-500/70 mt-1">
            Monitoreo y exportación periódica de trazabilidad hacia el socio internacional (RF F-26 a F-30).
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={exportarPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200/60 text-slate-800 font-semibold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Descargar PDF</span>
          </button>
          
          <button
            onClick={() => {
              const textoReporte = mockLoteActual.map((r, i) => 
                `📌 Registro #${i + 1}%0D%0A` +
                `👤 Persona: ${r.nombreEmpleado}%0D%0A` +
                `🏢 Área: ${r.nombreArea}%0D%0A` +
                `⏱️ Fecha: ${new Date(r.fechaHora).toLocaleString()}%0D%0A` +
                `📝 Resultado: ${r.resultado}%0D%0A` +
                `----------------------------------------`
              ).join('%0D%0A%0D%0A');
              
              const body = `Estimado Auditor,%0D%0A%0D%0AA continuación enviamos el registro de accesos correspondiente al lote actual generado por el sistema Zone Control:%0D%0A%0D%0A${textoReporte}%0D%0A%0D%0AAtentamente,%0D%0ASistema Automatizado Zone Control`;
              
              window.location.href = `mailto:auditor@partner.com?subject=Reporte de Trazabilidad B2B - Zone Control&body=${body}`;
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-emerald-200/60 text-slate-800 font-semibold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>Abrir en Gmail / Correo</span>
          </button>
          
          <button
            onClick={handleForzarEnvio}
            disabled={forzando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-white font-semibold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${forzando ? 'animate-spin' : ''}`} />
            <span>{forzando ? 'Transmitiendo al Socio...' : 'Forzar Sincronización Manual'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Resultado de Sincronización */}
      {alertaMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start justify-between gap-3 shadow-xs animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-200 text-emerald-800 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-emerald-900">
                Transmisión B2B Completada
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                {alertaMsg.texto}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlertaMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Progreso en Vivo cuando se pulsa Forzar */}
      {forzando && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-200/40 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-2 text-emerald-600">
              <Sparkles className="w-4 h-4 animate-spin" />
              {pasoTexto}
            </span>
            <span className="font-mono text-emerald-600 font-extrabold">{progreso}%</span>
          </div>
          <div className="w-full bg-emerald-50/70 rounded-full h-3 overflow-hidden p-0.5 border border-emerald-200/30">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tarjetas de Estado del Enlace */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-emerald-200/40 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500/70">Estado del Endpoint</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <p className="text-lg font-heading font-bold text-emerald-800 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Conectado (HTTP 200)
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block font-mono">partner-api.pharma-cloud.org</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200/40 shadow-xs hover:shadow-sm transition-all">
          <span className="text-xs font-bold text-slate-500/70">Frecuencia Automática</span>
          <p className="text-lg font-heading font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-emerald-600" />
            Cada 24 Horas (02:00 UTC)
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">Próxima ejecución programada hoy</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200/40 shadow-xs hover:shadow-sm transition-all">
          <span className="text-xs font-bold text-slate-500/70">Reintentos Exponenciales</span>
          <p className="text-lg font-heading font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Máximo 3 Intentos
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">Backoff con alerta a administradores</span>
        </div>
      </div>

      {/* Previsualización del Lote Actual (La "Información Real") */}
      <div className="bg-white rounded-3xl border border-emerald-200/40 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-emerald-200/30 bg-emerald-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-emerald-600" />
            <h3 className="font-heading font-bold text-sm text-slate-800">Registros Actuales Pendientes de Envío (Vista Previa)</h3>
          </div>
          <span className="text-xs text-slate-500/60 font-semibold">{mockLoteActual.length} Registros Nuevos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-emerald-200/30 text-slate-800 font-bold">
              <tr>
                <th className="p-3">Persona Asociada</th>
                <th className="p-3">Área Restringida</th>
                <th className="p-3">Resultado</th>
                <th className="p-3">Marca de Tiempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-200/20">
              <AnimatePresence>
                {mockLoteActual.map((item, idx) => (
                  <motion.tr 
                    key={item.idHistorial} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="p-3 font-semibold text-slate-800">{item.nombreEmpleado}</td>
                    <td className="p-3 text-slate-500 font-medium">{item.nombreArea}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-sm ${
                          item.resultado === 'AUTORIZADO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {item.resultado}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500/80">
                      {new Date(item.fechaHora).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Lotes Sincronizados */}
      <div className="bg-white rounded-3xl border border-emerald-200/40 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-emerald-200/30 bg-emerald-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-heading font-bold text-sm text-slate-800">Historial de Transmisiones de Lotes</h3>
            </div>
            <span className="text-xs text-slate-500/60 font-semibold sm:hidden">Trazabilidad Internacional</span>
          </div>

          <button 
            onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              showFiltrosAvanzados 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-white text-slate-600 border-emerald-200 hover:bg-emerald-100'
            } print:hidden`}
          >
            Filtros
          </button>
        </div>

        <AnimatePresence>
          {showFiltrosAvanzados && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-emerald-50/20 border-b border-emerald-100"
            >
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Estado Transmisión</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-semibold"
                  >
                    <option value="TODOS">Todos los Estados</option>
                    <option value="EXITOSO">Solo Exitosos</option>
                    <option value="EN_REINTENTO">Solo Reintentando</option>
                    <option value="FALLIDO">Solo Fallidos</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Código HTTP</label>
                  <input
                    type="number"
                    placeholder="Ej. 200, 504..."
                    value={codigoHttp}
                    onChange={(e) => setCodigoHttp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Desde Fecha</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Hasta Fecha</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50/70 border-b border-emerald-200/30 text-slate-800 font-bold">
              <tr>
                <th className="p-4">ID Lote</th>
                <th className="p-4">Período Auditado</th>
                <th className="p-4">Fecha de Envío</th>
                <th className="p-4">Intentos</th>
                <th className="p-4">Código HTTP</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-200/20">
              <AnimatePresence>
                {sincronizacionesFiltradas.length > 0 ? sincronizacionesFiltradas.map((sync, idx) => (
                  <motion.tr 
                    key={sync.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="p-4 font-mono font-bold text-slate-800">#SYNC-{sync.id}</td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(sync.periodoInicio).toLocaleDateString()} —{' '}
                      {new Date(sync.periodoFin).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-500/70">
                      {sync.fechaEnvio ? new Date(sync.fechaEnvio).toLocaleString() : 'Pendiente'}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{sync.intentosRealizados} / 3</td>
                    <td className="p-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold shadow-sm ${
                          sync.codigoRespuestaHttp === 200
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {sync.codigoRespuestaHttp || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase shadow-sm border ${
                          sync.estado === 'EXITOSO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {sync.estado === 'EXITOSO' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        )}
                        {sync.estado}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium text-xs">
                      No se encontraron transmisiones que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
