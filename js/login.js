/* ==========================================================================
   login.js  (pages/login.html)
   ========================================================================== */

const formLogin = document.querySelector('#form-login');
const campoEmail = document.querySelector('#login-email');
const campoPassword = document.querySelector('#login-password');

const reglasLogin = [
  [campoEmail, validarEmail],
  [campoPassword, validarPasswordLogin],
];

reglasLogin.forEach(([campo, validador]) => validarEnTiempoReal(campo, validador));

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!validarTodo(reglasLogin)) return;

  // Login simulado: si el correo es de un usuario de mockData usamos su nombre
  const email = campoEmail.value.trim().toLowerCase();
  const usuario = usuarios.find((u) => u.email === email);
  const nombre = usuario ? usuario.nombre : email.split('@')[0];

  const sesionAnterior = leerSesion();
  guardarSesion({ nombre, email, intereses: sesionAnterior ? sesionAnterior.intereses || [] : [] });

  await avisar(`¡Hola, ${nombre}!`, 'Has iniciado sesión correctamente.', 'exito', 'Ir al inicio');
  window.location.href = '../index.html';
});

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem('remarket-usuario'));
  } catch (error) {
    return null;
  }
}

/* ---------- ¿Olvidaste la contraseña? (modal con su propia validación) ---------- */
document.querySelector('#olvide-password').addEventListener('click', () => {
  const contenido = document.createElement('div');
  contenido.className = 'formulario';
  contenido.innerHTML = `
    <p>Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.</p>
    <div class="campo">
      <label class="campo__etiqueta" for="recuperar-email">Correo electrónico</label>
      <input class="input" type="email" id="recuperar-email" placeholder="tu@email.com" autocomplete="email">
      <p class="campo__error" id="error-recuperar-email" aria-live="polite"></p>
    </div>
  `;
  const campo = contenido.querySelector('#recuperar-email');
  campo.value = campoEmail.value;
  validarEnTiempoReal(campo, validarEmail);

  abrirModal({
    titulo: 'Recuperar contraseña',
    contenido,
    botones: [
      { texto: 'Cancelar', clase: 'boton--secundario', valor: false },
      {
        texto: 'Enviar enlace',
        clase: 'boton--primario',
        valor: true,
        alPulsar: () => validarTodo([[campo, validarEmail]]),
      },
    ],
  }).then((enviado) => {
    if (enviado) mostrarToast(`Te hemos enviado un correo a ${campo.value.trim()}`);
  });
});
