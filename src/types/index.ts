// Tipos alineados al contrato real del backend Spring Boot (Laboratorio XYZ).

export type RolUsuario = 'ADMINISTRADOR' | 'GESTOR_PERSONAL' | 'SUPERVISOR_ACCESOS';

export type EstadoUsuario = 'ACTIVO' | 'BLOQUEADO' | 'INACTIVO';

// El backend usa ACTIVO | INACTIVO | BLOQUEADO (sin REVOCADO/SUSPENDIDO).
export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export type ResultadoAcceso = 'AUTORIZADO' | 'DENEGADO' | 'NO_REGISTRADO';

// Semáforo de la respuesta del molinete (F-22).
export type ColorSemafaro = 'VERDE' | 'ROJO' | 'AMARILLO';

export type TipoOperacionAuditoria =
  | 'CREACION'
  | 'MODIFICACION'
  | 'BLOQUEO'
  | 'DESBLOQUEO'
  | 'DESCARGA'
  | 'ELIMINACION_LOGICA';

export type EstadoSincronizacion = 'EXITOSO' | 'EN_REINTENTO' | 'FALLIDO';

export type NivelRiesgo = 'ALTO' | 'MEDIO' | 'BAJO';

// Página estándar Spring Data (GET /api/personal/empleados, /api/accesos/historial, /api/auditoria).
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UsuarioAuth {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  mockPass?: string;
}

// GET /api/personal/empleados  (EmpleadoResponseDTO)
export interface Empleado {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  departamentoId: number;
  departamentoNombre?: string;
  codigoTarjetaRfid?: string;
  estado: EstadoEmpleado;
  motivoCambioEstado?: string;
  createdAt?: string;
  // Campos opcionales mantenidos para la UI (el backend no los expone en empleados;
  // las zonas autorizadas viven en el módulo de autorizaciones F-21).
  areaPrincipalNombre?: string;
  areasAutorizadas?: string[];
  fotoPerfil?: string;
}

// POST /api/personal/empleados/importar-csv  (ImportacionResultadoDTO)
export interface ImportacionResultado {
  totalProcesados: number;
  exitosos: number;
  fallidos: number;
  errores: string[];
}

// GET /api/catalogos/departamentos  (DepartamentoResponseDTO)
export interface Departamento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt?: string;
}

// GET /api/catalogos/areas-restringidas  (AreaRestringidaResponseDTO)
export interface AreaRestringida {
  id: number;
  codigo: string;
  nombre: string;
  nivelRiesgo: NivelRiesgo;
  descripcion: string;
  activa: boolean;
  createdAt?: string;
}

// GET /api/accesos/historial  (ResultadoAccesoResponseDTO)
export interface HistorialAcceso {
  idHistorial: string;
  numeroDocumentoIngresado: string;
  codigoTarjetaRfid?: string;
  nombreEmpleado?: string;
  nombreArea?: string;
  resultado: ResultadoAcceso;
  color?: ColorSemafaro;
  motivo?: string;
  fechaHora: string;
  ipOrigen?: string;
  userAgent?: string;
}

// GET /api/auditoria  (AuditoriaResponseDTO)
export interface BitacoraAuditoria {
  id: string;
  timestamp: string;
  usuarioId?: number;
  nombreUsuario?: string;
  direccionIp?: string;
  tipoOperacion: TipoOperacionAuditoria;
  moduloTabla: string;
  valorAnterior?: string;
  valorNuevo?: string;
}

// GET/POST /api/sincronizacion/historial  (SincronizacionResponseDTO)
export interface SincronizacionSocio {
  id: number;
  periodoInicio: string;
  periodoFin: string;
  departamentoId?: number;
  nombreDepartamento?: string;
  payloadJson?: string;
  estado: EstadoSincronizacion;
  intentosRealizados: number;
  codigoRespuestaHttp?: number;
  fechaEnvio?: string;
  fechaProximoReintento?: string;
  createdAt?: string;
}

// GET /api/sincronizacion/estado  (DashboardSincronizacionDTO)
export interface DashboardSincronizacion {
  integracionActiva: boolean;
  urlWebhook: string;
  correoAlerta: string;
  modoSimulacion: boolean;
  reintentosMaximos: number;
  ultimaEjecucion?: string;
  proximaEjecucion?: string;
  pendientes: number;
  exitosos: number;
  fallidos: number;
}

// GET/PUT /api/sincronizacion/configuracion  (ConfiguracionExportacionDTO)
export interface ConfiguracionExportacion {
  id?: number;
  frecuencia: string;
  diaSemana?: number;
  hora: string;
  formato: string;
  urlDestino?: string;
  correoAlerta?: string;
  activo: boolean;
  fechaProximaEjecucion?: string;
  ultimaEjecucion?: string;
}

// GET /api/sincronizacion/consolidado  (ConsolidadoResponseDTO + ConsolidadoDepartamentoDTO)
export interface ConsolidadoDepartamento {
  departamentoId?: number;
  departamentoNombre?: string;
  totalIntentos: number;
  totalAutorizados: number;
  totalDenegados: number;
  totalNoRegistrados: number;
}

export interface ConsolidadoAccesos {
  periodoInicio: string;
  periodoFin: string;
  totalIntentos: number;
  totalAutorizados: number;
  totalDenegados: number;
  totalNoRegistrados: number;
  porDepartamento: ConsolidadoDepartamento[];
}