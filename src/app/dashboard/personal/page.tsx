'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Empleado, EstadoEmpleado, Departamento, AreaRestringida, AutorizacionZona } from '@/types';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { api, extraerMensajeError } from '@/lib/api';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  Filter,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  CreditCard,
  Sparkles,
  Check,
  ShieldCheck,
  Award,
  X,
  FlaskConical,
  Microscope,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface CatalogoAreaLab {
  id: number;
  codigo: string;
  nombre: string;
  deptoAsociado: string;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
}

const catalogoLaboratoriosAreas: CatalogoAreaLab[] = [
  { id: 1, codigo: 'AREA-A', nombre: 'Laboratorio de Síntesis Molecular (Área A)', deptoAsociado: 'Producción y Síntesis', nivelRiesgo: 'ALTO' },
  { id: 2, codigo: 'AREA-B', nombre: 'Sala Limpia de Liofilización (Área B)', deptoAsociado: 'Producción y Síntesis', nivelRiesgo: 'MEDIO' },
  { id: 3, codigo: 'AREA-C', nombre: 'Almacén Central (Área C)', deptoAsociado: 'Control de Calidad', nivelRiesgo: 'BAJO' },
  { id: 4, codigo: 'AREA-D', nombre: 'Oficinas Administrativas (Área D)', deptoAsociado: 'Administración y Finanzas', nivelRiesgo: 'BAJO' },
];

