import "./style.css";
import { ASSETS_BASE, getWhatsAppHelpUrl, hasWhatsAppHelp } from "./api/base";
import { loginRequest, fetchMe, requestReset, applyReset } from "./api/auth";
import { exportClientes, fetchCliente, saveCliente, type ClientePayload } from "./api/clientes";
import {
  generarRemisionPdf,
  fetchRemision,
  fetchRemisionPdf,
  fetchSiguienteNumero,
  updateRemision,
  type RemisionPayload,
} from "./api/remisiones";
import { createUser, deleteUser, fetchUsers, resetUserPassword, updateUser } from "./api/users";
import {
  canAccessUsersModule,
  clearSession,
  formatConsecutivo,
  getConsecutivo,
  getRole,
  getToken,
  getUserEmail,
  setConsecutivo,
  setRole,
  setToken,
  setUserEmail,
} from "./state/session";
import { calcularDv, formatCurrency } from "./utils/format";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <!-- Página de login - Sistema IRIS (card centrada, imagen de colaboradores visible) -->
  <div id="login-page" class="login-page">
    <div class="login-page-bg">
      <div class="login-page-overlay"></div>
    </div>
    <header class="login-header">
      <div class="login-header-brand">
        <span class="login-header-title">Sistema IRIS</span>
        <span class="login-header-sub">Sistema de gestión, de consulta e información</span>
      </div>
    </header>
    <main class="login-main">
      <div class="login-page-card">
        <h1 class="login-page-title">Acceso al sistema</h1>
        <p class="login-page-subtitle">Ingrese sus credenciales para continuar</p>
        <div class="login-input-wrap">
          <label class="login-label">Usuario o correo electrónico</label>
          <input id="login-email" type="text" placeholder="admin o correo@empresa.com" autocomplete="username" />
        </div>
        <div class="login-input-wrap password-field">
          <label class="login-label">Contraseña</label>
          <input id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" />
          <button id="login-eye" class="input-icon-btn" type="button" aria-label="Mostrar contraseña"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
        <p class="login-forgot-wrap"><button id="login-forgot" class="login-link-inline" type="button">Recuperar contraseña</button></p>
        <div id="login-error" class="login-error hidden"></div>
        <button id="login-submit" class="login-btn-continuar">Ingresar</button>
      </div>
    </main>
  </div>

  <!-- Modal recuperar contraseña (a nivel raíz para verse sobre login-page) -->
  <section id="reset-modal" class="login-modal hidden">
    <div class="login-card">
      <h2>Recuperar contraseña</h2>
      <label>Email
        <input id="reset-email" type="email" placeholder="tu@correo.com" />
      </label>
      <label>Nueva contraseña
        <div class="password-field">
          <input id="reset-password" type="password" placeholder="••••••••" />
          <button id="reset-eye" class="icon-button" type="button" aria-label="Mostrar contraseña"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        </div>
      </label>
      <label>Token (solo si aplica)
        <input id="reset-token" type="text" placeholder="Token recibido" />
      </label>
      <div id="reset-status" class="status hidden"></div>
      <div class="login-actions">
        <button id="reset-request" class="primary">Enviar enlace</button>
        <button id="reset-apply" class="secondary">Restablecer</button>
        <button id="reset-cancel" class="secondary">Cancelar</button>
      </div>
    </div>
  </section>

  <!-- App principal (solo visible tras login) -->
  <div id="app-content" class="page hidden">
    <aside class="sidebar">
      <div class="brand compact">
        <div class="brand-row">
          <img id="brand-logo" class="brand-logo" alt="EPSI HL" />
          <div class="logo">EPSI HL S.A.S</div>
        </div>
        <div class="subtitle">Sistema interno</div>
      </div>
      <nav class="nav">
        <button class="nav-item active" data-go-inicio data-nav="inicio">
          <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
          INICIO
        </button>
        <button class="nav-item" data-go-remisiones data-nav="remisiones">
          <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
          REMISIONES
        </button>
        <button class="nav-item" disabled data-nav="turno">
          <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          TURNO
        </button>
        <button class="nav-item" disabled data-nav="reportes">
          <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></span>
          REPORTES
        </button>
        <button class="nav-item" disabled data-nav="bi">
          <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          INTELIGENCIA DE NEGOCIO (BI)
        </button>
        <button class="nav-item" data-go-usuarios data-nav="usuarios">
          <span class="nav-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          USUARIOS Y CONTRASEÑAS
        </button>
      </nav>
      <div class="sidebar-footer">
        <span class="env-pill">${import.meta.env.PROD ? "Prod" : "Dev"}</span>
      </div>
    </aside>

    <div class="main">
      <header class="header">
        <div class="header-brand">
          <h1 class="page-title">Sistema IRIS</h1>
          <p class="header-subtitle">Sistema de gestión, de consulta e información</p>
        </div>
        <div class="header-right">
          <span id="current-user" class="user-pill hidden"></span>
          <button id="back-button" class="header-back-btn" aria-label="Cerrar Sesión">
            <span class="header-back-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </span>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main class="content">
      <section id="home-view" class="home">
        <section class="quick-access card">
          <h2 class="quick-access-title">Acceso rápido</h2>
          <p class="quick-access-subtitle">Navega directamente a cualquier módulo</p>
          <div class="quick-access-grid">
            <button class="quick-access-btn" data-go-remisiones>
              <span class="quick-access-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
              <span>Remisiones</span>
            </button>
            <button class="quick-access-btn" disabled>
              <span class="quick-access-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
              <span>Turno</span>
            </button>
            <button class="quick-access-btn" disabled>
              <span class="quick-access-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></span>
              <span>Reportes</span>
            </button>
            <button class="quick-access-btn" disabled>
              <span class="quick-access-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
              <span>Inteligencia de negocio (BI)</span>
            </button>
            <button class="quick-access-btn" data-go-usuarios>
              <span class="quick-access-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              <span>Usuarios y contraseñas</span>
            </button>
          </div>
        </section>
        <section class="hero">
          <div class="hero-content">
            <span class="pill">Plataforma diseñada para EPSI HL</span>
            <h1>Gestión integral al Servicio de nuestros Colaboradores</h1>
            <p>
              Centraliza la operación diaria en un solo lugar: remisiones en PDF,
              turnos del personal, usuarios con roles y reportes BI.
            </p>
            <div class="hero-actions">
              <button class="primary" data-go-remisiones>Crear remisión</button>
              <button class="secondary" disabled>Ver turnos</button>
            </div>
            <div class="hero-stats">
              <div>
                <strong>4</strong>
                <span>Módulos</span>
              </div>
              <div>
                <strong>PDF</strong>
                <span>Formato oficial</span>
              </div>
  <div>
                <strong>BI</strong>
                <span>Indicadores</span>
              </div>
            </div>
          </div>
          <div class="hero-card">
            <div class="hero-card-title">Resumen rápido</div>
            <ul>
              <li>Remisiones con consecutivo y envío automático</li>
              <li>Gestión de turnos con notificaciones</li>
              <li>Usuarios y permisos por rol</li>
              <li>Reportes ejecutivos y gráficos</li>
            </ul>
            <div class="hero-card-footer">Siempre en tiempo real</div>
          </div>
        </section>

        <section class="module-grid">
          <article class="module-card featured">
            <div class="module-icon"><img src="/icon-remisiones.png" alt="Remisiones PDF" /></div>
            <h2>Remisiones PDF</h2>
            <p>Generación automática con plantilla EPSI HL y envío por email.</p>
            <button class="primary" data-go-remisiones>Ir a remisiones</button>
          </article>
          <article class="module-card">
            <div class="module-icon"><img src="/icon-turnos.png" alt="Turnos" /></div>
            <h2>Turnos</h2>
            <p>Calendario, asignación y panel de empleado.</p>
            <button class="secondary" disabled>Próximamente</button>
          </article>
          <article class="module-card">
            <div class="module-icon"><img src="/icon-usuarios.png" alt="Usuarios y roles" /></div>
            <h2>Usuarios y roles</h2>
            <p>Gestión de usuarios, roles y permisos.</p>
            <button class="secondary user-cta" data-go-usuarios>Ir a usuarios</button>
          </article>
          <article class="module-card">
            <div class="module-icon"><img src="/icon-bi.png" alt="BI" /></div>
            <h2>BI</h2>
            <p>Estadísticas semanales/mensuales y reportes.</p>
            <button class="secondary" disabled>Próximamente</button>
          </article>
        </section>
      </section>

      <section id="remision-view" class="hidden">
        <section id="remision-buscar" class="card hidden">
          <h2>Buscar remisión</h2>
          <div class="form-grid">
            <label>Número de remisión
              <input id="buscar-remision-numero" type="text" placeholder="RM 001" />
            </label>
          </div>
          <div class="client-actions">
            <button id="buscar-remision" class="secondary" type="button">Buscar</button>
            <button id="cancelar-edicion-remision" class="secondary hidden" type="button">Cancelar edición</button>
            <span id="buscar-remision-status" class="status"></span>
          </div>
        </section>

        <div class="remision-wizard">
          <nav class="wizard-stepper" aria-label="Progreso de la remisión">
            <button type="button" class="wizard-step active" data-step="1" aria-current="step">
              <span class="wizard-step-num">1</span>
              <span class="wizard-step-label">Cliente</span>
            </button>
            <span class="wizard-step-connector"></span>
            <button type="button" class="wizard-step" data-step="2">
              <span class="wizard-step-num">2</span>
              <span class="wizard-step-label">Remisión e Items</span>
            </button>
            <span class="wizard-step-connector"></span>
            <button type="button" class="wizard-step" data-step="3">
              <span class="wizard-step-num">3</span>
              <span class="wizard-step-label">Resumen</span>
            </button>
          </nav>

          <div class="wizard-steps">
            <section class="wizard-step-panel active" data-step="1">
              <div class="card wizard-card">
                <h2>Paso 1: Datos del cliente</h2>
                <p class="wizard-hint">Completa la información del cliente. El NIT/C.C. es obligatorio.</p>
                <div class="form-grid">
                  <label>Numero de identificación
                    <input id="cliente-nit" type="text" placeholder="NIT / C.C." />
                  </label>
                  <label>DV
                    <input id="cliente-dv" type="text" placeholder="DV" readonly />
                  </label>
                  <label>Tipo de documento
                    <select id="cliente-tipo">
                      <option value="CC">Cédula de ciudadanía (CC)</option>
                      <option value="CE">Cédula de extranjería (CE)</option>
                      <option value="PAS">Pasaporte</option>
                      <option value="PPT">Permiso por protección temporal (PPT)</option>
                      <option value="NIT">NIT</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </label>
                  <label>Nombre / Razón social
                    <input id="cliente-nombre" type="text" placeholder="Nombre completo" />
                  </label>
                  <label>Dirección
                    <input id="cliente-direccion" type="text" placeholder="Dirección" />
                  </label>
                  <label>Ciudad
                    <input id="cliente-ciudad" type="text" placeholder="Ciudad" />
                  </label>
                  <label>Teléfono
                    <input id="cliente-telefono" type="text" placeholder="Teléfono" />
                  </label>
                  <label>Email
                    <input id="cliente-email" type="email" placeholder="correo@empresa.com" />
                  </label>
                </div>
                <div id="cliente-validation-warning" class="cliente-validation-warning hidden">
                  Para Guardar Cliente Nuevo debe llenar todos los campos
                </div>
                <div class="client-actions">
                  <button id="guardar-cliente" class="secondary">Guardar cliente</button>
                  <button id="exportar-clientes" class="secondary hidden" type="button">
                    Exportar base de datos de cliente
                  </button>
                  <span id="cliente-status" class="status"></span>
                </div>
              </div>
            </section>

            <section class="wizard-step-panel" data-step="2">
              <div class="card wizard-card">
                <h2>Paso 2: Remisión e items</h2>
                <p class="wizard-hint">Configura pago, observaciones y agrega los productos o servicios.</p>
                <div class="form-grid wizard-inline-fields">
                  <label>Número de remisión
                    <input id="remision-numero" type="text" placeholder="RM 001" readonly />
                  </label>
                  <label>Fecha y hora
                    <div id="remision-fecha" class="readonly-field"></div>
                  </label>
                  <label>Método de pago
                    <select id="remision-pago">
                      <option value="efectivo">Efectivo</option>
                      <option value="nequi">Efectivo - Nequi</option>
                      <option value="bancolombia">Transferencia - Bancolombia</option>
                    </select>
                  </label>
                  <label>Total
                    <input id="remision-total" type="number" value="0" min="0" />
                  </label>
                  <label>Observaciones
                    <input id="remision-observaciones" type="text" placeholder="Observaciones" />
                  </label>
                  <label id="remision-anulada-wrap" class="admin-only hidden">Anulada
                    <input id="remision-anulada" type="checkbox" />
                  </label>
                </div>
                <div class="items-table">
                  <div class="items-header">
                    <span>Cantidad</span>
                    <span>Descripción</span>
                    <span>Valor unitario</span>
                    <span>Subtotal</span>
                  </div>
                  <div class="items-row">
                    <input class="item-cantidad" type="number" value="1" min="1" />
                    <input class="item-descripcion" type="text" placeholder="Descripción" />
                    <input class="item-unitario" type="number" value="0" min="0" />
                    <input class="item-subtotal" type="number" value="0" min="0" readonly />
                  </div>
                </div>
                <button id="add-item" class="secondary">Agregar item</button>
              </div>
            </section>

            <section class="wizard-step-panel" data-step="3">
              <div class="card wizard-card">
                <h2>Paso 3: Resumen y generación</h2>
                <p class="wizard-hint">Revisa los totales y genera el PDF cuando todo esté correcto.</p>
                <div class="totals wizard-totals">
                  <div>Subtotal: <span id="subtotal">$ 0</span></div>
                  <div>Total: <span id="total">$ 0</span></div>
                </div>
                <button id="guardar-remision" class="secondary hidden" type="button">Guardar cambios</button>
                <button id="generar" class="primary wizard-generar">Generar PDF</button>
                <div id="status" class="status"></div>
              </div>
            </section>
          </div>

          <div class="wizard-nav">
            <button id="wizard-prev" class="secondary wizard-btn-prev hidden" type="button">Anterior</button>
            <span id="wizard-error" class="wizard-nav-error"></span>
            <button id="wizard-next" class="primary wizard-btn-next" type="button">Siguiente</button>
          </div>
        </div>
      </section>

      <section id="users-view" class="hidden">
        <section class="card">
          <h2>Crear usuario</h2>
          <div class="form-grid">
            <label>Nombre
              <input id="user-name" type="text" placeholder="Nombre completo" />
            </label>
            <label>Email
              <input id="user-email" type="email" placeholder="correo@epsihl.com" />
            </label>
            <label>Rol
              <select id="user-role">
                <option value="GERENCIAL">GERENCIAL</option>
                <option value="DIRECCION">DIRECCIÓN</option>
                <option value="SUPERVISION">SUPERVISIÓN</option>
                <option value="ASISTENTE">ASISTENTE</option>
                <option value="APOYO">APOYO</option>
                <option value="AUXILIARES">AUXILIARES</option>
              </select>
            </label>
            <label>Contraseña
              <input id="user-password" type="password" placeholder="********" />
            </label>
          </div>
          <div class="client-actions">
            <button id="user-create" class="primary">Crear usuario</button>
            <button id="user-cancel" class="secondary hidden" type="button">Cancelar edición</button>
            <span id="users-status" class="status"></span>
          </div>
        </section>

        <section class="card">
          <h2>Listado de usuarios</h2>
          <div class="table">
            <div class="table-head">
              <span>Nombre completo</span>
              <span>Email</span>
              <span>Rol</span>
              <span>Contraseña</span>
              <span>Acciones</span>
            </div>
            <div id="users-list" class="table-body"></div>
          </div>
        </section>
      </section>
      </main>
    </div>
  </div>
  ${hasWhatsAppHelp() ? `
  <a id="help-whatsapp" class="help-whatsapp" href="${getWhatsAppHelpUrl()}" target="_blank" rel="noopener noreferrer" aria-label="¿Necesitas ayuda? Contáctanos por WhatsApp">
    <span class="help-whatsapp-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </span>
    <span class="help-whatsapp-label">¿Necesitas ayuda?</span>
  </a>
  ` : ""}
