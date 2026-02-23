import "./style.css";
import { generarRemisionPdf, type RemisionPayload } from "./api/remisiones";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="page">
    <aside class="sidebar">
      <div class="brand compact">
        <div class="brand-row">
          <img id="brand-logo" class="brand-logo" alt="EPSI HL" />
          <div class="logo">EPSI HL</div>
        </div>
        <div class="subtitle">Sistema interno</div>
      </div>
      <nav class="nav">
        <button class="nav-item active" data-go-remisiones>Remisiones</button>
        <button class="nav-item" disabled>Turnos</button>
        <button class="nav-item" data-go-usuarios>Usuarios</button>
        <button class="nav-item" disabled>BI</button>
      </nav>
      <div class="sidebar-footer">
        <span class="env-pill">Dev</span>
      </div>
    </aside>

    <div class="main">
      <header class="header">
        <div>
          <h1 class="page-title">Sistema IRIS</h1>
          <div class="subtitle">Sistema de gestión, de consulta e información</div>
        </div>
        <div class="header-right">
          <span id="current-user" class="user-pill hidden"></span>
          <button id="back-button" class="ghost" aria-label="Volver">← Volver</button>
        </div>
      </header>

      <main class="content">
      <section id="login-modal" class="login-modal hidden">
        <div class="login-card">
          <h2>Iniciar sesión</h2>
          <label>Email
            <input id="login-email" type="email" placeholder="Hernan@epsihl.com" />
          </label>
          <label>Contraseña
              <div class="password-field">
                <input id="login-password" type="password" placeholder="••••••••" />
                <button id="login-eye" class="icon-button" type="button">👁</button>
              </div>
          </label>
          <div id="login-error" class="status hidden"></div>
          <div class="login-actions">
            <button id="login-submit" class="primary">Ingresar</button>
            <button id="login-cancel" class="secondary">Cancelar</button>
          </div>
          <div class="login-links">
            <button id="login-forgot" class="link">¿Olvidaste la contraseña?</button>
            <button id="login-register" class="link">Crear usuario</button>
          </div>
        </div>
      </section>

      <section id="reset-modal" class="login-modal hidden">
        <div class="login-card">
          <h2>Recuperar contraseña</h2>
          <label>Email
            <input id="reset-email" type="email" placeholder="tu@correo.com" />
          </label>
          <label>Nueva contraseña
            <div class="password-field">
              <input id="reset-password" type="password" placeholder="••••••••" />
              <button id="reset-eye" class="icon-button" type="button">👁</button>
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
      <section id="home-view" class="home">
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
            <div class="module-icon">📄</div>
            <h2>Remisiones PDF</h2>
            <p>Generación automática con plantilla EPSI HL y envío por email.</p>
            <button class="primary" data-go-remisiones>Ir a remisiones</button>
          </article>
          <article class="module-card">
            <div class="module-icon">📅</div>
            <h2>Turnos</h2>
            <p>Calendario, asignación y panel de empleado.</p>
            <button class="secondary" disabled>Próximamente</button>
          </article>
          <article class="module-card">
            <div class="module-icon">👥</div>
            <h2>Usuarios y roles</h2>
            <p>Gestión de usuarios, roles y permisos.</p>
            <button class="secondary user-cta" data-go-usuarios>Ir a usuarios</button>
          </article>
          <article class="module-card">
            <div class="module-icon">📊</div>
            <h2>BI</h2>
            <p>Estadísticas semanales/mensuales y reportes.</p>
            <button class="secondary" disabled>Próximamente</button>
          </article>
        </section>
      </section>

      <section id="remision-view" class="hidden">
        <section class="card">
          <h2>Datos del cliente</h2>
          <div class="form-grid">
            <label>NIT / C.C.
              <input id="cliente-nit" type="text" placeholder="NIT / C.C." />
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
          </div>
          <div class="client-actions">
            <button id="guardar-cliente" class="secondary">Guardar cliente</button>
            <span id="cliente-status" class="status"></span>
          </div>
        </section>

        <section class="card">
          <h2>Remisión</h2>
          <div class="form-grid">
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
                <option value="bancolombia">Transferencia - BanColombia</option>
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
        </section>

        <section class="card">
          <h2>Items</h2>
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
        </section>

        <section class="card">
          <h2>Totales</h2>
          <div class="totals">
            <div>Subtotal: <span id="subtotal">$ 0</span></div>
            <div>Total: <span id="total">$ 0</span></div>
          </div>
          <button id="generar" class="primary">Generar PDF</button>
          <div id="status" class="status"></div>
        </section>
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
                <option value="EMPLEADO">EMPLEADO</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="GERENTE">GERENTE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label>Contraseña
              <input id="user-password" type="password" placeholder="********" />
            </label>
          </div>
          <div class="client-actions">
            <button id="user-create" class="primary">Crear usuario</button>
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
`;

const formatCurrency = (value: number) => `$ ${value.toLocaleString("es-CO")}`;

const homeView = app.querySelector<HTMLDivElement>("#home-view")!;
const remisionView = app.querySelector<HTMLDivElement>("#remision-view")!;
const usersView = app.querySelector<HTMLDivElement>("#users-view")!;
const backButton = app.querySelector<HTMLButtonElement>("#back-button")!;
const itemsTable = app.querySelector<HTMLDivElement>(".items-table")!;
const subtotalEl = app.querySelector<HTMLSpanElement>("#subtotal")!;
const totalEl = app.querySelector<HTMLSpanElement>("#total")!;
const statusEl = app.querySelector<HTMLDivElement>("#status")!;
const fechaEl = app.querySelector<HTMLDivElement>("#remision-fecha")!;
const clienteStatusEl = app.querySelector<HTMLSpanElement>("#cliente-status")!;
const guardarClienteBtn = app.querySelector<HTMLButtonElement>("#guardar-cliente")!;
const clienteNitInput = app.querySelector<HTMLInputElement>("#cliente-nit")!;
const clienteTipoSelect = app.querySelector<HTMLSelectElement>("#cliente-tipo")!;
const clienteNombreInput = app.querySelector<HTMLInputElement>("#cliente-nombre")!;
const clienteDireccionInput = app.querySelector<HTMLInputElement>("#cliente-direccion")!;
const clienteCiudadInput = app.querySelector<HTMLInputElement>("#cliente-ciudad")!;
const clienteTelefonoInput = app.querySelector<HTMLInputElement>("#cliente-telefono")!;
const remisionNumeroInput = app.querySelector<HTMLInputElement>("#remision-numero")!;
const remisionAnuladaWrap = app.querySelector<HTMLLabelElement>("#remision-anulada-wrap")!;
const remisionAnuladaInput = app.querySelector<HTMLInputElement>("#remision-anulada")!;
const currentUserEl = app.querySelector<HTMLSpanElement>("#current-user")!;
const userNameInput = app.querySelector<HTMLInputElement>("#user-name")!;
const userEmailInput = app.querySelector<HTMLInputElement>("#user-email")!;
const userRoleSelect = app.querySelector<HTMLSelectElement>("#user-role")!;
const userPasswordInput = app.querySelector<HTMLInputElement>("#user-password")!;
const userCreateBtn = app.querySelector<HTMLButtonElement>("#user-create")!;
const usersStatus = app.querySelector<HTMLSpanElement>("#users-status")!;
const usersList = app.querySelector<HTMLDivElement>("#users-list")!;
const loginModal = app.querySelector<HTMLDivElement>("#login-modal")!;
const loginEmail = app.querySelector<HTMLInputElement>("#login-email")!;
const loginPassword = app.querySelector<HTMLInputElement>("#login-password")!;
const loginEye = app.querySelector<HTMLButtonElement>("#login-eye")!;
const loginError = app.querySelector<HTMLDivElement>("#login-error")!;
const loginSubmit = app.querySelector<HTMLButtonElement>("#login-submit")!;
const loginCancel = app.querySelector<HTMLButtonElement>("#login-cancel")!;
const loginForgot = app.querySelector<HTMLButtonElement>("#login-forgot")!;
const loginRegister = app.querySelector<HTMLButtonElement>("#login-register")!;
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
const logoBase = `${window.location.protocol}//${window.location.hostname}:3001`;
logoImg.src = "/epsi-hl-logo.png";
logoImg.addEventListener("error", () => {
  if (logoImg.src.includes("/epsi-hl-logo.png")) {
    logoImg.src = `${logoBase}/assets/epsi-hl-logo.png`;
    return;
  }
  logoImg.style.display = "none";
});

