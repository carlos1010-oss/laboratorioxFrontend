'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Departamento, AreaRestringida, Empleado } from '@/types';
import { agregarEmpleado } from '@/lib/personalStore';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { api, extraerMensajeError } from '@/lib/api';
import { toast } from 'sonner';
import {
  Building2,
  ShieldCheck,
  Plus,
  Layers,
  CreditCard,
  AlertTriangle,
  QrCode,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Upload,
  Trash2,
  User,
} from 'lucide-react';

const mockDeptos: Departamento[] = [
  { id: 1, codigo: 'PROD-01', nombre: 'Producción y Síntesis', descripcion: 'Área química de elaboración', activo: true },
  { id: 2, codigo: 'CAL-02', nombre: 'Control de Calidad', descripcion: 'Laboratorios de cromatografía y microbiología', activo: true },
  { id: 3, codigo: 'BIO-03', nombre: 'Bioseguridad y Esclusas', descripcion: 'Personal técnico de esterilización', activo: true },
  { id: 4, codigo: 'ADM-04', nombre: 'Administración y Finanzas', descripcion: 'Oficinas centrales', activo: true },
];

const mockAreas: AreaRestringida[] = [
  { id: 1, codigo: 'AREA-A', nombre: 'Laboratorio de Síntesis Molecular (Área A)', nivelRiesgo: 'ALTO', descripcion: 'Zona crítica BSL-3', activa: true },
  { id: 2, codigo: 'AREA-B', nombre: 'Sala Limpia de Liofilización (Área B)', nivelRiesgo: 'MEDIO', descripcion: 'Zona estéril ISO 5', activa: true },
  { id: 3, codigo: 'AREA-C', nombre: 'Almacén Central (Área C)', nivelRiesgo: 'BAJO', descripcion: 'Almacenamiento general', activa: true },
  { id: 4, codigo: 'AREA-D', nombre: 'Oficinas Administrativas (Área D)', nivelRiesgo: 'BAJO', descripcion: 'Zona de trabajo común', activa: true },
];