export default function GestionPersonalPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [deptosCatalogo, setDeptosCatalogo] = useState<Departamento[]>([]);
  const [page, setPage] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [loadingLista, setLoadingLista] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [deptoFiltro, setDeptoFiltro] = useState('TODOS');
  const [areaFiltro, setAreaFiltro] = useState('TODAS');

  const size = 12;

  // Carga paginada y filtrada desde el backend (F-34)
  const cargarEmpleados = useCallback(async () => {
    setLoadingLista(true);
    try {
      const params: Record<string, string | number> = { page, size };
      if (busqueda.trim() && /^\d+$/.test(busqueda.trim())) params.documento = busqueda.trim();
      if (deptoFiltro !== 'TODOS') {
        const depto = deptosCatalogo.find((d) => d.nombre === deptoFiltro);
        if (depto) params.departamentoId = depto.id;
      }
      const res = await api.get('/personal/empleados', { params });
      const lista: Empleado[] = res.data.content ?? [];
      setTotalElementos(res.data.totalElements ?? 0);
      // El empleado del backend no trae sus zonas: se enriquecen con el
      // listado de autorizaciones (una sola petición) para no mostrar
      // "Área no asignada" a quien sí tiene permisos (F-21).
      try {
        const auts = await api.get('/accesos/autorizaciones');
        const porEmpleado = new Map<number, string[]>();
        const todas: Array<{ empleadoId: number; nombreArea?: string; activo: boolean }> =
          Array.isArray(auts.data) ? auts.data : [];
        for (const a of todas) {
          if (a?.activo && a.empleadoId != null && a.nombreArea) {
            const arr = porEmpleado.get(a.empleadoId) ?? [];
            arr.push(a.nombreArea);
            porEmpleado.set(a.empleadoId, arr);
          }
        }
        setEmpleados(
          lista.map((e) => {
            const zonas = porEmpleado.get(e.id);
            return {
              ...e,
              areaPrincipalNombre:
                zonas?.length
                  ? zonas.slice(0, 2).join(', ') + (zonas.length > 2 ? ` +${zonas.length - 2}` : '')
                  : undefined,
            };
          })
        );
      } catch {
        setEmpleados(lista);
      }
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible cargar el padrón de personal.'));
    } finally {
      setLoadingLista(false);
    }
  }, [page, busqueda, deptoFiltro, deptosCatalogo]);

  // Catálogo real de departamentos para filtros y el formulario
  useEffect(() => {
    api.get('/catalogos/departamentos')
      .then((res) => setDeptosCatalogo(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // Si el departamento por defecto no existe en el catálogo real, usar el primero real
  useEffect(() => {
    if (deptosCatalogo.length > 0 && !deptosCatalogo.some((d) => d.nombre === nuevoDepto)) {
      setNuevoDepto(deptosCatalogo[0].nombre);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptosCatalogo]);

  // Usuario autenticado (para registrar quién concede autorizaciones, F-21)
  const { user } = useAuth();

  // Catálogo real de áreas restringidas (con fallback a mocks si no hay backend).
  // El kiosco, el registro y los permisos usan esta misma fuente para no mostrar
  // zonas que no existen en la BD.
  const [areasReales, setAreasReales] = useState<AreaRestringida[]>([]);
  useEffect(() => {
    api.get('/catalogos/areas-restringidas')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) setAreasReales(res.data);
      })
      .catch(() => {});
  }, []);

  const areasCatalogo: CatalogoAreaLab[] = areasReales.length > 0
    ? areasReales.map((a) => ({
        id: a.id,
        codigo: a.codigo,
        nombre: a.nombre,
        deptoAsociado: '',
        nivelRiesgo: a.nivelRiesgo === 'ALTO' || a.nivelRiesgo === 'MEDIO' ? a.nivelRiesgo : 'BAJO',
      }))
    : catalogoLaboratoriosAreas;

  useEffect(() => {
    cargarEmpleados();
  }, [cargarEmpleados]);

  // Códigos RFID enmascarados por defecto: el código completo es visible en
  // paneles y permitiría clonar la tarjeta. Solo se revela bajo confirmación.
  const [rfidReveladas, setRfidReveladas] = useState<Record<number, boolean>>({});

  const toggleRevelarRfid = (empleadoId: number) => {
    if (!rfidReveladas[empleadoId]) {
      if (!window.confirm('Vas a mostrar el código RFID completo. Hazlo solo si necesitas enrolar la tarjeta física. ¿Continuar?')) {
        return;
      }
    }
    setRfidReveladas((prev) => ({ ...prev, [empleadoId]: !prev[empleadoId] }));
  };

  // Modales
  const [showRegistrarModal, setShowRegistrarModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);

  // Formulario con validaciones estrictas requeridas
  const [nuevoDoc, setNuevoDoc] = useState('');
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState('CC');
  const [nuevosNombres, setNuevosNombres] = useState('');
  const [nuevosApellidos, setNuevosApellidos] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoDepto, setNuevoDepto] = useState('Producción y Síntesis');
  const [nuevoLaboratorioPrincipal, setNuevoLaboratorioPrincipal] = useState('Laboratorio de Síntesis Molecular (Área A)');
  const [areasPermitidas, setAreasPermitidas] = useState<string[]>(['Laboratorio de Síntesis Molecular (Área A)']);
  const [showDropdownAreas, setShowDropdownAreas] = useState<boolean>(false);
  const [nuevoRfid, setNuevoRfid] = useState('');
  const [nuevoFotoPerfil, setNuevoFotoPerfil] = useState<string>(''); // base64 de la foto

  const { agregarNotificacion } = useNotifications();

  // Modal de Éxito Dinámico y Animado
  const [showExitoModal, setShowExitoModal] = useState(false);
  const [empleadoCreado, setEmpleadoCreado] = useState<Empleado | null>(null);

  // Modal de Confirmación de Bitácora / Auditoría Dinámico y Animado
  const [showBitacoraExitoModal, setShowBitacoraExitoModal] = useState(false);
  const [bitacoraInfo, setBitacoraInfo] = useState<{
    empleadoNombre: string;
    documento: string;
    estadoAnterior: string;
    nuevoEstado: string;
    motivo: string;
    codigoAuditoria: string;
  } | null>(null);

  // Errores de validación en tiempo real
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

  // Formulario de estado
  const [nuevoEstado, setNuevoEstado] = useState<EstadoEmpleado>('ACTIVO');
  const [motivoEstado, setMotivoEstado] = useState('');

  // Validación de Nombres: Solo letras, espacios, tildes y ñ (Sin números ni signos)
  const handleNombresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const sanitized = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    setNuevosNombres(sanitized);

    if (valor !== sanitized) {
      setErroresForm((prev) => ({ ...prev, nombres: 'El nombre solo debe contener letras (sin números ni signos).' }));
    } else {
      setErroresForm((prev) => {
        const c = { ...prev };
        delete c.nombres;
        return c;
      });
    }
  };

  // Validación de Apellidos: Solo letras, espacios, tildes y ñ (Sin números ni signos)
  const handleApellidosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const sanitized = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    setNuevosApellidos(sanitized);

    if (valor !== sanitized) {
      setErroresForm((prev) => ({ ...prev, apellidos: 'El apellido solo debe contener letras (sin números ni signos).' }));
    } else {
      setErroresForm((prev) => {
        const c = { ...prev };
        delete c.apellidos;
        return c;
      });
    }
  };

  // Manejo de Documento: Máximo 12 dígitos si es CC/Numérico
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 12) {
      setNuevoDoc(valor);
      if (valor.length < 6 && valor.length > 0) {
        setErroresForm((prev) => ({ ...prev, doc: 'La cédula debe contener entre 6 y 12 dígitos.' }));
      } else {
        setErroresForm((prev) => {
          const c = { ...prev };
          delete c.doc;
          return c;
        });
      }
    }
  };

  // Manejo de Teléfono Celular: Máximo 10 dígitos numéricos
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 10) {
      setNuevoTelefono(valor);
      if (valor.length !== 10 && valor.length > 0) {
        setErroresForm((prev) => ({ ...prev, tel: 'El número de celular debe tener exactamente 10 dígitos.' }));
      } else {
        setErroresForm((prev) => {
          const c = { ...prev };
          delete c.tel;
          return c;
        });
      }
    }
  };

  // Manejo de Correo Institucional
  const handleCorreoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setNuevoCorreo(valor);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (valor && !emailRegex.test(valor)) {
      setErroresForm((prev) => ({ ...prev, email: 'Formato de correo electrónico institucional inválido.' }));
    } else {
      setErroresForm((prev) => {
        const c = { ...prev };
        delete c.email;
        return c;
      });
    }
  };

  // Manejo de Código de Carnet / RFID: Máximo 14 caracteres
  const handleRfidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    if (valor.length <= 14) {
      setNuevoRfid(valor);
      if (valor.length > 0 && valor.length < 4) {
        setErroresForm((prev) => ({ ...prev, rfid: 'El número de carnet debe tener entre 4 y 14 caracteres.' }));
      } else {
        setErroresForm((prev) => {
          const c = { ...prev };
          delete c.rfid;
          return c;
        });
      }
    }
  };

  // Enmascara el código RFID mostrando solo los últimos 4 caracteres.
  const enmascararRfid = (codigo?: string): string => {
    if (!codigo) return '';
    const limpio = codigo.trim();
    if (limpio.length <= 4) return '••••';
    return `••••-${limpio.slice(-4)}`;
  };

  const handleToggleArea = (areaNombre: string) => {
    setAreasPermitidas((prev) =>
      prev.includes(areaNombre)
        ? prev.length > 1
          ? prev.filter((a) => a !== areaNombre)
          : prev
        : [...prev, areaNombre]
    );
  };

  const handleDeptoChange = (depto: string) => {
    setNuevoDepto(depto);
    const primerLabDelDepto = areasCatalogo.find((l) => l.deptoAsociado === depto);
    if (primerLabDelDepto) {
      setNuevoLaboratorioPrincipal(primerLabDelDepto.nombre);
      setAreasPermitidas([primerLabDelDepto.nombre]);
    }
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const coincideTexto =
      emp.numeroDocumento.includes(busqueda) ||
      `${emp.nombres} ${emp.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (emp.areaPrincipalNombre && emp.areaPrincipalNombre.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideDepto = deptoFiltro === 'TODOS' || emp.departamentoNombre === deptoFiltro;
    const coincideArea =
      areaFiltro === 'TODAS' ||
      emp.areaPrincipalNombre === areaFiltro ||
      (emp.areasAutorizadas && emp.areasAutorizadas.includes(areaFiltro));

    return coincideTexto && coincideDepto && coincideArea;
  });

  const handleRegistrarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevosNombres.trim() || !nuevosApellidos.trim()) {
      alert('Error: Debe ingresar nombres y apellidos válidos (solo letras).');
      return;
    }

    if (nuevoDoc.length < 6 || nuevoDoc.length > 12) {
      alert('Error: La cédula debe tener entre 6 y 12 dígitos.');
      return;
    }

    if (nuevoTelefono.length !== 10) {
      alert('Error: El celular debe contener exactamente 10 dígitos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoCorreo)) {
      alert('Error: Ingrese un correo electrónico válido (ejemplo: usuario@laboratorioxyz.com).');
      return;
    }

    const deptoObj = deptosCatalogo.find((d) => d.nombre === nuevoDepto);
    const departamentoId = deptoObj?.id ?? 1;

    const nuevo: Empleado = {
      id: Date.now(),
      departamentoId,
      departamentoNombre: nuevoDepto,
      areaPrincipalNombre: nuevoLaboratorioPrincipal,
      areasAutorizadas: areasPermitidas.length > 0 ? areasPermitidas : [nuevoLaboratorioPrincipal],
      tipoDocumento: nuevoTipoDoc,
      numeroDocumento: nuevoDoc,
      nombres: nuevosNombres.trim(),
      apellidos: nuevosApellidos.trim(),
      correo: nuevoCorreo.trim().toLowerCase(),
      telefono: nuevoTelefono,
      codigoTarjetaRfid: nuevoRfid.trim() ? nuevoRfid.trim() : undefined,
      estado: 'ACTIVO',
      fotoPerfil: nuevoFotoPerfil || undefined,
    };

    try {
      // F-11: alta real en PostgreSQL (EmpleadoRequestDTO)
      const res = await api.post('/personal/empleados', {
        tipoDocumento: nuevo.tipoDocumento,
        numeroDocumento: nuevo.numeroDocumento,
        nombres: nuevo.nombres,
        apellidos: nuevo.apellidos,
        correo: nuevo.correo,
        telefono: nuevo.telefono,
        departamentoId: nuevo.departamentoId,
        codigoTarjetaRfid: nuevo.codigoTarjetaRfid,
        estado: 'ACTIVO',
      });
      const creado: Empleado = {
        ...nuevo,
        id: res.data.id,
        departamentoNombre: res.data.departamentoNombre || nuevo.departamentoNombre,
        codigoTarjetaRfid: res.data.codigoTarjetaRfid || nuevo.codigoTarjetaRfid,
        createdAt: res.data.createdAt || new Date().toISOString(),
      };

      setEmpleadoCreado(creado);

      // F-21: conceder en el backend las zonas elegidas. Antes solo quedaban
      // en el store local y el molinete las denegaba ("sin autorización").
      try {
        const candidatas = Array.from(new Set([
          nuevoLaboratorioPrincipal,
          ...(areasPermitidas.length > 0 ? areasPermitidas : [nuevoLaboratorioPrincipal]),
        ]));
        if (user?.id == null) {
          if (candidatas.length > 0) {
            toast.warning('Empleado creado, pero asigna sus zonas en "Gestionar Permisos" (sin usuario asignador en sesión).');
          }
        } else {
          const noResueltas: string[] = [];
          for (const nombre of candidatas) {
            const areaReal = areasReales.find((a) => a.nombre === nombre);
            if (!areaReal) { noResueltas.push(nombre); continue; }
            try {
              await api.post('/accesos/autorizaciones', {
                empleadoId: res.data.id,
                areaId: areaReal.id,
                asignadoPorId: user.id,
              });
            } catch {
              noResueltas.push(nombre);
            }
          }
          if (noResueltas.length > 0) {
            toast.warning('Empleado creado. Zonas pendientes en "Gestionar Permisos": ' + noResueltas.join(', '));
          }
        }
      } catch {
        /* No bloquear el alta si falla la concesión; se asigna luego en Permisos */
      }

      // Notificación en el sistema global con auditoría completa
      agregarNotificacion({
        titulo: `👤 Alta de Personal: ${creado.nombres} ${creado.apellidos}`,
        mensaje: `Asignado a [${nuevo.areaPrincipalNombre}] (${creado.departamentoNombre}) con carnet [${creado.codigoTarjetaRfid || 'SIN_VINCULAR'}].`,
        tipo: 'PERSONAL',
        rolesDestino: ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
        accionUrl: '/dashboard/personal',
        detallesAuditoria: {
          evento: 'Alta y Asignación Biométrica de Personal',
          modulo: 'Gestión de Personal Farmacéutico',
          operacion: 'ALTA_PERSONAL',
          usuarioResponsable: 'Gestor de Personal',
          entidadInvolucrada: `${creado.tipoDocumento} ${creado.numeroDocumento} - ${creado.nombres} ${creado.apellidos}`,
          valorAnterior: null,
          valorNuevo: JSON.stringify({
            documento: creado.numeroDocumento,
            nombres: creado.nombres,
            apellidos: creado.apellidos,
            departamento: creado.departamentoNombre,
            area: nuevo.areaPrincipalNombre,
            rfid: creado.codigoTarjetaRfid,
            estado: 'ACTIVO',
          }),
          direccionIp: '127.0.0.1',
          resultado: 'REGISTRO EXITOSO',
        },
      });

      // Limpiar formulario, cerrar modal y recargar la primera página
      setNuevoDoc('');
      setNuevosNombres('');
      setNuevosApellidos('');
      setNuevoCorreo('');
      setNuevoTelefono('');
      setNuevoRfid('');
      setNuevoFotoPerfil('');
      setAreasPermitidas([areasCatalogo[0].nombre]);
      setNuevoLaboratorioPrincipal(areasCatalogo[0].nombre);
      setErroresForm({});
      setShowRegistrarModal(false);
      setShowExitoModal(true);
      setPage(0);
      cargarEmpleados();
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible registrar al empleado.'),
        { description: 'Verifica que el documento y el correo no estén ya registrados.' });
    }
  };

  const handleAbrirCambioEstado = (emp: Empleado) => {
    setEmpleadoSeleccionado(emp);
    setNuevoEstado(emp.estado);
    setMotivoEstado(emp.motivoCambioEstado || '');
    setShowEstadoModal(true);
  };

  const handleGuardarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoSeleccionado) return;

    if (nuevoEstado !== 'ACTIVO' && !motivoEstado.trim()) {
      setErroresForm((prev) => ({ ...prev, estadoMotivo: 'Es obligatorio ingresar el motivo del cambio de estado.' }));
      return;
    }

    const estadoPrevio = empleadoSeleccionado.estado;
    const codigoAudit = `AUD-SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // F-12/F-17: cambio de estado en PostgreSQL (EstadoEmpleado: ACTIVO|INACTIVO|BLOQUEADO)
      const res = await api.patch('/personal/empleados/' + empleadoSeleccionado.id + '/estado', null, {
        params: { nuevoEstado, motivo: motivoEstado.trim() || undefined },
      });

      const actualizado: Empleado = {
        ...empleadoSeleccionado,
        estado: nuevoEstado,
        motivoCambioEstado: motivoEstado.trim() || undefined,
        departamentoNombre: res.data.departamentoNombre || empleadoSeleccionado.departamentoNombre,
      };

      setEmpleados((prev) =>
        prev.map((emp) => (emp.id === empleadoSeleccionado.id ? actualizado : emp))
      );

      // Notificación en el sistema global con auditoría completa
      agregarNotificacion({
        titulo: `🛡️ Modificación de Estado (${nuevoEstado}): ${empleadoSeleccionado.nombres}`,
        mensaje: `Colaborador ${empleadoSeleccionado.nombres} ${empleadoSeleccionado.apellidos} cambió de [${estadoPrevio}] a [${nuevoEstado}]. Ref: ${codigoAudit}.`,
        tipo: nuevoEstado === 'ACTIVO' ? 'SISTEMA' : 'SEGURIDAD',
        rolesDestino: ['ADMINISTRADOR', 'SUPERVISOR_ACCESOS'],
        accionUrl: '/dashboard/personal',
        detallesAuditoria: {
          evento: 'Cambio de Estado y Concesión de Acceso',
          modulo: 'Gestión de Personal',
          operacion: nuevoEstado === 'ACTIVO' ? 'REACTIVACION_PERSONAL' : 'SUSPENSION_REVOCACION',
          usuarioResponsable: 'Gestor de Personal',
          entidadInvolucrada: `${empleadoSeleccionado.tipoDocumento} ${empleadoSeleccionado.numeroDocumento} - ${empleadoSeleccionado.nombres} ${empleadoSeleccionado.apellidos}`,
          valorAnterior: JSON.stringify({ estado: estadoPrevio }),
          valorNuevo: JSON.stringify({ estado: nuevoEstado, motivo: motivoEstado.trim() }),
          direccionIp: '127.0.0.1',
          resultado: nuevoEstado,
        },
      });

      // Configurar información para el modal de éxito animado
      setBitacoraInfo({
        empleadoNombre: `${empleadoSeleccionado.nombres} ${empleadoSeleccionado.apellidos}`,
        documento: empleadoSeleccionado.numeroDocumento,
        estadoAnterior: estadoPrevio,
        nuevoEstado: nuevoEstado,
        motivo: motivoEstado.trim() || 'Modificación administrativa autorizada',
        codigoAuditoria: codigoAudit,
      });

      setShowEstadoModal(false);
      setShowBitacoraExitoModal(true);
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible aplicar el cambio de estado.'));
    }
  };

  // ---- Autorizaciones de zona reales (F-21). Antes el botón "Gestionar
  // Permisos" solo abría el cambio de estado y las zonas nunca llegaban al backend.
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [autorizaciones, setAutorizaciones] = useState<AutorizacionZona[]>([]);
  const [loadingAutorizaciones, setLoadingAutorizaciones] = useState(false);
  const [areaAConceder, setAreaAConceder] = useState('');

  const cargarAutorizaciones = async (empleadoId: number) => {
    setLoadingAutorizaciones(true);
    try {
      const res = await api.get(`/accesos/autorizaciones/empleado/${empleadoId}`);
      setAutorizaciones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible cargar las autorizaciones de zona.'));
      setAutorizaciones([]);
    } finally {
      setLoadingAutorizaciones(false);
    }
  };

  const handleAbrirPermisos = (emp: Empleado) => {
    setEmpleadoSeleccionado(emp);
    setAreaAConceder('');
    setShowPermisosModal(true);
    cargarAutorizaciones(emp.id);
  };

  const refrescarAreasEmpleado = (lista: AutorizacionZona[]) => {
    if (!empleadoSeleccionado) return;
    const activas = lista.filter((a) => a.activo).map((a) => a.nombreArea || '').filter(Boolean);
    const etiqueta = activas.length === 0
      ? undefined
      : activas.slice(0, 2).join(', ') + (activas.length > 2 ? ` +${activas.length - 2}` : '');
    setEmpleados((prev) =>
      prev.map((e) => (e.id === empleadoSeleccionado.id ? { ...e, areaPrincipalNombre: etiqueta } : e))
    );
  };

  const handleConcederArea = async () => {
    if (!empleadoSeleccionado || !areaAConceder) {
      toast.error('Selecciona una zona para conceder.');
      return;
    }
    if (user?.id == null) {
      toast.error('No se pudo identificar al usuario que concede (sesión).');
      return;
    }
    try {
      await api.post('/accesos/autorizaciones', {
        empleadoId: empleadoSeleccionado.id,
        areaId: parseInt(areaAConceder, 10),
        asignadoPorId: user.id,
      });
      toast.success('Zona autorizada correctamente.');
      const res = await api.get(`/accesos/autorizaciones/empleado/${empleadoSeleccionado.id}`);
      const lista: AutorizacionZona[] = Array.isArray(res.data) ? res.data : [];
      setAutorizaciones(lista);
      refrescarAreasEmpleado(lista);
      setAreaAConceder('');
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible conceder la zona.'));
    }
  };

  const handleRevocarArea = async (autorizacionId: number) => {
    try {
      await api.patch(`/accesos/autorizaciones/${autorizacionId}/revocar`);
      toast.success('Autorización revocada.');
      if (empleadoSeleccionado) {
        const res = await api.get(`/accesos/autorizaciones/empleado/${empleadoSeleccionado.id}`);
        const lista: AutorizacionZona[] = Array.isArray(res.data) ? res.data : [];
        setAutorizaciones(lista);
        refrescarAreasEmpleado(lista);
      }
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible revocar la autorización.'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-800">Gestión del Personal Autorizado</h1>
          <p className="text-xs text-slate-500/70 mt-1">
            Administración de empleados, asignación de biometría y control de estados (RF F-11 a F-17).
          </p>
        </div>

        <button
          onClick={() => setShowRegistrarModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95 border border-emerald-400/50"
        >
          <Plus className="w-4 h-4" />
          Registrar Empleado
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200/40 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-emerald-600" />
            <select
              value={deptoFiltro}
              onChange={(e) => setDeptoFiltro(e.target.value)}
              className="px-3 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            >
              <option value="TODOS">Todos los Deptos</option>
              {deptosCatalogo.map((d) => (
                <option key={d.id} value={d.nombre}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-emerald-600" />
            <select
              value={areaFiltro}
              onChange={(e) => setAreaFiltro(e.target.value)}
              className="px-3 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40 max-w-[210px] truncate"
            >
              <option value="TODAS">Todos los Laboratorios/Zonas</option>
                    {areasCatalogo.map((lab) => (
                <option key={lab.id} value={lab.nombre}>
                  {lab.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Empleados en Tarjetas (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence>
          {empleadosFiltrados.length > 0 ? (
            empleadosFiltrados.map((emp, index) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-lg shadow-emerald-500/5 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)] transition-all flex flex-col"
              >
                {/* Brillo dinámico */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                {/* Cabecera Tarjeta: Avatar y Estado */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      {emp.nombres.charAt(0)}{emp.apellidos.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-slate-800 text-sm leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {emp.nombres} {emp.apellidos}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                          {emp.tipoDocumento}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {emp.numeroDocumento}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge de Estado */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase shadow-sm border ${
                      emp.estado === 'ACTIVO'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : emp.estado === 'BLOQUEADO'
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}
                  >
                    {emp.estado === 'ACTIVO' && <CheckCircle className="w-3.5 h-3.5" />}
                    {emp.estado === 'BLOQUEADO' && <XCircle className="w-3.5 h-3.5" />}
                    {emp.estado === 'INACTIVO' && <Clock className="w-3.5 h-3.5" />}
                    {emp.estado}
                  </span>
                </div>

                {/* Detalles: Departamento y Laboratorio */}
                <div className="space-y-2 mb-4 relative z-10 flex-1">
                  <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <Microscope className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">{emp.departamentoNombre}</p>
                      <p className="font-medium text-emerald-600 mt-0.5">{emp.areaPrincipalNombre || 'Área no asignada'}</p>
                    </div>
                  </div>
                  
                  {/* Info de Contacto & RFID */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100 truncate">
                      <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span className="text-slate-500 font-medium truncate" title={emp.correo}>{emp.correo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono font-bold text-slate-600 truncate" title="Código RFID enmascarado por seguridad">
                        {rfidReveladas[emp.id]
                          ? emp.codigoTarjetaRfid || 'SIN_VINCULAR'
                          : enmascararRfid(emp.codigoTarjetaRfid) || 'SIN_VINCULAR'}
                      </span>
                      {emp.codigoTarjetaRfid && (
                        <button
                          type="button"
                          onClick={() => toggleRevelarRfid(emp.id)}
                          title={rfidReveladas[emp.id] ? 'Ocultar código' : 'Revelar código (solo para enrolar la tarjeta física)'}
                          className="p-1 rounded-md hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 transition-all cursor-pointer shrink-0"
                        >
                          {rfidReveladas[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Tarjeta: Acciones */}
                <div className="pt-3 mt-auto border-t border-slate-100 relative z-10 flex justify-end gap-2">
                  <button
                    onClick={() => handleAbrirCambioEstado(emp)}
                    title="Cambiar estado del empleado (ACTIVO / INACTIVO / BLOQUEADO)"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-700 font-bold text-[11px] transition-all cursor-pointer shadow-sm border border-slate-200 hover:border-amber-200"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Estado
                  </button>
                  <button
                    onClick={() => handleAbrirPermisos(emp)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-[11px] transition-all cursor-pointer shadow-sm border border-slate-200 hover:border-emerald-200 group/btn"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500 group-hover/btn:-rotate-12 transition-transform" />
                    Gestionar Permisos
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="col-span-full flex flex-col items-center justify-center py-16 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-300 mb-3">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-500">No se encontraron empleados autorizados con los filtros actuales.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL: PERMISOS DE ZONA REALES (F-21) */}
      {showPermisosModal && empleadoSeleccionado && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-emerald-200/40 animate-slide-down my-auto relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-emerald-200/30 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-slate-800">
                    Permisos de zona — {empleadoSeleccionado.nombres} {empleadoSeleccionado.apellidos}
                  </h3>
                  <p className="text-xs text-slate-500/70">
                    {empleadoSeleccionado.tipoDocumento} {empleadoSeleccionado.numeroDocumento} · Autorizaciones reales del backend (F-21)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPermisosModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conceder nueva zona */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4 shrink-0">
              <select
                value={areaAConceder}
                onChange={(e) => setAreaAConceder(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-emerald-200/60 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              >
                <option value="">Selecciona una zona para autorizar…</option>
                {areasReales
                  .filter((a) => !autorizaciones.some((x) => x.activo && x.areaId === a.id))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.codigo}] {a.nombre}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleConcederArea}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
              >
                Autorizar
              </button>
            </div>
            {areasReales.length === 0 && (
              <p className="text-[11px] text-amber-600 font-semibold mb-3">
                Sin conexión con el catálogo del backend: no se pueden conceder zonas hasta recargar.
              </p>
            )}

            {/* Listado de autorizaciones */}
            <div className="space-y-2 overflow-y-auto pr-1">
              {loadingAutorizaciones ? (
                <p className="text-xs text-slate-500 text-center py-6">Cargando autorizaciones…</p>
              ) : autorizaciones.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Sin zonas asignadas — el molinete denegará todos sus ingresos.
                </p>
              ) : (
                autorizaciones.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-2xl border text-xs ${
                      a.activo ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{a.nombreArea || `Zona #${a.areaId}`}</p>
                      <p className="text-[10px] text-slate-500">
                        {a.activo ? 'ACTIVA' : 'REVOCADA'}
                        {a.asignadoPorUsuario ? ` · por ${a.asignadoPorUsuario}` : ''}
                        {a.fechaAsignacion ? ` · ${new Date(a.fechaAsignacion).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    {a.activo ? (
                      <button
                        type="button"
                        onClick={() => handleRevocarArea(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 font-bold text-[10px] hover:bg-red-50 transition-all cursor-pointer shrink-0"
                      >
                        Revocar
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">Sin acceso</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 text-right shrink-0">
              <button
                type="button"
                onClick={() => setShowPermisosModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR NUEVO EMPLEADO CON REGLAS DE VALIDACIÓN */}
      {showRegistrarModal && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-emerald-200/40 animate-slide-down my-auto relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-emerald-200/30 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-slate-800">Registrar Nuevo Empleado Autorizado</h3>
                  <p className="text-xs text-slate-500/70">Nombres/Apellidos (solo letras), Cédula (máx 12), Celular (máx 10)</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegistrarEmpleado} className="space-y-3.5 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo Doc.</label>
                  <select
                    value={nuevoTipoDoc}
                    onChange={(e) => setNuevoTipoDoc(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white font-medium"
                  >
                    <option value="CC">CC (Cédula)</option>
                    <option value="CE">CE (Extranjería)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500">Cédula * (Máx 12 dígitos)</label>
                    <span className="text-[10px] font-mono text-emerald-600">{nuevoDoc.length}/12</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={nuevoDoc}
                    onChange={handleDocChange}
                    placeholder="Ej. 1020304050"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                      erroresForm.doc ? 'border-red-400 focus:ring-red-200 bg-red-50/40' : 'border-emerald-200/60 focus:ring-emerald-600/40'
                    }`}
                  />
                  {erroresForm.doc && <p className="text-[10px] text-red-600 font-semibold mt-0.5">{erroresForm.doc}</p>}
                </div>
              </div>

              {/* Nombres y Apellidos estrictamente solo letras */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Nombres * <span className="text-gray-400 font-normal">(Solo letras)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevosNombres}
                    onChange={handleNombresChange}
                    placeholder="Ej. Roberto Carlos"
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      erroresForm.nombres ? 'border-red-400 focus:ring-red-200 bg-red-50/40' : 'border-emerald-200/60 focus:ring-emerald-600/40'
                    }`}
                  />
                  {erroresForm.nombres && <p className="text-[10px] text-red-600 font-semibold mt-0.5">{erroresForm.nombres}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Apellidos * <span className="text-gray-400 font-normal">(Solo letras)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevosApellidos}
                    onChange={handleApellidosChange}
                    placeholder="Ej. Gómez Pérez"
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      erroresForm.apellidos ? 'border-red-400 focus:ring-red-200 bg-red-50/40' : 'border-emerald-200/60 focus:ring-emerald-600/40'
                    }`}
                  />
                  {erroresForm.apellidos && <p className="text-[10px] text-red-600 font-semibold mt-0.5">{erroresForm.apellidos}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    value={nuevoCorreo}
                    onChange={handleCorreoChange}
                    placeholder="r.gomez@laboratorioxyz.com"
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      erroresForm.email ? 'border-red-400 focus:ring-red-200 bg-red-50/40' : 'border-emerald-200/60 focus:ring-emerald-600/40'
                    }`}
                  />
                  {erroresForm.email && <p className="text-[10px] text-red-600 font-semibold mt-0.5">{erroresForm.email}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500">Celular * (10 dígitos)</label>
                    <span className="text-[10px] font-mono text-emerald-600">{nuevoTelefono.length}/10</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={nuevoTelefono}
                    onChange={handleTelefonoChange}
                    placeholder="3001234567"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 ${
                      erroresForm.tel ? 'border-red-400 focus:ring-red-200 bg-red-50/40' : 'border-emerald-200/60 focus:ring-emerald-600/40'
                    }`}
                  />
                  {erroresForm.tel && <p className="text-[10px] text-red-600 font-semibold mt-0.5">{erroresForm.tel}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Departamento</label>
                  <select
                    value={nuevoDepto}
                    onChange={(e) => handleDeptoChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  >
                    {(deptosCatalogo.length > 0
                      ? deptosCatalogo
                      : [
                          { id: 0, nombre: 'Producción y Síntesis' },
                          { id: 0, nombre: 'Control de Calidad' },
                          { id: 0, nombre: 'Bioseguridad y Mantenimiento' },
                        ]
                    ).map((d) => (
                      <option key={d.nombre} value={d.nombre}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500">Código / N° Carnet</label>
                    <span className="text-[9px] text-gray-500 font-medium">{nuevoRfid.length}/14 máx.</span>
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    value={nuevoRfid}
                    onChange={handleRfidChange}
                    placeholder="Ej. CRN-XYZ-901"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs font-mono font-bold"
                  />
                  {erroresForm.rfid && (
                    <p className="text-[10px] text-red-600 font-semibold mt-1">{erroresForm.rfid}</p>
                  )}
                </div>
              </div>

              {/* Selector de Laboratorio / Área Principal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Laboratorio / Área Principal de Trabajo *
                </label>
                <div className="relative">
                  <select
                    value={nuevoLaboratorioPrincipal}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setNuevoLaboratorioPrincipal(sel);
                      if (!areasPermitidas.includes(sel)) {
                        setAreasPermitidas((prev) => [...prev, sel]);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200/60 text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  >
              {areasCatalogo.map((lab) => (
                      <option key={lab.id} value={lab.nombre}>
                        [{lab.codigo}] {lab.nombre} — (Riesgo {lab.nivelRiesgo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector Dinámico Desplegable de Zonas y Laboratorios Autorizados (RF F-21) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-emerald-600" />
                    Zonas y Laboratorios con Acceso Autorizado (RFID)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/40">
                    {areasPermitidas.length} de {areasCatalogo.length} seleccionada(s)
                  </span>
                </div>

                {/* Botón trigger del dropdown desplegable */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdownAreas(!showDropdownAreas)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 bg-white hover:border-emerald-600 text-xs font-medium text-left flex items-center justify-between shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate text-slate-800 font-medium">
                        {areasPermitidas.length === 0
                          ? 'Haga clic para autorizar laboratorios...'
                          : areasPermitidas.length === 1
                          ? `${areasPermitidas[0]} (1 laboratorio)`
                          : `${areasPermitidas[0]} (+${areasPermitidas.length - 1} laboratorio${areasPermitidas.length > 2 ? 's' : ''} más)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {showDropdownAreas ? (
                        <ChevronUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500/60" />
                      )}
                    </div>
                  </button>

                  {/* Panel Desplegable Dinámico Flotante */}
                  {showDropdownAreas && (
                    <div className="mt-1.5 p-2 bg-white rounded-2xl border border-emerald-200/60 shadow-xl space-y-2 animate-slide-down">
                      {/* Cabecera con acciones rápidas */}
                      <div className="flex items-center justify-between px-1.5 pt-1 pb-1.5 border-b border-emerald-200/30 text-[11px]">
                        <span className="font-bold text-slate-800">Catálogo de Esclusas y Laboratorios</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAreasPermitidas(areasCatalogo.map((l) => l.nombre))}
                            className="text-[10px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                          >
                            Marcar Todas
                          </button>
                          <span className="text-gray-300">•</span>
                          <button
                            type="button"
                            onClick={() => setAreasPermitidas([nuevoLaboratorioPrincipal])}
                            className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                          >
                            Solo Principal
                          </button>
                        </div>
                      </div>

                      {/* Lista de opciones scrolleable */}
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {areasCatalogo.map((area) => {
                          const isChecked = areasPermitidas.includes(area.nombre);
                          const isPrincipal = nuevoLaboratorioPrincipal === area.nombre;
                          return (
                            <div
                              key={area.id}
                              onClick={() => handleToggleArea(area.nombre)}
                              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-50/70 border-emerald-600/60 text-slate-800 font-semibold'
                                  : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // Manejado por el onClick del contenedor
                                  className="rounded text-emerald-600 focus:ring-emerald-600/40 cursor-pointer shrink-0"
                                />
                                <div className="truncate">
                                  <span className="block truncate">{area.nombre}</span>
                                  <span className="text-[9px] font-normal text-slate-500">
                                    {area.deptoAsociado}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                    area.nivelRiesgo === 'ALTO'
                                      ? 'bg-red-100 text-red-700'
                                      : area.nivelRiesgo === 'MEDIO'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {area.codigo}
                                </span>
                                {isPrincipal && (
                                  <span className="text-[8.5px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-bold">
                                    PRINCIPAL
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Botón para cerrar el dropdown */}
                      <div className="pt-1 text-right">
                        <button
                          type="button"
                          onClick={() => setShowDropdownAreas(false)}
                          className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600/90 transition-all cursor-pointer"
                        >
                          Listo ({areasPermitidas.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges tipo Tags de las áreas seleccionadas cuando el dropdown está cerrado */}
                {!showDropdownAreas && areasPermitidas.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto">
                    {areasPermitidas.map((areaNombre) => (
                      <span
                        key={areaNombre}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-emerald-200/50 text-[10px] text-slate-800 font-medium shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate max-w-[200px]">{areaNombre}</span>
                        {areaNombre !== nuevoLaboratorioPrincipal && (
                          <button
                            type="button"
                            onClick={() => handleToggleArea(areaNombre)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                            title="Quitar autorización"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Campo de Foto de Perfil */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <span>📷</span> Foto de Perfil <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <div className="flex items-center gap-3">
                  {/* Preview de la foto */}
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-emerald-200/60 bg-emerald-50/30 flex items-center justify-center overflow-hidden shrink-0">
                    {nuevoFotoPerfil ? (
                      <img src={nuevoFotoPerfil} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="foto-perfil-input"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert('La imagen no puede superar 2 MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setNuevoFotoPerfil(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor="foto-perfil-input"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200/60 bg-white text-[11px] font-semibold text-slate-800 cursor-pointer hover:border-emerald-600 hover:bg-emerald-50/30 transition-all"
                    >
                      📁 Seleccionar imagen
                    </label>
                    {nuevoFotoPerfil && (
                      <button
                        type="button"
                        onClick={() => setNuevoFotoPerfil('')}
                        className="ml-2 text-[10px] text-red-500 hover:underline font-semibold"
                      >
                        Quitar foto
                      </button>
                    )}
                    <p className="text-[10px] text-slate-500/50 mt-1">JPG, PNG o WEBP · Máx 2 MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-emerald-200/30">
                <button
                  type="button"
                  onClick={() => setShowRegistrarModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-600/90 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CAMBIO DE ESTADO OBLIGATORIO CON SELECTOR VISUAL INTERACTIVO */}
      {showEstadoModal && empleadoSeleccionado && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-emerald-200/40 animate-slide-down">
            <div className="flex items-center gap-3 mb-4 border-b border-emerald-200/30 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-slate-800">
                  Modificar Estado de {empleadoSeleccionado.nombres}
                </h3>
                <p className="text-xs text-slate-500/70">Documento: {empleadoSeleccionado.numeroDocumento}</p>
              </div>
            </div>

            <form onSubmit={handleGuardarEstado} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Seleccionar Nuevo Estado de Acceso:
                </label>
                
                {/* Selector Visual Dinámico de Estados (Verde, Amarillo, Rojo) */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Opción 1: ACTIVO (Verde) */}
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('ACTIVO')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      nuevoEstado === 'ACTIVO'
                        ? 'bg-emerald-50 border-emerald-500 shadow-md scale-102 ring-2 ring-emerald-400/20'
                        : 'bg-white border-slate-200 hover:border-emerald-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-800">
                      ACTIVO
                    </span>
                    <span className="text-[9px] text-emerald-700 font-medium">
                      Acceso Total
                    </span>
                  </button>

                  {/* Opción 2: INACTIVO (Amarillo) */}
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('INACTIVO')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      nuevoEstado === 'INACTIVO'
                        ? 'bg-amber-50 border-amber-500 shadow-md scale-102 ring-2 ring-amber-400/20'
                        : 'bg-white border-slate-200 hover:border-amber-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-800">
                      INACTIVO
                    </span>
                    <span className="text-[9px] text-amber-700 font-medium">
                      Temporal
                    </span>
                  </button>

                  {/* Opción 3: BLOQUEADO (Rojo) */}
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('BLOQUEADO')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      nuevoEstado === 'BLOQUEADO'
                        ? 'bg-red-50 border-red-500 shadow-md scale-102 ring-2 ring-red-400/20'
                        : 'bg-white border-slate-200 hover:border-red-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-red-100 text-red-800 flex items-center justify-center">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-extrabold text-red-800">
                      BLOQUEADO
                    </span>
                    <span className="text-[9px] text-red-700 font-medium">
                      Bloqueado
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Motivo de Cambio de Estado <span className="text-red-500">* (Obligatorio para Auditoría)</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoEstado}
                  onChange={(e) => setMotivoEstado(e.target.value)}
                  placeholder={
                    nuevoEstado === 'INACTIVO'
                      ? 'Ejemplo: Suspensión preventiva temporal por protocolo de seguridad...'
                      : nuevoEstado === 'BLOQUEADO'
                      ? 'Ejemplo: Bloqueo definitivo por finalización de contrato o falta grave...'
                      : 'Ejemplo: Reactivación autorizada tras cumplimiento de protocolo...'
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200/30">
                <button
                  type="button"
                  onClick={() => setShowEstadoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                    nuevoEstado === 'ACTIVO'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : nuevoEstado === 'INACTIVO'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Guardar en Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dinámico de Registro Exitoso con Estilo y Animación */}
      {showExitoModal && empleadoCreado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200/40 relative overflow-hidden transform animate-scale-up">
            {/* Elementos visuales decorativos */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-slate-50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 text-center">
              {/* Icono con pulsación y halo luminoso */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-200/80 flex items-center justify-center shadow-lg shadow-emerald-600/30 text-white mb-4 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-emerald-200/60 text-slate-800 text-[11px] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                ALTA DE PERSONAL COMPLETADA
              </div>

              <h2 className="text-xl font-heading font-extrabold text-slate-800 mb-1">
                ¡Registro Exitoso!
              </h2>
              <p className="text-xs text-slate-500/75 mb-5">
                El colaborador ha sido ingresado al padrón oficial de <strong className="text-slate-800 font-semibold">Laboratorio XYZ</strong> con autorización de acceso activa.
              </p>

              {/* Ficha Resumen del Colaborador */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/50 text-left space-y-2 mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/30">
                  <span className="text-[11px] font-medium text-slate-500/70">Nombre Completo:</span>
                  <span className="text-xs font-bold text-slate-800">{empleadoCreado.nombres} {empleadoCreado.apellidos}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/30">
                  <span className="text-[11px] font-medium text-slate-500/70">Cédula / Documento:</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">{empleadoCreado.numeroDocumento}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/30">
                  <span className="text-[11px] font-medium text-slate-500/70">Departamento:</span>
                  <span className="text-xs font-medium text-slate-800">{empleadoCreado.departamentoNombre}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/30">
                  <span className="text-[11px] font-medium text-slate-500/70">Carnet Asignado (RFID):</span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200/50">
                    {empleadoCreado.codigoTarjetaRfid}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-slate-500/70">Estado Inicial:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A9B8E]/15 text-[#2E6F64]">
                    <ShieldCheck className="w-3 h-3" />
                    ACTIVO
                  </span>
                </div>
              </div>

              {/* Botón de Aceptar con micro-interacción */}
              <button
                type="button"
                onClick={() => {
                  setShowExitoModal(false);
                  setEmpleadoCreado(null);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dinámico Interactivo de Bitácora y Auditoría 21 CFR Part 11 */}
      {showBitacoraExitoModal && bitacoraInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200/40 relative overflow-hidden transform animate-scale-up">
            {/* Efectos de fondo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 text-center">
              {/* Icono de Seguridad Dinámico según Estado */}
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-white mb-4 animate-bounce ${
                bitacoraInfo.nuevoEstado === 'ACTIVO'
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
                  : bitacoraInfo.nuevoEstado === 'INACTIVO'
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-600 shadow-amber-500/30'
                  : 'bg-gradient-to-tr from-red-500 to-rose-600 shadow-red-500/30'
              }`}>
                {bitacoraInfo.nuevoEstado === 'ACTIVO' && <CheckCircle className="w-8 h-8" />}
                {bitacoraInfo.nuevoEstado === 'INACTIVO' && <Clock className="w-8 h-8" />}
                {bitacoraInfo.nuevoEstado === 'BLOQUEADO' && <XCircle className="w-8 h-8" />}
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold mb-2 ${
                bitacoraInfo.nuevoEstado === 'ACTIVO'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : bitacoraInfo.nuevoEstado === 'INACTIVO'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                {bitacoraInfo.nuevoEstado === 'ACTIVO' && 'AUTORIZACIÓN ACTIVA 21 CFR 11'}
                {bitacoraInfo.nuevoEstado === 'INACTIVO' && 'SUSPENSIÓN TEMPORAL AUDITADA'}
                {bitacoraInfo.nuevoEstado === 'BLOQUEADO' && 'BLOQUEO PERMANENTE AUDITADO'}
              </div>

              <h2 className="text-xl font-heading font-extrabold text-slate-800 mb-1">
                {bitacoraInfo.nuevoEstado === 'ACTIVO' && '¡Colaborador Activado!'}
                {bitacoraInfo.nuevoEstado === 'INACTIVO' && '¡Suspensión Temporal Registrada!'}
                {bitacoraInfo.nuevoEstado === 'BLOQUEADO' && '¡Acceso Revocado y Bloqueado!'}
              </h2>
              <p className="text-xs text-slate-500/75 mb-4">
                La modificación ha sido procesada e inscrita de forma inmutable en el registro de auditoría.
              </p>

              {/* Ficha Resumen de Auditoría */}
              <div className={`p-4 rounded-2xl border text-left space-y-2 mb-5 ${
                bitacoraInfo.nuevoEstado === 'ACTIVO'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : bitacoraInfo.nuevoEstado === 'INACTIVO'
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-red-50/60 border-red-200'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-[11px] font-medium text-slate-500/70">Colaborador:</span>
                  <span className="text-xs font-bold text-slate-800">{bitacoraInfo.empleadoNombre}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-[11px] font-medium text-slate-500/70">Documento / ID:</span>
                  <span className="text-xs font-mono font-bold text-emerald-600">{bitacoraInfo.documento}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-[11px] font-medium text-slate-500/70">Transición de Estado:</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-slate-500 line-through text-[11px]">{bitacoraInfo.estadoAnterior}</span>
                    <span>→</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs ${
                      bitacoraInfo.nuevoEstado === 'ACTIVO'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : bitacoraInfo.nuevoEstado === 'INACTIVO'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {bitacoraInfo.nuevoEstado}
                    </span>
                  </div>
                </div>
                <div className="flex items-start justify-between pb-2 border-b border-black/5">
                  <span className="text-[11px] font-medium text-slate-500/70 shrink-0 mr-2">Motivo Registrado:</span>
                  <span className="text-[11px] text-slate-800 font-medium text-right leading-tight italic">
                    &quot;{bitacoraInfo.motivo}&quot;
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-slate-500/70">Folio de Auditoría:</span>
                  <span className="text-[10px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-black/10">
                    {bitacoraInfo.codigoAuditoria}
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación con Color Adaptativo */}
              <button
                type="button"
                onClick={() => {
                  setShowBitacoraExitoModal(false);
                  setBitacoraInfo(null);
                }}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  bitacoraInfo.nuevoEstado === 'ACTIVO'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : bitacoraInfo.nuevoEstado === 'INACTIVO'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                }`}
              >
                <Check className="w-4 h-4" />
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