`;

const homeView = app.querySelector<HTMLDivElement>("#home-view")!;
const remisionView = app.querySelector<HTMLDivElement>("#remision-view")!;
const usersView = app.querySelector<HTMLDivElement>("#users-view")!;
const wizardSteps = app.querySelectorAll<HTMLButtonElement>(".wizard-step");
const wizardPanels = app.querySelectorAll<HTMLElement>(".wizard-step-panel");
const wizardPrevBtn = app.querySelector<HTMLButtonElement>("#wizard-prev")!;
const wizardNextBtn = app.querySelector<HTMLButtonElement>("#wizard-next")!;
const wizardErrorEl = app.querySelector<HTMLSpanElement>("#wizard-error")!;
const backButton = app.querySelector<HTMLButtonElement>("#back-button")!;
const itemsTable = app.querySelector<HTMLDivElement>(".items-table")!;
const subtotalEl = app.querySelector<HTMLSpanElement>("#subtotal")!;
const totalEl = app.querySelector<HTMLSpanElement>("#total")!;
const statusEl = app.querySelector<HTMLDivElement>("#status")!;
const generarBtn = app.querySelector<HTMLButtonElement>("#generar")!;
const fechaEl = app.querySelector<HTMLDivElement>("#remision-fecha")!;
const buscarRemisionSection = app.querySelector<HTMLDivElement>("#remision-buscar")!;
const buscarRemisionNumeroInput = app.querySelector<HTMLInputElement>("#buscar-remision-numero")!;
const buscarRemisionBtn = app.querySelector<HTMLButtonElement>("#buscar-remision")!;
const cancelarEdicionRemisionBtn = app.querySelector<HTMLButtonElement>("#cancelar-edicion-remision")!;
const buscarRemisionStatus = app.querySelector<HTMLSpanElement>("#buscar-remision-status")!;
const guardarRemisionBtn = app.querySelector<HTMLButtonElement>("#guardar-remision")!;
const clienteStatusEl = app.querySelector<HTMLSpanElement>("#cliente-status")!;
const guardarClienteBtn = app.querySelector<HTMLButtonElement>("#guardar-cliente")!;
const exportarClientesBtn = app.querySelector<HTMLButtonElement>("#exportar-clientes")!;
const clienteNitInput = app.querySelector<HTMLInputElement>("#cliente-nit")!;
const clienteDvInput = app.querySelector<HTMLInputElement>("#cliente-dv")!;
const clienteTipoSelect = app.querySelector<HTMLSelectElement>("#cliente-tipo")!;
const clienteNombreInput = app.querySelector<HTMLInputElement>("#cliente-nombre")!;
const clienteDireccionInput = app.querySelector<HTMLInputElement>("#cliente-direccion")!;
const clienteCiudadInput = app.querySelector<HTMLInputElement>("#cliente-ciudad")!;
const clienteTelefonoInput = app.querySelector<HTMLInputElement>("#cliente-telefono")!;
const clienteEmailInput = app.querySelector<HTMLInputElement>("#cliente-email")!;
const clienteValidationWarning = app.querySelector<HTMLDivElement>("#cliente-validation-warning")!;
const remisionNumeroInput = app.querySelector<HTMLInputElement>("#remision-numero")!;
const remisionAnuladaWrap = app.querySelector<HTMLLabelElement>("#remision-anulada-wrap")!;
const remisionAnuladaInput = app.querySelector<HTMLInputElement>("#remision-anulada")!;
const currentUserEl = app.querySelector<HTMLSpanElement>("#current-user")!;
const userNameInput = app.querySelector<HTMLInputElement>("#user-name")!;
const userEmailInput = app.querySelector<HTMLInputElement>("#user-email")!;
const userRoleSelect = app.querySelector<HTMLSelectElement>("#user-role")!;
const userPasswordInput = app.querySelector<HTMLInputElement>("#user-password")!;
const userCreateBtn = app.querySelector<HTMLButtonElement>("#user-create")!;
const userCancelBtn = app.querySelector<HTMLButtonElement>("#user-cancel")!;
let editingUserId: string | null = null;
let editingRemisionNumero: string | null = null;
let wizardCurrentStep = 1;
const WIZARD_MAX_STEP = 3;
const usersStatus = app.querySelector<HTMLSpanElement>("#users-status")!;
const usersList = app.querySelector<HTMLDivElement>("#users-list")!;
const loginEmail = app.querySelector<HTMLInputElement>("#login-email")!;
const loginPassword = app.querySelector<HTMLInputElement>("#login-password")!;
const loginEye = app.querySelector<HTMLButtonElement>("#login-eye")!;
const loginError = app.querySelector<HTMLDivElement>("#login-error")!;
const loginSubmit = app.querySelector<HTMLButtonElement>("#login-submit")!;
const loginForgot = app.querySelector<HTMLButtonElement>("#login-forgot")!;
const resetModal = app.querySelector<HTMLDivElement>("#reset-modal")!;
const resetEmail = app.querySelector<HTMLInputElement>("#reset-email")!;
const resetPassword = app.querySelector<HTMLInputElement>("#reset-password")!;
const resetEye = app.querySelector<HTMLButtonElement>("#reset-eye")!;
const resetToken = app.querySelector<HTMLInputElement>("#reset-token")!;
const resetStatus = app.querySelector<HTMLDivElement>("#reset-status")!;
const resetRequest = app.querySelector<HTMLButtonElement>("#reset-request")!;
const resetApply = app.querySelector<HTMLButtonElement>("#reset-apply")!;
const resetCancel = app.querySelector<HTMLButtonElement>("#reset-cancel")!;
let pendingAction: null | (() => void) = null;

const logoImg = app.querySelector<HTMLImageElement>("#brand-logo")!;
const logoBase = ASSETS_BASE;
const logoSources = [
  "/Icono.png",
  `${logoBase}/assets/Icono.png`,
];
let logoIndex = 0;
logoImg.src = logoSources[logoIndex];
logoImg.addEventListener("error", () => {
  logoIndex += 1;
  if (logoIndex < logoSources.length) {
    logoImg.src = logoSources[logoIndex];
    return;
  }
  logoImg.style.display = "none";
});

const setActiveNav = (navId: "inicio" | "remisiones" | "turno" | "reportes" | "bi" | "usuarios") => {
  app.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-nav") === navId) {
      btn.classList.add("active");
    }
  });
};

const goHome = () => {
  homeView.classList.remove("hidden");
  remisionView.classList.add("hidden");
  usersView.classList.add("hidden");
  backButton.disabled = true;
  setActiveNav("inicio");
};

/** Limpia el formulario de remisión al cambiar de usuario (evita que persistan datos del usuario anterior) */
const clearRemisionForm = () => {
  exitEditMode();
  clienteNitInput.value = "";
  clienteDvInput.value = "";
  clienteTipoSelect.value = "CC";
  clienteNombreInput.value = "";
  clienteDireccionInput.value = "";
  clienteCiudadInput.value = "";
  clienteTelefonoInput.value = "";
  resetItemsTable();
  addItemRow();
  (app.querySelector<HTMLSelectElement>("#remision-pago")!).value = "efectivo";
  (app.querySelector<HTMLInputElement>("#remision-observaciones")!).value = "";
  (app.querySelector<HTMLInputElement>("#remision-total")!).value = "0";
  remisionAnuladaInput.checked = false;
  buscarRemisionNumeroInput.value = "";
  buscarRemisionStatus.textContent = "";
  clienteStatusEl.textContent = "";
  statusEl.textContent = "";
  cargarConsecutivo();
  recalc();
  goToWizardStep(1);
};

const loginPageEl = app.querySelector<HTMLDivElement>("#login-page")!;
const appContentEl = app.querySelector<HTMLDivElement>("#app-content")!;

const showLoginPage = () => {
  loginPageEl.classList.remove("hidden");
  appContentEl.classList.add("hidden");
};

const showAppContent = () => {
  loginPageEl.classList.add("hidden");
  appContentEl.classList.remove("hidden");
};

const openLogin = (afterLogin?: () => void) => {
  loginEmail.value = "";
  loginPassword.value = "";
  loginError.classList.add("hidden");
  loginError.textContent = "";
  pendingAction = afterLogin || null;
  showLoginPage();
};

const closeLogin = () => {
  showAppContent();
};

const applyRole = (role: string | null) => {
  const isGerencial = role === "GERENCIAL";
  const isEditing = Boolean(editingRemisionNumero);
  app.querySelectorAll<HTMLButtonElement>("[data-go-usuarios]").forEach((button) => {
    button.disabled = !canAccessUsersModule(role);
  });
  remisionNumeroInput.readOnly = !isGerencial || isEditing;
  remisionAnuladaWrap.classList.toggle("hidden", !isGerencial);
  buscarRemisionSection.classList.toggle("hidden", !isGerencial);
  exportarClientesBtn.classList.toggle("hidden", !isGerencial);
  guardarRemisionBtn.classList.toggle("hidden", !isGerencial || !isEditing);
  cancelarEdicionRemisionBtn.classList.toggle("hidden", !isGerencial || !isEditing);
  if (!isGerencial) {
    remisionAnuladaInput.checked = false;
  }
};

const refreshRole = async () => {
  const token = getToken();
  if (!token) {
    applyRole(null);
    return;
  }
  try {
    const response = await fetchMe(token);
    if (!response.ok) {
      applyRole(null);
      return;
    }
    const data = await response.json();
    const role = data?.role || data?.user?.role;
    if (role) {
      setRole(role);
      applyRole(role);
    }
  } catch {
    applyRole(null);
  }
};

const openReset = () => {
  resetEmail.value = "";
  resetPassword.value = "";
  resetToken.value = "";
  resetStatus.classList.add("hidden");
  resetStatus.textContent = "";
  resetModal.classList.remove("hidden");
  resetModal.style.display = "flex";
};

const closeReset = () => {
  resetModal.classList.add("hidden");
  resetModal.style.removeProperty("display");
};

const login = async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) {
    loginError.textContent = "Email y contraseña requeridos.";
    loginError.classList.remove("hidden");
    return;
  }
  try {
    loginSubmit.disabled = true;
    const response = await loginRequest(email, password);
    if (!response.ok) {
      const message = await response.text();
      loginError.textContent = message || "Credenciales inválidas.";
      loginError.classList.remove("hidden");
      loginSubmit.disabled = false;
      return;
    }
    const data = await response.json();
    setToken(data.token);
    setUserEmail(data.email);
    if (data.role) {
      setRole(data.role);
      applyRole(data.role);
    } else {
      await refreshRole();
    }
    clearRemisionForm();
    currentUserEl.textContent = `Usuario: ${data.email}`;
    currentUserEl.classList.remove("hidden");
    statusEl.textContent = "Sesión iniciada.";
    closeLogin();
    if (pendingAction) {
      const action = pendingAction;
      pendingAction = null;
      action();
    }
    loginSubmit.disabled = false;
  } catch {
    loginError.textContent = "No se pudo conectar al servidor.";
    loginError.classList.remove("hidden");
    loginSubmit.disabled = false;
  }
};

const cargarConsecutivo = async () => {
  const token = getToken();
  if (token) {
    try {
      const siguiente = await fetchSiguienteNumero(token);
      setConsecutivo(siguiente);
    } catch (_) {
      /* usar localStorage como fallback */
    }
  }
  remisionNumeroInput.value = formatConsecutivo(getConsecutivo());
};

const updateFechaHora = () => {
  const now = new Date();
  const display = now.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  fechaEl.textContent = display;
};

type Cliente = {
  nit: string;
  dv?: string;
  tipoDocumento?: string;
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
};

const actualizarDv = () => {
  const nit = clienteNitInput.value.trim();
  clienteDvInput.value = calcularDv(nit);
};

const fetchClienteDb = async (nit: string) => {
  const token = getToken();
  if (!token) return null;
  const response = await fetchCliente(nit, token);
  if (!response.ok) return null;
  const data = await response.json();
  return data.cliente as Cliente;
};

const saveClienteDb = async (cliente: Cliente) => {
  const token = getToken();
  if (!token) return false;
  const payload: ClientePayload = {
    tipo_documento: cliente.tipoDocumento || null,
    numero_documento: cliente.nit,
    dv: cliente.dv || null,
    nombre: cliente.nombre || null,
    ciudad: cliente.ciudad || null,
    direccion: cliente.direccion || null,
    telefono: cliente.telefono || null,
    email: cliente.email || null,
  };
  const response = await saveCliente(payload, token);
  return response.ok;
};

const llenarCliente = (cliente: Record<string, string>) => {
  const tipoDocumento = cliente.tipoDocumento || cliente.tipo_documento || "CC";
  clienteTipoSelect.value = tipoDocumento;
  clienteNombreInput.value = cliente.nombre || "";
  clienteDireccionInput.value = cliente.direccion || "";
  clienteCiudadInput.value = cliente.ciudad || "";
  clienteTelefonoInput.value = cliente.telefono || "";
  clienteEmailInput.value = cliente.email || "";
  clienteDvInput.value = cliente.dv || calcularDv(clienteNitInput.value);
};

const limpiarCliente = () => {
  clienteNombreInput.value = "";
  clienteDireccionInput.value = "";
  clienteCiudadInput.value = "";
  clienteTelefonoInput.value = "";
  clienteEmailInput.value = "";
  clienteDvInput.value = "";
};

clienteNitInput.addEventListener("input", () => {
  actualizarDv();
});

clienteNitInput.addEventListener("blur", async () => {
  const nit = clienteNitInput.value.trim();
  actualizarDv();
  if (!nit) return;
  const cliente = await fetchClienteDb(nit);
  if (cliente) {
    llenarCliente(cliente);
    clienteValidationWarning.classList.add("hidden");
    clienteStatusEl.textContent = "Cliente encontrado y cargado.";
  } else {
    limpiarCliente();
    clienteValidationWarning.classList.add("hidden");
    clienteStatusEl.textContent = "Cliente no encontrado. Puedes guardarlo.";
  }
});

guardarClienteBtn.addEventListener("click", async () => {
  const nit = clienteNitInput.value.trim();
  if (!nit) {
    clienteStatusEl.textContent = "Ingresa el NIT para guardar.";
    clienteValidationWarning.classList.add("hidden");
    return;
  }
  actualizarDv();
  const nombre = clienteNombreInput.value.trim();
  const direccion = clienteDireccionInput.value.trim();
  const ciudad = clienteCiudadInput.value.trim();
  const telefono = clienteTelefonoInput.value.trim();
  const email = clienteEmailInput.value.trim();

  const clienteExistente = await fetchClienteDb(nit);
  if (!clienteExistente) {
    const camposRequeridos = [nombre, direccion, ciudad, telefono, email];
    const faltanCampos = camposRequeridos.some((v) => !v);
    if (faltanCampos) {
      clienteValidationWarning.classList.remove("hidden");
      clienteStatusEl.textContent = "";
      return;
    }
  }
  clienteValidationWarning.classList.add("hidden");

  const cliente = {
    nit,
    dv: clienteDvInput.value.trim(),
    tipoDocumento: clienteTipoSelect.value,
    nombre,
    direccion,
    ciudad,
    telefono,
    email,
  };
  const ok = await saveClienteDb(cliente);
  clienteStatusEl.textContent = ok
    ? "Cliente guardado correctamente."
    : "No se pudo guardar el cliente.";
});

exportarClientesBtn.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    clienteStatusEl.textContent = "Debes iniciar sesión para exportar.";
    openLogin(goRemisiones);
    return;
  }
  clienteStatusEl.textContent = "Exportando base de datos...";
  try {
    const response = await exportClientes(token);
    if (!response.ok) {
      const msg = await response.text();
      clienteStatusEl.textContent = msg || "No se pudo exportar la base de datos.";
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clientes_epsihl.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    clienteStatusEl.textContent = "Exportación completada.";
  } catch {
    clienteStatusEl.textContent = "Error exportando la base de datos.";
  }
});
const goToWizardStep = (step: number) => {
  if (step < 1 || step > WIZARD_MAX_STEP) return;
  wizardCurrentStep = step;

  wizardSteps.forEach((btn) => {
    const n = Number(btn.dataset.step);
    btn.classList.remove("active");
    btn.removeAttribute("aria-current");
    if (n < step) {
      btn.classList.add("completed");
    } else {
      btn.classList.remove("completed");
    }
    if (n === step) {
      btn.classList.add("active");
      btn.setAttribute("aria-current", "step");
    }
  });

  wizardPanels.forEach((panel) => {
    const n = Number(panel.dataset.step);
    panel.classList.toggle("active", n === step);
  });

  wizardPrevBtn.classList.toggle("hidden", step === 1);
  wizardNextBtn.classList.toggle("hidden", step === WIZARD_MAX_STEP);
};

const clearWizardError = () => {
  clienteStatusEl.textContent = "";
  wizardErrorEl.textContent = "";
  statusEl.textContent = "";
};

const validateWizardStep = (step: number): boolean => {
  clearWizardError();
  if (step === 1) {
    const nit = clienteNitInput.value.trim();
    if (!nit) {
      clienteStatusEl.textContent = "Ingresa el NIT o C.C. del cliente para continuar.";
      return false;
    }
    const nombre = clienteNombreInput.value.trim();
    if (!nombre) {
      clienteStatusEl.textContent = "Ingresa el nombre o razón social para continuar.";
      return false;
    }
    return true;
  }
  if (step === 2) {
    const rows = Array.from(app.querySelectorAll<HTMLDivElement>(".items-row"));
    const hasValid = rows.some((row) => {
      const desc = row.querySelector<HTMLInputElement>(".item-descripcion")!.value.trim();
      return desc.length > 0;
    });
    if (!hasValid) {
      wizardErrorEl.textContent = "Agrega al menos un item con descripción para continuar.";
      return false;
    }
    return true;
  }
  return true;
};

const goRemisiones = async () => {
  homeView.classList.add("hidden");
  remisionView.classList.remove("hidden");
  usersView.classList.add("hidden");
  backButton.disabled = false;
  setActiveNav("remisiones");
  await cargarConsecutivo();
  applyRole(getRole());
  goToWizardStep(1);
};

const goUsers = () => {
  const role = getRole();
  if (!canAccessUsersModule(role)) {
    window.alert("No tienes permisos. Inicia sesión con un usuario autorizado.");
    clearSession();
    currentUserEl.textContent = "";
    currentUserEl.classList.add("hidden");
    applyRole(null);
    openLogin(goUsers);
    return;
  }
  homeView.classList.add("hidden");
  remisionView.classList.add("hidden");
  usersView.classList.remove("hidden");
  backButton.disabled = false;
  setActiveNav("usuarios");
  loadUsers();
};

app.querySelectorAll("[data-go-inicio]").forEach((button) => {
  button.addEventListener("click", () => {
    const token = getToken();
    if (!token) {
      openLogin(goHome);
      return;
    }
    goHome();
  });
});

app.querySelectorAll("[data-go-remisiones]").forEach((button) => {
  button.addEventListener("click", () => {
    const token = getToken();
    if (!token) {
      openLogin(goRemisiones);
      return;
    }
    goRemisiones();
  });
});

app.querySelectorAll("[data-go-usuarios]").forEach((button) => {
  button.addEventListener("click", () => {
    const token = getToken();
    if (!token) {
      openLogin(goUsers);
      return;
    }
    goUsers();
  });
});

backButton.addEventListener("click", () => {
  clearSession();
  currentUserEl.textContent = "";
  currentUserEl.classList.add("hidden");
  showLoginPage();
});

const recalc = () => {
  const itemRows = Array.from(app.querySelectorAll<HTMLDivElement>(".items-row"));
  let itemsSubtotal = 0;
  itemRows.forEach((row) => {
    const cantidad = Number(row.querySelector<HTMLInputElement>(".item-cantidad")!.value || 0);
    const unitario = Number(row.querySelector<HTMLInputElement>(".item-unitario")!.value || 0);
    const rowSubtotal = cantidad * unitario;
    row.querySelector<HTMLInputElement>(".item-subtotal")!.value = String(rowSubtotal);
    itemsSubtotal += rowSubtotal;
  });

  const totalInput = Number(app.querySelector<HTMLInputElement>("#remision-total")!.value || 0);
  const subtotal = totalInput / 1.19;
  const total = totalInput;

  subtotalEl.textContent = formatCurrency(subtotal);
  totalEl.textContent = formatCurrency(total);
};

const resetItemsTable = () => {
  const header = itemsTable.querySelector(".items-header");
  itemsTable.innerHTML = "";
  if (header) {
    itemsTable.appendChild(header);
  }
};

const setItemsFromRemision = (items: Array<{ cantidad: number; descripcion: string; valorUnitario: number; subtotal: number }>) => {
  resetItemsTable();
  if (!items || items.length === 0) {
    addItemRow();
  } else {
    items.forEach((item) => addItemRow(item));
  }
  recalc();
};

const enterEditMode = (numero: string) => {
  editingRemisionNumero = numero;
  generarBtn.disabled = true;
  applyRole(getRole());
};

const exitEditMode = () => {
  editingRemisionNumero = null;
  generarBtn.disabled = false;
  applyRole(getRole());
};

const addItemRow = (item?: { cantidad?: number; descripcion?: string; valorUnitario?: number; subtotal?: number }) => {
  const row = document.createElement("div");
  row.className = "items-row";
  row.innerHTML = `
    <input class="item-cantidad" type="number" value="1" min="1" />
    <input class="item-descripcion" type="text" placeholder="Descripción" />
    <input class="item-unitario" type="number" value="0" min="0" />
    <input class="item-subtotal" type="number" value="0" min="0" readonly />
  `;
  if (item) {
    (row.querySelector<HTMLInputElement>(".item-cantidad")!).value = String(item.cantidad ?? 1);
    (row.querySelector<HTMLInputElement>(".item-descripcion")!).value = item.descripcion ?? "";
    (row.querySelector<HTMLInputElement>(".item-unitario")!).value = String(item.valorUnitario ?? 0);
    (row.querySelector<HTMLInputElement>(".item-subtotal")!).value = String(item.subtotal ?? 0);
  }
  itemsTable.appendChild(row);
  row.querySelectorAll("input").forEach((input) => input.addEventListener("input", recalc));
};

app.querySelector("#add-item")!.addEventListener("click", () => {
  addItemRow();
});

app.querySelectorAll("input, select").forEach((input) => {
  input.addEventListener("input", recalc);
});

buscarRemisionBtn.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    buscarRemisionStatus.textContent = "Debes iniciar sesión.";
    openLogin(goRemisiones);
    return;
  }
  const numero = buscarRemisionNumeroInput.value.trim();
  if (!numero) {
    buscarRemisionStatus.textContent = "Ingresa el número de remisión.";
    return;
  }
  buscarRemisionStatus.textContent = "Buscando remisión...";
  try {
    const response = await fetchRemision(numero, token);
    if (!response.ok) {
      const msg = await response.text();
      buscarRemisionStatus.textContent = msg || "No se pudo encontrar la remisión.";
      return;
    }
    const data = await response.json();
    const remision = data.remision;
    remisionNumeroInput.value = remision.numero || numero;
    remisionAnuladaInput.checked = Boolean(remision.anulada);
    (app.querySelector<HTMLSelectElement>("#remision-pago")!).value = remision.metodoPago || "efectivo";
    (app.querySelector<HTMLInputElement>("#remision-observaciones")!).value = remision.observaciones || "";
    (app.querySelector<HTMLInputElement>("#remision-total")!).value = String(remision.total || 0);
    clienteNombreInput.value = remision.cliente?.nombre || "";
    clienteNitInput.value = remision.cliente?.nit || "";
    clienteDvInput.value = remision.cliente?.dv || "";
    clienteTipoSelect.value = remision.cliente?.tipoDocumento || remision.cliente?.tipo_documento || "CC";
    clienteDireccionInput.value = remision.cliente?.direccion || "";
    clienteCiudadInput.value = remision.cliente?.ciudad || "";
    clienteTelefonoInput.value = remision.cliente?.telefono || "";
    setItemsFromRemision(remision.items || []);
    enterEditMode(numero);
    recalc();
    goToWizardStep(3);
    buscarRemisionStatus.textContent = "Remisión cargada para edición.";
  } catch {
    buscarRemisionStatus.textContent = "Error consultando la remisión.";
  }
});

cancelarEdicionRemisionBtn.addEventListener("click", () => {
  exitEditMode();
  buscarRemisionStatus.textContent = "Edición cancelada.";
});

wizardPrevBtn.addEventListener("click", () => {
  clearWizardError();
  if (wizardCurrentStep > 1) {
    goToWizardStep(wizardCurrentStep - 1);
  }
});

wizardNextBtn.addEventListener("click", () => {
  if (wizardCurrentStep === WIZARD_MAX_STEP) return;
  if (wizardCurrentStep < WIZARD_MAX_STEP && validateWizardStep(wizardCurrentStep)) {
    recalc();
    goToWizardStep(wizardCurrentStep + 1);
  }
});

wizardSteps.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetStep = Number(btn.dataset.step);
    if (targetStep <= wizardCurrentStep) {
      clearWizardError();
      goToWizardStep(targetStep);
    } else if (targetStep > wizardCurrentStep) {
      for (let s = wizardCurrentStep; s < targetStep; s++) {
        if (!validateWizardStep(s)) return;
      }
      recalc();
      goToWizardStep(targetStep);
    }
  });
});

const buildRemisionPayload = (): RemisionPayload => {
  const itemRows = Array.from(app.querySelectorAll<HTMLDivElement>(".items-row"));
  const items = itemRows.map((row) => ({
    cantidad: Number(row.querySelector<HTMLInputElement>(".item-cantidad")!.value || 0),
    descripcion: row.querySelector<HTMLInputElement>(".item-descripcion")!.value || "",
    valorUnitario: Number(row.querySelector<HTMLInputElement>(".item-unitario")!.value || 0),
    subtotal: Number(row.querySelector<HTMLInputElement>(".item-subtotal")!.value || 0),
  }));

  const total = Number(app.querySelector<HTMLInputElement>("#remision-total")!.value || 0);
  const ivaPorcentaje = 19;
  const subtotal = total / 1.19;
  const iva = total - subtotal;

  return {
    numero: (app.querySelector<HTMLInputElement>("#remision-numero")!.value || "0001").trim(),
    fecha: new Date().toISOString(),
    metodoPago: app.querySelector<HTMLSelectElement>("#remision-pago")!.value as RemisionPayload["metodoPago"],
    observaciones: app.querySelector<HTMLInputElement>("#remision-observaciones")!.value || "",
    anulada: remisionAnuladaInput.checked,
    cliente: {
      nombre: app.querySelector<HTMLInputElement>("#cliente-nombre")!.value || "",
      nit: app.querySelector<HTMLInputElement>("#cliente-nit")!.value || "",
      dv: app.querySelector<HTMLInputElement>("#cliente-dv")!.value || "",
      tipoDocumento: app.querySelector<HTMLSelectElement>("#cliente-tipo")!.value || "",
      direccion: app.querySelector<HTMLInputElement>("#cliente-direccion")!.value || "",
      ciudad: app.querySelector<HTMLInputElement>("#cliente-ciudad")!.value || "",
      telefono: app.querySelector<HTMLInputElement>("#cliente-telefono")!.value || "",
    },
    items,
    subtotal,
    ivaPorcentaje,
    iva,
    total,
  } as RemisionPayload;
};

guardarRemisionBtn.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    statusEl.textContent = "Debes iniciar sesión para guardar.";
    openLogin(goRemisiones);
    return;
  }
  if (!editingRemisionNumero) {
    statusEl.textContent = "No hay remisión en edición.";
    return;
  }
  statusEl.textContent = "Guardando cambios...";
  try {
    const payload = buildRemisionPayload();
    const response = await updateRemision(editingRemisionNumero, payload, token);
    if (!response.ok) {
      const msg = await response.text();
      statusEl.textContent = msg || "No se pudo guardar la remisión.";
      return;
    }
    const pdfResponse = await fetchRemisionPdf(editingRemisionNumero, token);
    if (pdfResponse.ok) {
      const pdf = await pdfResponse.blob();
      const url = URL.createObjectURL(pdf);
      window.open(url, "_blank");
    }
    statusEl.textContent = "Remisión actualizada.";
  } catch {
    statusEl.textContent = "Error guardando la remisión.";
  }
});

app.querySelector("#generar")!.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    statusEl.textContent = "Debes iniciar sesión para generar remisiones.";
    openLogin();
    return;
  }
  statusEl.textContent = "Generando PDF...";
  const payload = buildRemisionPayload();

  try {
    const pdf = await generarRemisionPdf(payload);
    const url = URL.createObjectURL(pdf);
    window.open(url, "_blank");
    statusEl.textContent = "PDF generado.";
    await cargarConsecutivo();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      statusEl.textContent = "Debes iniciar sesión para generar remisiones.";
      openLogin();
      return;
    }
    statusEl.textContent = error instanceof Error ? error.message : "Error al generar PDF.";
  }
});

const loadUsers = async () => {
  const token = getToken();
  if (!token) return;
  usersStatus.textContent = "Cargando usuarios...";
  try {
    const response = await fetchUsers(token);
    if (!response.ok) {
      usersStatus.textContent = "No tienes permisos para ver usuarios.";
      return;
    }
    const data = await response.json();
    usersList.innerHTML = data.users
    .map(
      (user: any) => `
        <div class="table-row">
          <span>${user.name || "Sin nombre"}</span>
          <span>${user.email}</span>
          <span>${user.role}</span>
          <span>********</span>
          <div class="actions">
            <button class="secondary" data-edit-user="${user.id}">Modificar</button>
            <button class="secondary" data-reset-user="${user.id}">Reset</button>
            <button class="secondary" data-delete-user="${user.id}">Eliminar</button>
          </div>
  </div>
