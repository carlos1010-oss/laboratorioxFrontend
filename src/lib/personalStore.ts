/**
 * personalStore.ts
 * 
 * Almacén compartido de empleados para el frontend Zone Control.
 * Persiste en localStorage para que tanto "Gestión de Personal" como
 * el "Simulador de Acceso" operen sobre la misma base de datos.
 */

import { Empleado } from '@/types';

const STORE_KEY = 'zone_control_personal_v2';

// Empleados demo iniciales que se cargan si el store está vacío
const empleadosIniciales: Empleado[] = [
  {
    id: 1,
    departamentoId: 1,
    departamentoNombre: 'Producción y Síntesis',
    areaPrincipalNombre: 'Laboratorio de Síntesis Molecular (Área A)',
    areasAutorizadas: [
      'Laboratorio de Síntesis Molecular (Área A)',
      'Sala Limpia de Liofilización (Área B)',
    ],
    tipoDocumento: 'CC',
    numeroDocumento: '1012345678',
    nombres: 'Carlos Andrés',
    apellidos: 'Mendoza Pérez',
    correo: 'carlos.mendoza@laboratorioxyz.com',
    telefono: '3109988776',
    codigoTarjetaRfid: 'RFID-001',
    estado: 'ACTIVO',
  },
  {
    id: 2,
    departamentoId: 2,
    departamentoNombre: 'Control de Calidad',
    areaPrincipalNombre: 'Almacén Central (Área C)',
    areasAutorizadas: ['Almacén Central (Área C)'],
    tipoDocumento: 'CC',
    numeroDocumento: '1087654321',
    nombres: 'Laura Sofía',
    apellidos: 'Restrepo Villa',
    correo: 'laura.restrepo@laboratorioxyz.com',
    telefono: '3201123344',
    codigoTarjetaRfid: 'RFID-002',
    estado: 'BLOQUEADO',
    motivoCambioEstado: 'Finalización de contrato temporal y auditoría de seguridad.',
  },
  {
    id: 3,
    departamentoId: 1,
    departamentoNombre: 'Producción y Síntesis',
    areaPrincipalNombre: 'Sala Limpia de Liofilización (Área B)',
    areasAutorizadas: ['Sala Limpia de Liofilización (Área B)'],
    tipoDocumento: 'CE',
    numeroDocumento: '98765432',
    nombres: 'Guillermo',
    apellidos: 'Von Hassen',
    correo: 'guillermo.von@laboratorioxyz.com',
    telefono: '3154432211',
    codigoTarjetaRfid: 'RFID-003',
    estado: 'INACTIVO',
    motivoCambioEstado: 'Incumplimiento de protocolo de esterilidad en esclusa.',
  },
];

/** Lee todos los empleados del localStorage. Si no hay datos, inicializa con los demos. */
export function getEmpleados(): Empleado[] {
  if (typeof window === 'undefined') return empleadosIniciales;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      // Primera vez: persistir los empleados demo
      localStorage.setItem(STORE_KEY, JSON.stringify(empleadosIniciales));
      return empleadosIniciales;
    }
    return JSON.parse(raw) as Empleado[];
  } catch {
    return empleadosIniciales;
  }
}

/** Persiste la lista completa de empleados en localStorage. */
export function saveEmpleados(empleados: Empleado[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(empleados));
  } catch {}
}

/**
 * Busca un empleado por su número de documento.
 * Retorna el empleado si existe, o null.
 */
export function buscarPorDocumento(numeroDocumento: string): Empleado | null {
  const empleados = getEmpleados();
  return empleados.find(
    (e) => e.numeroDocumento.trim() === numeroDocumento.trim()
  ) ?? null;
}

/**
 * Busca un empleado por código de tarjeta RFID.
 * Retorna el empleado si existe, o null.
 */
export function buscarPorRfid(codigoRfid: string): Empleado | null {
  const empleados = getEmpleados();
  return empleados.find(
    (e) => e.codigoTarjetaRfid?.trim().toUpperCase() === codigoRfid.trim().toUpperCase()
  ) ?? null;
}

/**
 * Agrega o actualiza un empleado en el store.
 */
export function agregarEmpleado(nuevoEmpleado: Empleado): void {
  const empleados = getEmpleados();
  // Si ya existe por documento, lo reemplaza
  const index = empleados.findIndex(e => e.numeroDocumento === nuevoEmpleado.numeroDocumento);
  if (index >= 0) {
    empleados[index] = { ...empleados[index], ...nuevoEmpleado };
  } else {
    // Si no tiene id, le asigna uno consecutivo
    if (!nuevoEmpleado.id) {
      const maxId = empleados.length > 0 ? Math.max(...empleados.map(e => e.id)) : 0;
      nuevoEmpleado.id = maxId + 1;
    }
    empleados.push(nuevoEmpleado);
  }
  saveEmpleados(empleados);
}

