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
        <button class="nav-item" disabled>Usuarios</button>
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
        <button id="back-button" class="ghost" aria-label="Volver">← Volver</button>
      </header>

      <main class="content">
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
            <button class="secondary" disabled>Próximamente</button>
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
      </main>
    </div>
  </div>
`;

const formatCurrency = (value: number) => `$ ${value.toLocaleString("es-CO")}`;

const homeView = app.querySelector<HTMLDivElement>("#home-view")!;
const remisionView = app.querySelector<HTMLDivElement>("#remision-view")!;
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
  backButton.disabled = true;
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
  backButton.disabled = false;
  cargarConsecutivo();
};

app.querySelectorAll("[data-go-remisiones]").forEach((button) => {
  button.addEventListener("click", () => {
    goRemisiones();
  });
});

backButton.addEventListener("click", () => {
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

  const payload: RemisionPayload = {
    numero: (app.querySelector<HTMLInputElement>("#remision-numero")!.value || "0001").trim(),
    fecha: new Date().toISOString(),
    metodoPago: app.querySelector<HTMLSelectElement>("#remision-pago")!.value as RemisionPayload["metodoPago"],
    observaciones: app.querySelector<HTMLInputElement>("#remision-observaciones")!.value || "",
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
  };

  try {
    const pdf = await generarRemisionPdf(payload);
    const url = URL.createObjectURL(pdf);
    window.open(url, "_blank");
    statusEl.textContent = "PDF generado.";
    const siguiente = getConsecutivo() + 1;
    setConsecutivo(siguiente);
    cargarConsecutivo();
  } catch (error) {
    statusEl.textContent = "Error al generar PDF.";
  }
});

updateFechaHora();
setInterval(updateFechaHora, 60000);
cargarConsecutivo();
recalc();