`
    )
    .join("");
    usersStatus.textContent = "";

    usersList.querySelectorAll("[data-edit-user]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLButtonElement).dataset.editUser;
        if (!id) return;
        const user = data.users.find((u: any) => String(u.id) === String(id));
        if (!user) return;
        editingUserId = String(id);
        userNameInput.value = user.name || "";
        userEmailInput.value = user.email || "";
        userRoleSelect.value = user.role || "GERENCIAL";
        userPasswordInput.value = "";
        userCreateBtn.textContent = "Guardar cambios";
        userCancelBtn.classList.remove("hidden");
        usersStatus.textContent = "Editando usuario...";
      });
    });

    usersList.querySelectorAll("[data-reset-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLButtonElement).dataset.resetUser;
        if (!id) return;
        const responseReset = await resetUserPassword(id, token);
        if (!responseReset.ok) {
          usersStatus.textContent = "No se pudo resetear.";
          return;
        }
        const data = await responseReset.json();
        usersStatus.textContent = `Nueva contraseña temporal: ${data.tempPassword}`;
      });
    });

    usersList.querySelectorAll("[data-delete-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLButtonElement).dataset.deleteUser;
        if (!id) return;
        const confirmDelete = window.confirm("¿Eliminar usuario?");
        if (!confirmDelete) return;
        const responseDelete = await deleteUser(id, token);
        if (!responseDelete.ok) {
          usersStatus.textContent = "No se pudo eliminar.";
          return;
        }
        await loadUsers();
      });
    });
  } catch {
    usersStatus.textContent = "Error cargando usuarios.";
  }
};

userCreateBtn.addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    usersStatus.textContent = "Debes iniciar sesión.";
    openLogin(goUsers);
    return;
  }
  const basePayload = {
    name: userNameInput.value.trim(),
    email: userEmailInput.value.trim(),
    role: userRoleSelect.value,
  };
  const passwordValue = userPasswordInput.value;
  if (!basePayload.email) {
    usersStatus.textContent = "Email es obligatorio.";
    return;
  }
  const isEditing = Boolean(editingUserId);
  if (!isEditing && !passwordValue) {
    usersStatus.textContent = "La contraseña es obligatoria.";
    return;
  }
  const payload = {
    ...basePayload,
    ...(passwordValue ? { password: passwordValue } : {}),
  };
  usersStatus.textContent = isEditing ? "Guardando cambios..." : "Creando usuario...";
  try {
    const response = isEditing && editingUserId
      ? await updateUser(editingUserId, payload, token)
      : await createUser(payload, token);
    if (!response.ok) {
      const msg = await response.text();
      usersStatus.textContent = msg || (isEditing ? "No se pudo actualizar el usuario." : "No se pudo crear el usuario.");
      return;
    }
    userNameInput.value = "";
    userEmailInput.value = "";
    userPasswordInput.value = "";
    userRoleSelect.value = "GERENCIAL";
    usersStatus.textContent = isEditing ? "Usuario actualizado." : "Usuario creado.";
    editingUserId = null;
    userCreateBtn.textContent = "Crear usuario";
    userCancelBtn.classList.add("hidden");
    loadUsers();
  } catch {
    usersStatus.textContent = isEditing ? "Error actualizando usuario." : "Error creando usuario.";
  }
});

userCancelBtn.addEventListener("click", () => {
  editingUserId = null;
  userNameInput.value = "";
  userEmailInput.value = "";
  userPasswordInput.value = "";
  userRoleSelect.value = "GERENCIAL";
  userCreateBtn.textContent = "Crear usuario";
  userCancelBtn.classList.add("hidden");
  usersStatus.textContent = "Edición cancelada.";
});

updateFechaHora();
setInterval(updateFechaHora, 60000);
cargarConsecutivo();
recalc();

const savedUser = getUserEmail();
if (savedUser) {
  currentUserEl.textContent = `Usuario: ${savedUser}`;
  currentUserEl.classList.remove("hidden");
}
applyRole(getRole());
refreshRole();

/** Al cargar: si hay token válido mostrar app, si no mostrar login */
const checkAuthAndInit = async () => {
  const token = getToken();
  if (!token) {
    showLoginPage();
    return;
  }
  try {
    const response = await fetchMe(token);
    if (response.ok) {
      const data = await response.json();
      if (data?.role) setRole(data.role);
      if (data?.email) setUserEmail(data.email);
      applyRole(getRole());
      showAppContent();
    } else {
      clearSession();
      showLoginPage();
    }
  } catch {
    clearSession();
    showLoginPage();
  }
};
checkAuthAndInit();

loginSubmit.addEventListener("click", login);
loginEye.addEventListener("click", () => {
  loginPassword.type = loginPassword.type === "password" ? "text" : "password";
});
loginForgot.addEventListener("click", () => openReset());

resetCancel.addEventListener("click", closeReset);
resetEye.addEventListener("click", () => {
  resetPassword.type = resetPassword.type === "password" ? "text" : "password";
});
resetRequest.addEventListener("click", async () => {
  const email = resetEmail.value.trim();
  if (!email) {
    resetStatus.textContent = "Ingresa el correo.";
    resetStatus.classList.remove("hidden");
    return;
  }
  const response = await requestReset(email);
  const data = await response.json();
  resetStatus.textContent = data.devToken
    ? `Token dev: ${data.devToken}`
    : data.message || "Solicitud enviada.";
  resetStatus.classList.remove("hidden");
});

resetApply.addEventListener("click", async () => {
  const token = resetToken.value.trim();
  const password = resetPassword.value;
  if (!token || !password) {
    resetStatus.textContent = "Token y contraseña requeridos.";
    resetStatus.classList.remove("hidden");
    return;
  }
  const response = await applyReset(token, password);
  const data = await response.json();
  resetStatus.textContent = data.message || "Proceso terminado.";
  resetStatus.classList.remove("hidden");
});
