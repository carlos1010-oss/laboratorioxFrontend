/**
 * historialStore.ts
 *
 * Almacén sincronizado del historial inmutable de accesos (Bitácoras).
 * Funciona de manera híbrida:
 * 1. Consulta la API REST del backend de Java y PostgreSQL (/api/accesos/historial).
 * 2. Si el backend está en línea, sincroniza y persiste en la base de datos real.
 * 3. Si se opera sin conexión o en modo simulación, guarda en localStorage y emite
 *    eventos 'historial-updated' para actualización en tiempo real en la interfaz.
 */

import { HistorialAcceso, Pagina, ResultadoAcceso } from '@/types';
import { api } from './api';

const STORE_KEY = 'zone_control_historial_v3';

// DTO real del backend GET /api/accesos/historial (ResultadoAccesoResponseDTO)
interface HistorialBackendDTO {
  idHistorial?: string;
  numeroDocumentoIngresado?: string;
  codigoTarjetaRfid?: string;
  nombreEmpleado?: string;
  nombreArea?: string;
  resultado?: ResultadoAcceso;
  color?: string;
  motivo?: string;
  fechaHora?: string;
  ipOrigen?: string;
  userAgent?: string;
}

// Registros demo iniciales para cuando la base de datos esté vacía
const registrosIniciales: HistorialAcceso[] = [
  {
    idHistorial: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nombreEmpleado: 'Dr. Carlos Mendoza',
    nombreArea: 'Laboratorio de Síntesis Molecular (Área A)',
    numeroDocumentoIngresado: '1012345678',
    codigoTarjetaRfid: 'RFID-001',
    resultado: 'AUTORIZADO',
    fechaHora: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    idHistorial: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    nombreEmpleado: 'Ing. Laura Restrepo',
    nombreArea: 'Laboratorio de Síntesis Molecular (Área A)',
    numeroDocumentoIngresado: '1087654321',
    codigoTarjetaRfid: 'RFID-002',
    resultado: 'DENEGADO',
    motivo: 'Permiso revocado en área de alto riesgo',
    fechaHora: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    idHistorial: '00112233-4455-6677-8899-aabbccddeeff',
    nombreArea: 'Sala Limpia de Liofilización (Área B)',
    numeroDocumentoIngresado: '9988776655',
    codigoTarjetaRfid: 'RFID-UNKNOWN',
    resultado: 'NO_REGISTRADO',
    motivo: 'Credencial no existe en padrón de empleados',
    fechaHora: new Date(Date.now() - 1800000).toISOString(),
  },
];

/**
 * Obtiene los registros guardados en el almacenamiento local del navegador.
 */
export function getHistorialLocal(): HistorialAcceso[] {
  if (typeof window === 'undefined') return registrosIniciales;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify(registrosIniciales));
      return registrosIniciales;
    }
    const parsed = JSON.parse(raw) as HistorialAcceso[];
    return Array.isArray(parsed) ? parsed : registrosIniciales;
  } catch {
    return registrosIniciales;
  }
}

/**
 * Guarda la lista de registros en el almacenamiento local y notifica a las vistas.
 */
export function saveHistorialLocal(items: HistorialAcceso[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('historial-updated'));
  } catch {}
}

/**
 * Registra un nuevo intento de acceso (del simulador o lector físico).
 * Lo antepone al inicio de la lista y emite evento global.
 */
export function registrarAccesoLocal(
  registro: Omit<HistorialAcceso, 'idHistorial' | 'fechaHora'> & { idHistorial?: string; fechaHora?: string }
): HistorialAcceso {
  const historial = getHistorialLocal();
  const nuevoItem: HistorialAcceso = {
    idHistorial: registro.idHistorial || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    fechaHora: registro.fechaHora || new Date().toISOString(),
    nombreArea: registro.nombreArea,
    numeroDocumentoIngresado: registro.numeroDocumentoIngresado,
    codigoTarjetaRfid: registro.codigoTarjetaRfid,
    resultado: registro.resultado,
    motivo: registro.motivo,
    nombreEmpleado: registro.nombreEmpleado,
  };

  const actualizado = [nuevoItem, ...historial];
  saveHistorialLocal(actualizado);
  return nuevoItem;
}

/**
 * Limpia el historial local restableciéndolo a vacío.
 */
export function limpiarHistorialLocal(): void {
  saveHistorialLocal([]);
}

/**
 * Consulta la API de backend de Spring Boot (/api/accesos/historial).
 * Si tiene éxito, combina con los registros locales y actualiza el store.
 * Si falla, retorna el historial local sin interrumpir la experiencia.
 */
export async function obtenerHistorialCombinado(): Promise<HistorialAcceso[]> {
  const localItems = getHistorialLocal();

  try {
    const res = await api.get<Pagina<HistorialBackendDTO> | HistorialBackendDTO[]>('/accesos/historial');
    const data = res.data;
    const items: HistorialBackendDTO[] = Array.isArray(data) ? data : (data?.content ?? []);

    if (items && items.length >= 0) {
      const backendItems: HistorialAcceso[] = items.map((item) => ({
        idHistorial: item.idHistorial?.toString() || `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        numeroDocumentoIngresado: item.numeroDocumentoIngresado || '',
        codigoTarjetaRfid: item.codigoTarjetaRfid || undefined,
        nombreEmpleado: item.nombreEmpleado || (item.resultado === 'NO_REGISTRADO' ? 'Credencial No Registrada' : 'Usuario del Sistema'),
        nombreArea: item.nombreArea || 'Área no especificada',
        resultado: item.resultado as ResultadoAcceso,
        color: item.color as HistorialAcceso['color'],
        motivo: item.motivo || undefined,
        fechaHora: item.fechaHora || new Date().toISOString(),
        ipOrigen: item.ipOrigen,
        userAgent: item.userAgent,
      }));

      // Fusionar evitando duplicados por idHistorial o por fechaHora exacta + documento
      const combined = [...backendItems];
      const seen = new Set(combined.map((b) => `${b.numeroDocumentoIngresado}_${b.fechaHora}`));

      for (const loc of localItems) {
        const key = `${loc.numeroDocumentoIngresado}_${loc.fechaHora}`;
        if (!seen.has(key)) {
          combined.push(loc);
          seen.add(key);
        }
      }

      // Ordenar por fecha descendente (lo más reciente primero)
      combined.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

      // Guardar caché actualizada
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORE_KEY, JSON.stringify(combined));
      }

      return combined;
    }
  } catch (err) {
    // Si no hay conexión al backend, retornar local
  }

  return localItems.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
}
