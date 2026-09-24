'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { HistorialAcceso } from '@/types';
import {
  FileText,
  Search,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  obtenerHistorialCombinado,
  limpiarHistorialLocal,
  getHistorialLocal,
} from '@/lib/historialStore';

export default function HistorialAccesosPage() {
  // Los códigos RFID completos permitirían clonar tarjetas: se muestran
  // enmascarados en tabla y exportación (los 3 roles ven esta pantalla).
  const enmascararRfid = (codigo?: string | null): string => {
    if (!codigo) return '';
    const limpio = codigo.trim();
    if (limpio.length <= 4) return '••••';
    return `••••-${limpio.slice(-4)}`;
  };
  const [historial, setHistorial] = useState<HistorialAcceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
  const [filtroResultado, setFiltroResultado] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const cargarDatos = useCallback(async (mostrarToast = false) => {
    try {
      setLoading(true);
      const datos = await obtenerHistorialCombinado();
      setHistorial(datos);
      if (mostrarToast) toast.success('Historial actualizado desde el servidor');
    } catch {
      setHistorial(getHistorialLocal());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();

    const handleUpdate = () => {
      cargarDatos();
    };

    window.addEventListener('historial-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('historial-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [cargarDatos]);

  const filtrados = historial.filter((item) => {
    const texto = busqueda.trim().toLowerCase();
    const coincideTexto =
      !texto ||
      (item.numeroDocumentoIngresado && item.numeroDocumentoIngresado.toLowerCase().includes(texto)) ||
      (item.codigoTarjetaRfid && item.codigoTarjetaRfid.toLowerCase().includes(texto)) ||
      (item.nombreEmpleado && item.nombreEmpleado.toLowerCase().includes(texto)) ||
      (item.nombreArea && item.nombreArea.toLowerCase().includes(texto));

    const coincideEstado = filtroResultado === 'TODOS' || item.resultado === filtroResultado;

    let coincideFechas = true;
    if (item.fechaHora) {
      const fechaItem = new Date(item.fechaHora);
      if (fechaInicio) {
        coincideFechas = coincideFechas && fechaItem >= new Date(`${fechaInicio}T00:00:00`);
      }
      if (fechaFin) {
        coincideFechas = coincideFechas && fechaItem <= new Date(`${fechaFin}T23:59:59`);
      }
    }

    return coincideTexto && coincideEstado && coincideFechas;
  });

  const exportarCSV = () => {
    if (filtrados.length === 0) {
      toast.error('No hay registros en el filtro actual para exportar.');
      return;
    }

    let csv = 'ID_UNICO,TIMESTAMP_UTC,DOCUMENTO,CODIGO_RFID,PERSONA,AREA,RESULTADO,MOTIVO_DETALLE\n';
    filtrados.forEach((row) => {
      csv += `"${row.idHistorial}","${row.fechaHora}","${row.numeroDocumentoIngresado || ''}","${enmascararRfid(row.codigoTarjetaRfid)}","${row.nombreEmpleado || 'NO REGISTRADO'}","${row.nombreArea || ''}","${row.resultado}","${(row.motivo || 'Acceso correcto verificado').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bitacora_accesos_zone_control_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Archivo CSV exportado exitosamente.');
  };

    const exportarPDF = () => {
    if (filtrados.length === 0) {
      toast.error('No hay registros para generar el reporte.');
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Zone Control - Reporte de Auditoría y Accesos', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total de registros: ${filtrados.length}`, 14, 35);
    
    const tableColumn = ["Fecha/Hora", "Identificador", "Persona", "Área", "Resultado", "Motivo"];
    const tableRows: any[] = [];
    
    filtrados.forEach(item => {
      const rowData = [
        new Date(item.fechaHora).toLocaleString(),
        item.numeroDocumentoIngresado || enmascararRfid(item.codigoTarjetaRfid) || '-',
        item.nombreEmpleado || 'NO REGISTRADO',
        item.nombreArea || '-',
        item.resultado,
        item.motivo || 'OK'
      ];
      tableRows.push(rowData);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
    });
    
    doc.save(`bitacora_accesos_zone_control_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('Reporte PDF descargado exitosamente.');
  };

  const handleLimpiar = () => {
    if (window.confirm('¿Deseas reiniciar la bitácora local? Los registros de la base de datos persistirán en el servidor.')) {
      limpiarHistorialLocal();
      setHistorial([]);
      toast.success('Bitácora local restablecida.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-800 flex items-center gap-2">
            Historial Inmutable de Accesos
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 font-bold">
              {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
            </span>
          </h1>
          <p className="text-xs text-slate-500/70 mt-1">
            Auditoría continua de todos los intentos de acceso registrados en torniquetes, lectores biométricos y simulador.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => cargarDatos(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-200/60 text-slate-800 text-xs font-semibold hover:bg-emerald-50/40 shadow-xs transition-colors"
            title="Sincronizar con servidor"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button
            onClick={handleLimpiar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 shadow-xs transition-colors"
            title="Limpiar registros locales"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            Limpiar Local
          </button>
          <button
            onClick={exportarCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-200/60 text-slate-800 text-xs font-semibold hover:bg-emerald-50/40 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Exportar CSV
          </button>
          <button
            onClick={exportarPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-600/90 shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Título solo para impresión */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">Zone Control — Reporte Oficial de Auditoría y Bitácoras de Acceso</h1>
        <p className="text-xs text-gray-600">Generado el: {new Date().toLocaleString()} | Cumplimiento FDA 21 CFR Part 11</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200/40 shadow-xs flex flex-col gap-3 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500/50 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por documento, carnet, nombre o área..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-medium"
            />
          </div>
          <button 
            onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
              showFiltrosAvanzados 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-slate-50 text-slate-600 border-emerald-100 hover:bg-emerald-50'
            }`}
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
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-100 mt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Estado de Acceso</label>
                  <select
                    value={filtroResultado}
                    onChange={(e) => setFiltroResultado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 font-semibold"
                  >
                    <option value="TODOS">Todos los Resultados</option>
                    <option value="AUTORIZADO">Solo AUTORIZADOS</option>
                    <option value="DENEGADO">Solo DENEGADOS</option>
                    <option value="NO_REGISTRADO">Solo NO REGISTRADOS</option>
                  </select>
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
      </div>

      {/* Tabla de Historial */}
      <div className="bg-white rounded-2xl border border-emerald-200/40 shadow-xs overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50/60 flex items-center justify-center mb-3 text-emerald-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-slate-800 text-sm">No hay registros que coincidan</h3>
            <p className="text-xs text-slate-500/70 max-w-sm mt-1">
              No se han encontrado registros con los filtros actuales. Puedes ir al <strong>Simulador de Acceso</strong> para escanear documentos o carnets y generar eventos en tiempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/70 border-b border-emerald-200/30 text-slate-800 font-bold">
                <tr>
                  <th className="p-4">Timestamp (UTC / Local)</th>
                  <th className="p-4">Credencial / Identificador</th>
                  <th className="p-4">Persona Asociada</th>
                  <th className="p-4">Área Restringida</th>
                  <th className="p-4">Resultado</th>
                  <th className="p-4">Detalle / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-200/20">
                <AnimatePresence>
                  {filtrados.map((item, idx) => (
                    <motion.tr 
                      key={item.idHistorial} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="hover:bg-slate-50/80 transition-colors group relative"
                    >
                      <td className="p-4 font-mono text-[11px] text-slate-500/80 whitespace-nowrap">
                        {new Date(item.fechaHora).toLocaleString()}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="font-mono font-bold text-slate-800">{item.numeroDocumentoIngresado || '—'}</p>
                        {item.codigoTarjetaRfid && (
                          <span className="text-[10px] text-emerald-600 font-mono block" title="Código RFID enmascarado por seguridad">
                            {enmascararRfid(item.codigoTarjetaRfid)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {item.nombreEmpleado || (
                          <span className="text-gray-400 italic">No empadronado</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{item.nombreArea}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm ${
                            item.resultado === 'AUTORIZADO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.resultado === 'DENEGADO'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.resultado === 'AUTORIZADO' && <CheckCircle className="w-3 h-3" />}
                          {item.resultado === 'DENEGADO' && <XCircle className="w-3 h-3" />}
                          {item.resultado === 'NO_REGISTRADO' && <AlertCircle className="w-3 h-3" />}
                          {item.resultado}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500/70 text-[11px] max-w-xs break-words">
                        {item.motivo || 'Acceso concedido exitosamente'}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
