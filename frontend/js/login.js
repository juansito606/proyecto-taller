// login.js - Inicio de sesión (con animaciones)
const formulario = document.getElementById("formLogin");
const boton = document.getElementById("btnIngresar");
const tarjeta = document.getElementById("tarjeta");
const campoContrasena = document.getElementById("contrasena");

// Si ya hay sesión abierta, ir directo al inicio
if (Sesion.token()) location.href = "index.html";

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
  if (!destino) return;
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

// ---------- Rodolfa en 3D: se inclina siguiendo el mouse ----------
const escena = document.getElementById("escena");
const foto = document.getElementById("foto");
escena.addEventListener("mousemove", (evento) => {
  const caja = escena.getBoundingClientRect();
  const x = (evento.clientX - caja.left) / caja.width - .5;
  const y = (evento.clientY - caja.top) / caja.height - .5;
  foto.style.transform = `perspective(900px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
  foto.style.setProperty("--bx", `${(x + .5) * 100}%`);
  foto.style.setProperty("--by", `${(y + .5) * 100}%`);
  escena.querySelectorAll(".lg-chip").forEach((chip, i) => {
    const fuerza = (i + 1) * 10;
    chip.style.translate = `${x * fuerza}px ${y * fuerza}px`;
  });
});
escena.addEventListener("mouseleave", () => {
  foto.style.transform = "";
  escena.querySelectorAll(".lg-chip").forEach(chip => chip.style.translate = "");
});

// ---------- Borde de la tarjeta que brilla donde está el mouse ----------
document.addEventListener("mousemove", (evento) => {
  const caja = tarjeta.getBoundingClientRect();
  tarjeta.style.setProperty("--mx", `${evento.clientX - caja.left}px`);
  tarjeta.style.setProperty("--my", `${evento.clientY - caja.top}px`);
});

// ---------- La tarjeta tiembla cuando algo sale mal ----------
function temblar() {
  tarjeta.classList.remove("temblor");
  void tarjeta.offsetWidth;   // reinicia la animación
  tarjeta.classList.add("temblor");
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
    document.getElementById("textoBienvenida").textContent = `¡Hola, ${respuesta.usuario.nombre.split(" ")[0]}!`;
    document.getElementById("bienvenida").classList.add("activa");
    setTimeout(() => location.href = "index.html", 1400);
  } catch (error) {
    mostrarMensaje("error", error.message);
    temblar();
    boton.disabled = false;
    boton.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Ingresar';
  }
});


