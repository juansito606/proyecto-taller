// login.js - Inicio de sesión: fotos de fondo, tarjeta al centro y bienvenida con el pulso gigante
const formulario = document.getElementById("formLogin");
const boton = document.getElementById("btnIngresar");
const tarjeta = document.getElementById("tarjeta");
const campoContrasena = document.getElementById("contrasena");

// Si ya hay sesión abierta, ir directo al inicio
if (Sesion.token()) location.href = "index.html";

// ---------- Fotos y etiquetas que se mueven un poquito con el mouse ----------
const fotos = document.getElementById("fotos");
document.addEventListener("mousemove", (evento) => {
  const x = evento.clientX / innerWidth - .5;
  const y = evento.clientY / innerHeight - .5;
  fotos.style.transform = `scale(1.04) translate(${x * -16}px, ${y * -12}px)`;
  tarjeta.querySelectorAll(".lg-chip").forEach((chip, i) => {
    const fuerza = (i + 1) * 8;
    chip.style.translate = `${x * fuerza}px ${y * fuerza}px`;
  });
  // Borde de la tarjeta que brilla donde está el mouse
  const caja = tarjeta.getBoundingClientRect();
  tarjeta.style.setProperty("--mx", `${evento.clientX - caja.left}px`);
  tarjeta.style.setProperty("--my", `${evento.clientY - caja.top}px`);
});

// ---------- Mostrar u ocultar la contraseña ----------
document.getElementById("verContrasena").addEventListener("click", (evento) => {
  const oculta = campoContrasena.type === "password";
  campoContrasena.type = oculta ? "text" : "password";
  evento.currentTarget.innerHTML = `<i class="bi bi-eye${oculta ? "-slash" : ""}"></i>`;
});

// ---------- Aviso de MAYÚSCULAS activadas ----------
["keydown", "keyup"].forEach(tipo => campoContrasena.addEventListener(tipo, (evento) => {
  const activas = evento.getModifierState && evento.getModifierState("CapsLock");
  document.getElementById("avisoMayus").classList.toggle("d-none", !activas);
}));

// ---------- Frase que se escribe sola ----------
const frases = ["de la familia", "tuya", "una joya"];
let numeroFrase = 0;
let letras = frases[0].length;
let borrando = true;
function escribir() {
  const destino = document.getElementById("escribe");
  if (borrando) {
    letras--;
    if (letras <= 0) { borrando = false; numeroFrase = (numeroFrase + 1) % frases.length; }
  } else {
    letras++;
    if (letras >= frases[numeroFrase].length) {
      borrando = true;
      destino.textContent = frases[numeroFrase];
      return setTimeout(escribir, 2200);   // pausa con la frase completa
    }
  }
  destino.textContent = frases[numeroFrase].slice(0, letras);
  setTimeout(escribir, borrando ? 45 : 90);
}
setTimeout(escribir, 2500);

// ---------- La tarjeta tiembla cuando algo sale mal ----------
function temblar() {
  tarjeta.classList.remove("temblor");
  void tarjeta.offsetWidth;   // reinicia la animación
  tarjeta.classList.add("temblor");
}

// ---------- Bienvenida: el pulso se hace gigante y aparece "¡Hola, Juan! 👋" letra por letra ----------
const NOMBRE_ROL = { ADMINISTRADOR: "Administrador", VENDEDOR: "Vendedora", TRABAJADOR: "Mecánico" };
function bienvenida(usuario) {
  const nombre = usuario.nombre.split(" ")[0];
  const texto = `¡Hola, ${nombre}!`;
  const letrasHtml = [...texto].map((letra, i) =>
    `<span style="--i:${i}">${letra === " " ? "&nbsp;" : letra}</span>`).join("");
  document.getElementById("hola").innerHTML = letrasHtml + `<span class="mano" style="--i:${texto.length + 1}">&nbsp;👋</span>`;
  document.getElementById("rolBienvenida").textContent = `${NOMBRE_ROL[usuario.rol] || usuario.rol} · Bienvenido a El Hospital`;
  document.getElementById("bienvenida").classList.add("activa");
}

// ---------- Enviar el formulario ----------
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  // 1. Validación en el frontend (antes de molestar a la API)
  if (!formulario.checkValidity()) {
    formulario.classList.add("was-validated");
    temblar();
    return;
  }

  // 2. Botón en modo "cargando"
  boton.disabled = true;
  boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';

  try {
    // 3. Pedir el login a la API
    const respuesta = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        usuario: document.getElementById("usuario").value.trim().toLowerCase(),
        contrasena: campoContrasena.value,
      }),
    });

    // 4. Guardar la sesión, mostrar la bienvenida e ir al inicio
    Sesion.guardar(respuesta.token, respuesta.usuario);
    bienvenida(respuesta.usuario);
    setTimeout(() => location.href = "index.html", 3200);
  } catch (error) {
    mostrarMensaje("error", error.message);
    temblar();
    boton.disabled = false;
    boton.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Ingresar';
  }
});