export default function CatalogosPage() {
  const { agregarNotificacion } = useNotifications();
  const { hasRole } = useAuth();
  const esAdmin = hasRole(['ADMINISTRADOR']);
  const [deptos, setDeptos] = useState<Departamento[]>(mockDeptos);
  const [areas, setAreas] = useState<AreaRestringida[]>(mockAreas);

  // Formularios de creación (solo ADMINISTRADOR; el backend rechaza otros roles)
  const [nuevoDepCodigo, setNuevoDepCodigo] = useState('');
  const [nuevoDepNombre, setNuevoDepNombre] = useState('');
  const [nuevoDepDesc, setNuevoDepDesc] = useState('');
  const [nuevaAreaCodigo, setNuevaAreaCodigo] = useState('');
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState('');
  const [nuevaAreaNivel, setNuevaAreaNivel] = useState('MEDIO');
  const [nuevaAreaDesc, setNuevaAreaDesc] = useState('');

  const handleCrearDepto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDepCodigo.trim() || !nuevoDepNombre.trim()) {
      toast.error('Código y nombre del departamento son obligatorios.');
      return;
    }
    try {
      const res = await api.post('/catalogos/departamentos', {
        codigo: nuevoDepCodigo.trim(),
        nombre: nuevoDepNombre.trim(),
        descripcion: nuevoDepDesc.trim() || undefined,
      });
      setDeptos((prev) => [...prev, res.data]);
      setDeptoId(String(res.data.id));
      setNuevoDepCodigo('');
      setNuevoDepNombre('');
      setNuevoDepDesc('');
      toast.success('Departamento creado correctamente.');
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible crear el departamento.'));
    }
  };

  const handleCrearArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaAreaCodigo.trim() || !nuevaAreaNombre.trim()) {
      toast.error('Código y nombre del área son obligatorios.');
      return;
    }
    try {
      const res = await api.post('/catalogos/areas-restringidas', {
        codigo: nuevaAreaCodigo.trim(),
        nombre: nuevaAreaNombre.trim(),
        nivelRiesgo: nuevaAreaNivel,
        descripcion: nuevaAreaDesc.trim() || undefined,
      });
      setAreas((prev) => [...prev, res.data]);
      setAreaId(String(res.data.id));
      setNuevaAreaCodigo('');
      setNuevaAreaNombre('');
      setNuevaAreaNivel('MEDIO');
      setNuevaAreaDesc('');
      toast.success('Área restringida creada correctamente.');
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No fue posible crear el área.'));
    }
  };

  // Formulario vinculación y registro de empleado
  const [rfidDoc, setRfidDoc] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [rfidCodigo, setRfidCodigo] = useState('');
  const [deptoId, setDeptoId] = useState('1');
  const [areaId, setAreaId] = useState('1');

  // Catálogos reales del backend con fallback a mocks. Antes la página siempre
  // mostraba mocks, por eso el admin veía zonas distintas al kiosco.
  useEffect(() => {
    api.get('/catalogos/departamentos').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDeptos(res.data);
        setDeptoId((prev) => (res.data.some((d: Departamento) => String(d.id) === prev) ? prev : String(res.data[0].id)));
      }
    }).catch(() => {});
    api.get('/catalogos/areas-restringidas').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAreas(res.data);
        setAreaId((prev) => (res.data.some((a: AreaRestringida) => String(a.id) === prev) ? prev : String(res.data[0].id)));
      }
    }).catch(() => {});
  }, []);
  
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoNombre, setFotoNombre] = useState('');
  const [errorCarnet, setErrorCarnet] = useState('');

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La fotografía no debe superar 2MB de tamaño.');
        return;
      }
      setFotoNombre(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEliminarFoto = () => {
    setFotoUrl(null);
    setFotoNombre('');
  };

  const handleCarnetCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;
    if (valor.length <= 14) {
      setRfidCodigo(valor);
      if (valor.length > 0 && valor.length < 4) {
        setErrorCarnet('El número del carnet debe tener entre 4 y 14 caracteres.');
      } else {
        setErrorCarnet('');
      }
    }
  };

  const handleRegistrarYVincular = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = rfidDoc.trim();
    const code = rfidCodigo.trim();

    if (code.length > 14) {
      toast.error('El número de carnet no puede superar los 14 caracteres.');
      return;
    }

    if (!nombres || !apellidos || !doc || !code) {
      toast.error('Por favor completa los datos básicos obligatorios.');
      return;
    }

    const deptoObj = deptos.find(d => d.id === parseInt(deptoId));
    const areaObj = areas.find(a => a.id === parseInt(areaId));

    // Crear empleado completo para el store
    const nuevoEmpleado: Empleado = {
      id: 0, // Se autogenera en el store
      departamentoId: parseInt(deptoId),
      departamentoNombre: deptoObj?.nombre,
      areaPrincipalNombre: areaObj?.nombre,
      areasAutorizadas: areaObj ? [areaObj.nombre] : [],
      tipoDocumento: tipoDocumento,
      numeroDocumento: doc,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: `${nombres.split(' ')[0].toLowerCase()}.${apellidos.split(' ')[0].toLowerCase()}@laboratorioxyz.com`,
      telefono: 'No registrado',
      codigoTarjetaRfid: code,
      estado: 'ACTIVO',
      fotoPerfil: fotoUrl || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      // Registrar en el Storage
      agregarEmpleado(nuevoEmpleado);
      toast.success(`Personal ${nombres} registrado y carnet ${code} vinculado.`);

      // Persistencia en Backend + autorización real de la zona elegida (F-21).
      // Antes el área solo quedaba en el store local y el molinete la denegaba.
      try {
        const res = await api.post('/personal/empleados', {
          tipoDocumento: nuevoEmpleado.tipoDocumento,
          numeroDocumento: nuevoEmpleado.numeroDocumento,
          nombres: nuevoEmpleado.nombres,
          apellidos: nuevoEmpleado.apellidos,
          correo: nuevoEmpleado.correo,
          departamentoId: nuevoEmpleado.departamentoId,
          codigoTarjetaRfid: nuevoEmpleado.codigoTarjetaRfid,
          estado: 'ACTIVO',
        });
        const empleadoId = res.data?.id;
        if (empleadoId != null && user?.id != null) {
          await api.post('/accesos/autorizaciones', {
            empleadoId,
            areaId: parseInt(areaId, 10),
            asignadoPorId: user.id,
          });
        } else if (empleadoId != null) {
          toast.warning('Empleado creado. Asigna su zona en Personal → Gestionar Permisos.');
        }
      } catch {
        toast.warning('Empleado guardado local. El backend no respondió: verifica e intenta de nuevo.');
      }

      // Notificación persistente con desglose de auditoría
      agregarNotificacion({
        titulo: `🪪 Carnet RFID Vinculado: ${nuevoEmpleado.nombres} ${nuevoEmpleado.apellidos}`,
        mensaje: `Se asignó la credencial física [${code}] para acceso a [${nuevoEmpleado.areaPrincipalNombre}].`,
        tipo: 'PERSONAL',
        rolesDestino: ['ADMINISTRADOR', 'GESTOR_PERSONAL'],
        accionUrl: '/dashboard/personal',
        detallesAuditoria: {
          evento: 'Emisión y Vinculación de Carnet Físico',
          modulo: 'Carnetización y Credenciales',
          operacion: 'VINCULACION_RFID',
          usuarioResponsable: 'Gestor de Personal',
          entidadInvolucrada: `${nuevoEmpleado.numeroDocumento} - Credencial: ${code}`,
          valorAnterior: null,
          valorNuevo: JSON.stringify({
            empleado: `${nuevoEmpleado.nombres} ${nuevoEmpleado.apellidos}`,
            documento: nuevoEmpleado.numeroDocumento,
            carnet: code,
            departamento: nuevoEmpleado.departamentoNombre,
            area: nuevoEmpleado.areaPrincipalNombre,
          }),
          direccionIp: '127.0.0.1',
          resultado: 'CARNET VINCULADO',
        },
      });
      
      // Limpiar form
      setRfidDoc('');
      setNombres('');
      setApellidos('');
      setRfidCodigo('');
      handleEliminarFoto();
      setErrorCarnet('');
      
    } catch (err) {
      toast.error('Ocurrió un error al registrar al personal.');
    }
  };

  const generarCodigoCarnet = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setRfidCodigo(`CRN-XYZ-${randomNum}`);
    setErrorCarnet('');
  };

  const nombreCompletoDisplay = [nombres, apellidos].filter(Boolean).join(' ') || 'NOMBRE DEL EMPLEADO';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-slate-800">
          Registro de Personal y Asignación de Carnets
        </h1>
        <p className="text-xs text-slate-500/70 mt-1">
          Alta de colaboradores, asignación a zonas restringidas y troquelado de chips de seguridad (RFID/NFC).
        </p>
      </div>

      {/* Departamentos (unidades organizacionales; las zonas son transversales) */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-200/40 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-200/20 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-heading font-bold text-sm text-slate-800">Departamentos</h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {deptos.filter((d) => d.activo !== false).length} Activos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {deptos.map((d) => (
            <div key={d.id} className="p-4 rounded-2xl bg-slate-50/70 border border-emerald-200/30 space-y-1">
              <p className="font-bold text-xs text-slate-800">{d.nombre}</p>
              <p className="text-[11px] text-slate-500/70 leading-relaxed">{d.descripcion || 'Sin descripción'}</p>
              <p className="text-[10px] text-gray-400 font-mono pt-1">Código: {d.codigo}</p>
            </div>
          ))}
        </div>

        {/* Crear departamento (solo ADMINISTRADOR) */}
        {esAdmin && (
          <form onSubmit={handleCrearDepto} className="pt-3 border-t border-emerald-200/30 flex flex-col md:flex-row gap-2">
            <input
              value={nuevoDepCodigo}
              onChange={(e) => setNuevoDepCodigo(e.target.value)}
              placeholder="Código (ej. DEP-CAL)"
              maxLength={20}
              className="px-3 py-2 rounded-xl border border-emerald-200/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/40 md:w-48"
            />
            <input
              value={nuevoDepNombre}
              onChange={(e) => setNuevoDepNombre(e.target.value)}
              placeholder="Nombre del departamento"
              maxLength={100}
              className="px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40 md:w-64"
            />
            <input
              value={nuevoDepDesc}
              onChange={(e) => setNuevoDepDesc(e.target.value)}
              placeholder="Descripción (opcional)"
              maxLength={255}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
            >
              Crear
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Áreas Restringidas (zonas físicas, transversales a departamentos) */}
        <div className="xl:col-span-5 bg-white rounded-3xl p-6 border border-emerald-200/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200/20 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-heading font-bold text-sm text-slate-800">Zonas de Riesgo Biológico</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {areas.filter((a) => a.activa !== false).length} Activas
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {areas.map((area, idx) => (
                <motion.div 
                  key={area.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-emerald-200/30 space-y-1.5 transition-all hover:bg-emerald-50/80 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{area.nombre}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
                        area.nivelRiesgo === 'ALTO'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : area.nivelRiesgo === 'MEDIO'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      Riesgo {area.nivelRiesgo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500/70 leading-relaxed">{area.descripcion}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1">
                    <span>Código Zona: {area.codigo}</span>
                    <span className="text-emerald-700 font-semibold font-sans">● Esclusa Operativa</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Crear área (solo ADMINISTRADOR; el backend rechaza otros roles) */}
          {esAdmin && (
            <form onSubmit={handleCrearArea} className="pt-3 mt-1 border-t border-emerald-200/30 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nueva zona restringida</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={nuevaAreaCodigo}
                  onChange={(e) => setNuevaAreaCodigo(e.target.value)}
                  placeholder="Código (ej. ZR-LAB02)"
                  maxLength={20}
                  className="px-3 py-2 rounded-xl border border-emerald-200/60 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
                <select
                  value={nuevaAreaNivel}
                  onChange={(e) => setNuevaAreaNivel(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-emerald-200/60 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                >
                  <option value="BAJO">Riesgo BAJO</option>
                  <option value="MEDIO">Riesgo MEDIO</option>
                  <option value="ALTO">Riesgo ALTO</option>
                  <option value="CRITICO">Riesgo CRÍTICO</option>
                </select>
              </div>
              <input
                value={nuevaAreaNombre}
                onChange={(e) => setNuevaAreaNombre(e.target.value)}
                placeholder="Nombre de la zona"
                maxLength={100}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
              <div className="flex gap-2">
                <input
                  value={nuevaAreaDesc}
                  onChange={(e) => setNuevaAreaDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  maxLength={255}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-emerald-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
                >
                  Crear
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Formulario y Vista Previa del Carnet Físico */}
        <div className="xl:col-span-7 space-y-6">
          {/* Card Mockup Visual del Carnet */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 to-[#d5edd9] border border-emerald-600/30 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-emerald-600/20 pb-3 mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  Z
                </div>
                <span className="font-heading font-extrabold text-xs text-slate-800 tracking-tight">
                  CREDENCIAL DE ACCESO • LAB XYZ
                </span>
              </div>
              <QrCode className="w-5 h-5 text-emerald-600 opacity-80" />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center relative z-10">
              {/* Recuadro de Fotografía Interactivo directamente en el Carnet */}
              <div className="relative">
                <label className="block w-28 h-32 bg-white rounded-2xl border-2 border-dashed border-emerald-600/60 hover:border-emerald-600 shadow-sm flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all transform hover:scale-102 active:scale-98 bg-gradient-to-b from-white to-emerald-50/40">
                  {fotoUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-100 p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoUrl}
                        alt="Foto del colaborador"
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xs"
                      />
                      <div className="absolute inset-0 bg-slate-800/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center rounded-xl">
                        <Camera className="w-5 h-5 mb-0.5 animate-bounce" />
                        <span className="text-[9px] font-bold">Cambiar Foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-emerald-600 p-2 text-center">
                      <div className="p-2.5 rounded-full bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white transition-all mb-1 shadow-xs">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors">
                        Subir Foto
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>

                {fotoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarFoto();
                    }}
                    title="Eliminar foto"
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-transform hover:scale-110 active:scale-90 cursor-pointer z-20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="col-span-2 space-y-2 text-xs pl-2">
                <div>
                  <p className="font-heading font-black text-slate-800 text-base leading-tight">
                    {nombreCompletoDisplay}
                  </p>
                  {areas.find(a => a.id === parseInt(areaId)) && (
                    <p className="text-[9px] font-bold text-emerald-700 uppercase mt-0.5">
                      {areas.find(a => a.id === parseInt(areaId))?.nombre}
                    </p>
                  )}
                </div>
                
                <p className="text-[11px] text-slate-500/80 font-mono">
                  {tipoDocumento}: {rfidDoc || '••••••••••'}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded bg-white text-[10px] font-mono font-bold text-emerald-600 border border-emerald-200/50 shadow-2xs">
                    {rfidCodigo || 'CHIP-RFID-NO-ASIGNADO'}
                  </span>
                </div>
                {fotoUrl && <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> Biometría vinculada</p>}
              </div>
            </div>
          </div>

          {/* Formulario Completo de Alta y Asignación */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200/40 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-200/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-800">Ficha de Alta y Vinculación</h3>
                  <p className="text-[11px] text-slate-500/70">Registra al personal y asígnale su credencial física</p>
                </div>
              </div>

              <button
                type="button"
                onClick={generarCodigoCarnet}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-3 py-1.5 rounded-xl hover:bg-emerald-200/60 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Autogenerar RFID
              </button>
            </div>

            <form onSubmit={handleRegistrarYVincular} className="space-y-4">
              {/* Datos Personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500/70 uppercase">Nombres</label>
                    <span className="text-[10px] font-medium text-slate-500/50">{nombres.length}/50</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ej. Carlos Andrés"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500/70 uppercase">Apellidos</label>
                    <span className="text-[10px] font-medium text-slate-500/50">{apellidos.length}/50</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej. Mendoza Pérez"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Identidad */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500/70 uppercase mb-1">Tipo</label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                  >
                    <option value="CC">Cédula</option>
                    <option value="CE">Cédula Ext.</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500/70 uppercase">Núm. Documento</label>
                    <span className="text-[10px] font-medium text-slate-500/50">{rfidDoc.length}/12</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={rfidDoc}
                    onChange={(e) => setRfidDoc(e.target.value)}
                    placeholder="Ej. 1012345678"
                    maxLength={12}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Asignación Operativa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500/70 uppercase mb-1">Departamento</label>
                  <select
                    value={deptoId}
                    onChange={(e) => setDeptoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                  >
                    {deptos.map((d) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500/70 uppercase mb-1">Zona Principal Asignada</label>
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chip RFID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-500/70 uppercase">Código del Carnet RFID *</label>
                  <span className="text-[10px] font-medium text-slate-500/50">{rfidCodigo.length}/14 máx.</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={rfidCodigo}
                  onChange={handleCarnetCodigoChange}
                  placeholder="Ej. CRN-XYZ-123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-600/40 bg-emerald-50/20 text-emerald-600 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
                {errorCarnet && (
                  <p className="text-[10px] text-red-600 font-semibold mt-1">{errorCarnet}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-600/90 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95"
                >
                  <CreditCard className="w-5 h-5" />
                  Registrar Personal y Activar Carnet
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
