'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { api, extraerMensajeError } from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { toast } from 'sonner';
import { ImportacionResultado } from '@/types';

export default function CargaMasivaPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [pasoTexto, setPasoTexto] = useState('');
  
  // Alertas interactivas
  const [alertaExito, setAlertaExito] = useState(false);
  const [alertaError, setAlertaError] = useState(false);

  const [resultado, setResultado] = useState<
    (ImportacionResultado & { loteId: string }) | null
  >(null);

  const { agregarNotificacion } = useNotifications();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const MAX_CSV_BYTES = 5 * 1024 * 1024;

  const validarArchivo = (f: File): boolean => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      alert('Por favor suba un archivo en formato .CSV');
      return false;
    }
    if (f.size > MAX_CSV_BYTES) {
      alert('El archivo supera el tamaño máximo permitido de 5 MB.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (validarArchivo(f)) {
        setFile(f);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (validarArchivo(f)) {
        setFile(f);
      }
    }
  };

  const handleProcesar = async () => {
    if (!file) return;
    setProcesando(true);
    setResultado(null);
    setAlertaExito(false);
    setAlertaError(false);
    setProgreso(15);
    setPasoTexto('Validando sintaxis y encabezados de columnas CSV...');

    setTimeout(() => {
      setProgreso(45);
      setPasoTexto('Verificando duplicados y reglas de negocio en base de datos...');
    }, 600);

    setTimeout(() => {
      setProgreso(80);
      setPasoTexto('Insertando registros aprobados y generando bitácora...');
    }, 1200);

    try {
      const form = new FormData();
      form.append('archivo', file);

      const { data } = await api.post<ImportacionResultado>(
        '/personal/empleados/importar-csv',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const loteId = `BATCH-${Date.now().toString().slice(-6)}`;

      setProgreso(100);
      setPasoTexto('Carga masiva finalizada con éxito.');
      setResultado({ ...data, loteId });
      setAlertaExito(true);
      setAlertaError(data.fallidos > 0);

      if (data.fallidos > 0) {
        toast.success(
          `Se importaron ${data.exitosos} de ${data.totalProcesados} empleados, con ${data.fallidos} rechazados.`
        );
      } else {
        toast.success(`Carga masiva completada: ${data.exitosos} empleados importados correctamente.`);
      }

      agregarNotificacion({
        titulo: '📊 Carga Masiva de Personal Procesada',
        mensaje: `Lote ${loteId} importó ${data.exitosos} empleados con éxito${
          data.fallidos > 0 ? ` y ${data.fallidos} rechazados.` : '.'
        }`,
        tipo: 'PERSONAL',
        rolesDestino: ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
        accionUrl: '/dashboard/carga-masiva',
        detallesAuditoria: {
          evento: 'Importación Masiva de Personal',
          modulo: 'Gestión de Personal',
          operacion: 'CARGA_MASIVA',
          entidadInvolucrada: `Lote ${loteId}`,
          valorNuevo: `{"exitosos": ${data.exitosos}, "fallidos": ${data.fallidos}}`,
          resultado: data.fallidos > 0 ? 'COMPLETADO CON OBSERVACIONES' : 'EXITOSO',
        },
      });
    } catch (err) {
      setProgreso(0);
      setPasoTexto('');
      const msg = extraerMensajeError(err, 'No fue posible procesar el archivo CSV.');
      toast.error(msg);
      agregarNotificacion({
        titulo: '⚠️ Fallo en Carga Masiva de Personal',
        mensaje: msg,
        tipo: 'PERSONAL',
        rolesDestino: ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
        accionUrl: '/dashboard/carga-masiva',
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleReiniciar = () => {
    setFile(null);
    setResultado(null);
    setAlertaExito(false);
    setAlertaError(false);
    setProgreso(0);
    setPasoTexto('');
  };

  const descargarPlantilla = async () => {
    try {
      const res = await api.get('/personal/empleados/plantilla-csv', { responseType: 'blob' });
      const nombreMatch = /filename="?([^";]+)"?/.exec(res.headers['content-disposition'] || '');
      const nombre = nombreMatch ? nombreMatch[1] : 'plantilla_empleados.csv';

      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Plantilla CSV descargada correctamente.');
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible descargar la plantilla CSV.'));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-800">Carga Masiva de Personal</h1>
          <p className="text-xs text-slate-500/70 mt-1">
            Incorporación por archivo plano CSV con validación previa de integridad (RF F-13/F-14/F-15, CU-05).
          </p>
        </div>

        <button
          onClick={descargarPlantilla}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200/60 hover:bg-emerald-50/50 text-slate-500 font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Descargar Plantilla CSV
        </button>
      </div>

      {/* 1. SECCIÓN DE CARGA (SOLO SE MUESTRA SI NO SE HA PROCESADO AÚN) */}
      {!resultado && (
        <div className="space-y-6">
          {/* Zona Drag & Drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-10 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center ${
              dragActive
                ? 'border-emerald-600 bg-emerald-50/60 scale-[1.01]'
                : file
                ? 'border-emerald-600 bg-emerald-50/40'
                : 'border-emerald-200/80 bg-white'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm transition-all ${
                file ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {file ? <FileSpreadsheet className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
            </div>

            <h3 className="font-heading font-bold text-base text-slate-800 mb-1">
              {file ? `Archivo Seleccionado: ${file.name}` : 'Arrastre su archivo CSV o haga clic para examinar'}
            </h3>
            <p className="text-xs text-slate-500/60 mb-4 max-w-sm">
              {file
                ? `Tamaño: ${(file.size / 1024).toFixed(1)} KB — Listo para procesar`
                : 'Formato requerido: CSV delimitado por comas con codificación UTF-8.'}
            </p>

            <label className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-200/30 text-slate-800 font-semibold text-xs transition-all">
              {file ? 'Cambiar Archivo' : 'Seleccionar Archivo CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Barra de Progreso durante el procesamiento */}
          {procesando && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-200/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  {pasoTexto}
                </span>
                <span className="font-mono text-emerald-600">{progreso}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Botón de Procesar */}
          {file && !procesando && (
            <div className="flex justify-end">
              <button
                onClick={handleProcesar}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Iniciar Carga Masiva y Validación
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. SECCIÓN INTERACTIVA TRAS LA CARGA (LA ZONA DE SUBIDA DESAPARECE AUTOMÁTICAMENTE) */}
      {resultado && (
        <div className="space-y-6">
          {/* ALERTAS INTERACTIVAS */}
          {alertaExito && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-200 text-emerald-800 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-emerald-900">
                    ¡Carga Masiva Completada con Éxito! (Lote #{resultado.loteId})
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Se han validado y registrado <strong>{resultado.exitosos} empleados</strong> en la base de datos de producción con sus respectivas credenciales activas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlertaExito(false)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {alertaError && resultado.fallidos > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-200 text-amber-800 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-amber-900">
                    Atención: Se detectaron {resultado.fallidos} inconsistencias en el archivo
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Estas filas no fueron incorporadas para proteger la integridad de los datos. Revise el detalle a continuación para corregir el archivo original.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlertaError(false)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tarjetas de Métricas de Ingesta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Registros Exitosos</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-heading font-extrabold text-emerald-900 mt-1">
                {resultado.exitosos}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">Incorporados a tabla de Personal</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Inconsistencias / Rechazados</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-heading font-extrabold text-red-900 mt-1">
                {resultado.fallidos}
              </p>
              <span className="text-[11px] text-red-700 font-medium">Rechazados por validación previa</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Tasa de Efectividad</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-heading font-extrabold text-emerald-600 mt-1">
                {resultado.totalProcesados > 0
                  ? ((resultado.exitosos / resultado.totalProcesados) * 100).toFixed(1)
                  : '0.0'}%
              </p>
              <span className="text-[11px] text-slate-500/70 font-medium">Lote #{resultado.loteId}</span>
            </div>
          </div>

          {/* Detalle de Errores Encontrados */}
          {resultado.errores.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-200/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/20 pb-3">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Detalle de Filas Rechazadas (Auditoría de Ingesta)</span>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">Total inconsistencias: {resultado.fallidos}</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-red-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-red-50 text-red-900 font-bold">
                    <tr>
                      <th className="p-3">Fila</th>
                      <th className="p-3" colSpan={2}>Motivo del Rechazo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 bg-white">
                    {resultado.errores.map((err, idx) => {
                      const filaMatch = /l[ií]nea\s+(\d+)/i.exec(err);
                      return (
                        <tr key={idx} className="hover:bg-red-50/40">
                          <td className="p-3 font-mono font-bold text-red-700">
                            {filaMatch ? `Fila #${filaMatch[1]}` : `Registro #${idx + 1}`}
                          </td>
                          <td className="p-3 text-red-700 font-medium" colSpan={2}>{err}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Barra de Acciones Finales */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleReiniciar}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200/60 text-slate-800 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-all cursor-pointer w-full sm:w-auto justify-center"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              Subir Otro Archivo CSV
            </button>

            <Link
              href="/dashboard/personal"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-600/90 shadow-md transition-all w-full sm:w-auto justify-center"
            >
              <Database className="w-4 h-4" />
              Ver Empleados en Padrón Activo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
