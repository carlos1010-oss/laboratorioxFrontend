'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ScanLine, CheckCircle2, XCircle, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface AreaPublica {
  id: number;
  codigo: string;
  nombre: string;
  activa?: boolean;
}

interface ResultadoPublico {
  numeroDocumentoIngresado?: string;
  codigoTarjetaRfid?: string;
  nombreArea?: string;
  resultado: 'AUTORIZADO' | 'DENEGADO' | 'NO_REGISTRADO';
  color?: string;
  motivo?: string;
  fechaHora?: string;
}

export default function MolinetePublicoPage() {
  const [tipo, setTipo] = useState<'DOCUMENTO' | 'RFID'>('DOCUMENTO');
  const [identificador, setIdentificador] = useState('');
  const [areas, setAreas] = useState<AreaPublica[]>([]);
  const [areaId, setAreaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carga pública de áreas (sin token). Si falla, se deja el select vacío.
  useEffect(() => {
    fetch(`${API_BASE}/publico/areas`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: AreaPublica[]) => {
        const activas = Array.isArray(data) ? data.filter((a) => a.activa !== false) : [];
        setAreas(activas);
        if (activas.length > 0) setAreaId(String(activas[0].id));
      })
      .catch(() => setAreas([]));
  }, []);

  const handleValidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultado(null);
    if (!identificador.trim()) {
      setError('Ingresa tu documento o tarjeta.');
      return;
    }
    if (!areaId) {
      setError('Selecciona el área a la que quieres ingresar.');
      return;
    }
    setLoading(true);
    try {
      // Sin Authorization: es el endpoint público del kiosco (F-35)
      const res = await fetch(`${API_BASE}/publico/accesos/molinete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroDocumento: tipo === 'DOCUMENTO' ? identificador.trim() : undefined,
          codigoTarjetaRfid: tipo === 'RFID' ? identificador.trim() : undefined,
          areaId: parseInt(areaId, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'No se pudo validar el acceso.');
      }
      const data: ResultadoPublico = await res.json();
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const colorBox =
    resultado?.resultado === 'AUTORIZADO'
      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
      : resultado?.resultado === 'DENEGADO'
        ? 'bg-red-50 border-red-300 text-red-950'
        : 'bg-amber-50 border-amber-300 text-amber-950';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">Z</div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Zone Control — Ingreso de personal</p>
            <p className="text-[11px] text-slate-500">Molinete público · sin inicio de sesión</p>
          </div>
        </div>
        <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-10 space-y-6">
        <form onSubmit={handleValidar} className="bg-white p-6 rounded-3xl border shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {(['DOCUMENTO', 'RFID'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                  tipo === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                {t === 'DOCUMENTO' ? 'Documento' : 'Tarjeta RFID'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Área de destino</label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecciona un área…</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
            {areas.length === 0 && (
              <p className="text-[11px] text-slate-400 mt-1">No se pudieron cargar las áreas. Verifica que el backend esté en línea.</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {tipo === 'DOCUMENTO' ? 'Número de documento' : 'Código de tarjeta'}
            </label>
            <input
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder={tipo === 'DOCUMENTO' ? 'Ej. 1012345678' : 'Ej. RFID-001'}
              className="w-full px-5 py-4 rounded-xl border font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ScanLine className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'VALIDANDO…' : 'VALIDAR INGRESO'}
          </button>
        </form>

        {error && <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>}

        {resultado && (
          <div className={`rounded-3xl border p-8 text-center ${colorBox}`}>
            {resultado.resultado === 'AUTORIZADO' && <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-600" />}
            {resultado.resultado === 'DENEGADO' && <XCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />}
            {resultado.resultado === 'NO_REGISTRADO' && <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-600" />}
            <h2 className="text-2xl font-black">
              {resultado.resultado === 'AUTORIZADO' ? 'ACCESO PERMITIDO' : resultado.resultado === 'DENEGADO' ? 'ACCESO DENEGADO' : 'NO REGISTRADO'}
            </h2>
            <p className="text-xs mt-1 opacity-70">
              {resultado.nombreArea} · {resultado.fechaHora ? new Date(resultado.fechaHora).toLocaleString() : ''}
            </p>
            {resultado.motivo && (
              <p className="mt-4 text-sm font-semibold inline-flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5" /> {resultado.motivo}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