const goHome = () => {
  homeView.classList.remove("hidden");
  remisionView.classList.add("hidden");
  usersView.classList.add("hidden");
  backButton.disabled = true;
};

const openLogin = (afterLogin?: () => void) => {
  loginEmail.value = "";
  loginPassword.value = "";
  loginError.classList.add("hidden");
  loginError.textContent = "";
  pendingAction = afterLogin || null;
  loginModal.classList.remove("hidden");
  loginModal.style.display = "flex";
};

const closeLogin = () => {
  loginModal.classList.add("hidden");
  loginModal.style.removeProperty("display");
};

const applyRole = (role: string | null) => {
  const isAdmin = role === "ADMIN";
  remisionNumeroInput.readOnly = !isAdmin;
  remisionAnuladaWrap.classList.toggle("hidden", !isAdmin);
  if (!isAdmin) {
    remisionAnuladaInput.checked = false;
  }
};

const refreshRole = async () => {
  const token = window.localStorage.getItem("epsiToken");
  if (!token) {
    applyRole(null);
    return;
  }
  try {
    const response = await fetch("http://localhost:3001/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      applyRole(null);
      return;
    }
    const data = await response.json();
    if (data?.role) {
      window.localStorage.setItem("epsiRole", data.role);
      applyRole(data.role);
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
    const response = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const message = await response.text();
      loginError.textContent = message || "Credenciales inválidas.";
      loginError.classList.remove("hidden");
      loginSubmit.disabled = false;
      return;
    }
    const data = await response.json();
    window.localStorage.setItem("epsiToken", data.token);
    window.localStorage.setItem("epsiUserEmail", data.email);
    if (data.role) {
      window.localStorage.setItem("epsiRole", data.role);
      applyRole(data.role);
    }
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

const getConsecutivo = () => {
  const raw = window.localStorage.getItem("epsiRemisionConsecutivo");
  const value = Number(raw || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const setConsecutivo = (value: number) => {
  window.localStorage.setItem("epsiRemisionConsecutivo", String(value));
};

const formatConsecutivo = (value: number) => `RM ${String(value).padStart(3, "0")}`;

const cargarConsecutivo = () => {
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
  tipoDocumento?: string;
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
};

const getClientes = (): Cliente[] => {
  const raw = window.localStorage.getItem("epsiClientes");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveClientes = (clientes: Cliente[]) => {
  window.localStorage.setItem("epsiClientes", JSON.stringify(clientes));
};

const buscarCliente = (nit: string) => {
  const clientes = getClientes();
  return clientes.find((c: Cliente) => c.nit === nit);
};

const llenarCliente = (cliente: Record<string, string>) => {
  clienteTipoSelect.value = cliente.tipoDocumento || "CC";
  clienteNombreInput.value = cliente.nombre || "";
  clienteDireccionInput.value = cliente.direccion || "";
  clienteCiudadInput.value = cliente.ciudad || "";
  clienteTelefonoInput.value = cliente.telefono || "";
};

const limpiarCliente = () => {
  clienteNombreInput.value = "";
  clienteDireccionInput.value = "";
  clienteCiudadInput.value = "";
  clienteTelefonoInput.value = "";
};

clienteNitInput.addEventListener("blur", () => {
  const nit = clienteNitInput.value.trim();
  if (!nit) return;
  const cliente = buscarCliente(nit);
  if (cliente) {
    llenarCliente(cliente);
    clienteStatusEl.textContent = "Cliente encontrado y cargado.";
  } else {
    limpiarCliente();
    clienteStatusEl.textContent = "Cliente no encontrado. Puedes guardarlo.";
  }
});

guardarClienteBtn.addEventListener("click", () => {
  const nit = clienteNitInput.value.trim();
  if (!nit) {
    clienteStatusEl.textContent = "Ingresa el NIT para guardar.";
    return;
  }
  const cliente = {
    nit,
    tipoDocumento: clienteTipoSelect.value,
    nombre: clienteNombreInput.value.trim(),
    direccion: clienteDireccionInput.value.trim(),
    ciudad: clienteCiudadInput.value.trim(),
    telefono: clienteTelefonoInput.value.trim(),
  };
  const clientes = getClientes();
  const existingIndex = clientes.findIndex((c: Record<string, string>) => c.nit === nit);
  if (existingIndex >= 0) {
    clientes[existingIndex] = cliente;
  } else {
    clientes.push(cliente);
  }
  saveClientes(clientes);
  clienteStatusEl.textContent = "Cliente guardado correctamente.";
});
const goRemisiones = () => {
  homeView.classList.add("hidden");
  remisionView.classList.remove("hidden");
  usersView.classList.add("hidden");
  backButton.disabled = false;
  cargarConsecutivo();
  applyRole(window.localStorage.getItem("epsiRole"));
};

const goUsers = () => {
  homeView.classList.add("hidden");
  remisionView.classList.add("hidden");
  usersView.classList.remove("hidden");
  backButton.disabled = false;
  loadUsers();
};

app.querySelectorAll("[data-go-remisiones]").forEach((button) => {
  button.addEventListener("click", () => {
    const token = window.localStorage.getItem("epsiToken");
    if (!token) {
      openLogin(goRemisiones);
      return;
    }
    goRemisiones();
  });
});

app.querySelectorAll("[data-go-usuarios]").forEach((button) => {
  button.addEventListener("click", () => {
    const token = window.localStorage.getItem("epsiToken");
    if (!token) {
      openLogin(goUsers);
      return;
    }
    goUsers();
  });
});

backButton.addEventListener("click", () => {
  window.localStorage.removeItem("epsiToken");
  window.localStorage.removeItem("epsiUserEmail");
  window.localStorage.removeItem("epsiRole");
  currentUserEl.textContent = "";
  currentUserEl.classList.add("hidden");
  goHome();
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
  const ivaPct = 19;
  const ivaCalc = totalInput * (ivaPct / 100);
  const subtotal = totalInput - ivaCalc;
  const total = totalInput;

  subtotalEl.textContent = formatCurrency(subtotal);
  totalEl.textContent = formatCurrency(total);
};

const addItemRow = () => {
  const row = document.createElement("div");
  row.className = "items-row";
  row.innerHTML = `
    <input class="item-cantidad" type="number" value="1" min="1" />
    <input class="item-descripcion" type="text" placeholder="Descripción" />
    <input class="item-unitario" type="number" value="0" min="0" />
    <input class="item-subtotal" type="number" value="0" min="0" readonly />
  `;
  itemsTable.appendChild(row);
  row.querySelectorAll("input").forEach((input) => input.addEventListener("input", recalc));
};

app.querySelector("#add-item")!.addEventListener("click", () => {
  addItemRow();
});

app.querySelectorAll("input, select").forEach((input) => {
  input.addEventListener("input", recalc);
});

app.querySelector("#generar")!.addEventListener("click", async () => {
  const token = window.localStorage.getItem("epsiToken");
  if (!token) {
    statusEl.textContent = "Debes iniciar sesión para generar remisiones.";
    openLogin();
    return;
  }
  statusEl.textContent = "Generando PDF...";

  const itemRows = Array.from(app.querySelectorAll<HTMLDivElement>(".items-row"));
  const items = itemRows.map((row) => ({
    cantidad: Number(row.querySelector<HTMLInputElement>(".item-cantidad")!.value || 0),
    descripcion: row.querySelector<HTMLInputElement>(".item-descripcion")!.value || "",
    valorUnitario: Number(row.querySelector<HTMLInputElement>(".item-unitario")!.value || 0),
    subtotal: Number(row.querySelector<HTMLInputElement>(".item-subtotal")!.value || 0),
  }));

  const total = Number(app.querySelector<HTMLInputElement>("#remision-total")!.value || 0);
  const ivaPorcentaje = 19;
  const iva = total * (ivaPorcentaje / 100);
  const subtotal = total - iva;

  const payload = {
    numero: (app.querySelector<HTMLInputElement>("#remision-numero")!.value || "0001").trim(),
    fecha: new Date().toISOString(),
    metodoPago: app.querySelector<HTMLSelectElement>("#remision-pago")!.value as RemisionPayload["metodoPago"],
    observaciones: app.querySelector<HTMLInputElement>("#remision-observaciones")!.value || "",
    anulada: remisionAnuladaInput.checked,
    cliente: {
      nombre: app.querySelector<HTMLInputElement>("#cliente-nombre")!.value || "",
      nit: app.querySelector<HTMLInputElement>("#cliente-nit")!.value || "",
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

  try {
    const pdf = await generarRemisionPdf(payload);
    const url = URL.createObjectURL(pdf);
    window.open(url, "_blank");
    statusEl.textContent = "PDF generado.";
    const siguiente = getConsecutivo() + 1;
    setConsecutivo(siguiente);
    cargarConsecutivo();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      statusEl.textContent = "Debes iniciar sesión para generar remisiones.";
      openLogin();
      return;
    }
    statusEl.textContent = "Error al generar PDF.";
  }
});

const loadUsers = async () => {
  const token = window.localStorage.getItem("epsiToken");
  if (!token) return;
  usersStatus.textContent = "Cargando usuarios...";
  try {
    const response = await fetch("http://localhost:3001/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
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
            <button class="secondary" data-reset-user="${user.id}">Reset</button>
            <button class="secondary" data-delete-user="${user.id}">Eliminar</button>
          </div>
        </div>
      `
    )
    .join("");
    usersStatus.textContent = "";

    usersList.querySelectorAll("[data-reset-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = (btn as HTMLButtonElement).dataset.resetUser;
        if (!id) return;
        const responseReset = await fetch(`http://localhost:3001/users/${id}/reset`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
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
        const responseDelete = await fetch(`http://localhost:3001/users/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
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
  const token = window.localStorage.getItem("epsiToken");
  if (!token) {
    usersStatus.textContent = "Debes iniciar sesión.";
    openLogin(goUsers);
    return;
  }
  const payload = {
    name: userNameInput.value.trim(),
    email: userEmailInput.value.trim(),
    role: userRoleSelect.value,
    password: userPasswordInput.value,
  };
  if (!payload.email || !payload.password) {
    usersStatus.textContent = "Email y contraseña son obligatorios.";
    return;
  }
  usersStatus.textContent = "Creando usuario...";
  try {
    const response = await fetch("http://localhost:3001/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const msg = await response.text();
      usersStatus.textContent = msg || "No se pudo crear el usuario.";
      return;
    }
    userNameInput.value = "";
    userEmailInput.value = "";
    userPasswordInput.value = "";
    usersStatus.textContent = "Usuario creado.";
    loadUsers();
  } catch {
    usersStatus.textContent = "Error creando usuario.";
  }
});

updateFechaHora();
setInterval(updateFechaHora, 60000);
cargarConsecutivo();
recalc();

const savedUser = window.localStorage.getItem("epsiUserEmail");
if (savedUser) {
  currentUserEl.textContent = `Usuario: ${savedUser}`;
  currentUserEl.classList.remove("hidden");
}
applyRole(window.localStorage.getItem("epsiRole"));
refreshRole();

loginSubmit.addEventListener("click", login);
loginCancel.addEventListener("click", closeLogin);
loginEye.addEventListener("click", () => {
  loginPassword.type = loginPassword.type === "password" ? "text" : "password";
});
loginForgot.addEventListener("click", () => {
  closeLogin();
  openReset();
});
loginRegister.addEventListener("click", () => {
  statusEl.textContent = "La creación de usuarios la gestiona el ADMIN.";
  closeLogin();
});

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
  const response = await fetch("http://localhost:3001/auth/request-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
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
  const response = await fetch("http://localhost:3001/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await response.json();
  resetStatus.textContent = data.message || "Proceso terminado.";
  resetStatus.classList.remove("hidden");
});
