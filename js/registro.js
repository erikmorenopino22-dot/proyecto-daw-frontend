/* ==========================================================================
   registro.js  (pages/registro.html)
   ========================================================================== */

const formRegistro = document.querySelector('#form-registro');
const campoNombre = document.querySelector('#reg-nombre');
const campoEmailRegistro = document.querySelector('#reg-email');
const campoFecha = document.querySelector('#reg-fecha');
const campoPasswordNueva = document.querySelector('#reg-password');
const campoPassword2 = document.querySelector('#reg-password2');
const casillaTerminos = document.querySelector('[name="terminos"]');
const listaRequisitos = document.querySelector('#requisitos-password');

// La fecha máxima del calendario es hoy (no se puede nacer en el futuro)
campoFecha.max = new Date().toISOString().split('T')[0];

// El correo no puede estar ya registrado (se comprueba con los usuarios de mockData)
function validarEmailNuevo(valor) {
  const error = validarEmail(valor);
  if (error) return error;
  const repetido = usuarios.some((u) => u.email === valor.trim().toLowerCase());
  return repetido ? 'Ya hay una cuenta con este correo. ¿Quieres iniciar sesión?' : '';
}

function validarRepetirPassword(valor) {
  if (valor === '') return 'Repite la contraseña.';
  if (valor !== campoPasswordNueva.value) return 'Las contraseñas no coinciden.';
  return '';
}

// Para la casilla de términos se valida "checked", no el valor
function validarTerminos() {
  return casillaTerminos.checked ? '' : 'Tienes que aceptar los términos para crear la cuenta.';
}
casillaTerminos.dataset.error = 'error-reg-terminos';

const reglasRegistro = [
  [campoNombre, validarNombre],
  [campoEmailRegistro, validarEmailNuevo],
  [campoFecha, validarFechaNacimiento],
  [campoPasswordNueva, validarPasswordNueva],
  [campoPassword2, validarRepetirPassword],
  [casillaTerminos, validarTerminos],
];

reglasRegistro.slice(0, 5).forEach(([campo, validador]) => validarEnTiempoReal(campo, validador));
casillaTerminos.addEventListener('change', () => mostrarError(casillaTerminos, validarTerminos()));

/* ---------- Lista de requisitos de la contraseña (se van marcando con ✓) ---------- */
campoPasswordNueva.addEventListener('input', () => {
  const valor = campoPasswordNueva.value;

  listaRequisitos.querySelectorAll('li').forEach((item) => {
    const cumple = requisitosPassword[item.dataset.requisito](valor);
    item.classList.toggle('cumplido', cumple);
  });

  // Si ya se había escrito la repetición, se vuelve a comprobar
  if (campoPassword2.dataset.tocado) {
    mostrarError(campoPassword2, validarRepetirPassword(campoPassword2.value));
  }
});

/* ---------- Enviar ---------- */
formRegistro.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!validarTodo(reglasRegistro)) return;

  // Intereses marcados, sin tildes (para compararlos con las categorías)
  const intereses = [...formRegistro.querySelectorAll('[name="intereses"]:checked')]
    .map((casilla) => casilla.value.normalize('NFD').replace(/[̀-ͯ]/g, ''));

  const nombre = campoNombre.value.trim();
  guardarSesion({ nombre, email: campoEmailRegistro.value.trim().toLowerCase(), intereses });

  const textoIntereses = intereses.length
    ? 'En "Para ti" verás primero artículos de lo que te interesa.'
    : 'Ya puedes comprar y vender en ReMarket.';

  await avisar(`¡Bienvenido/a, ${nombre.split(' ')[0]}!`, `Tu cuenta se ha creado. ${textoIntereses}`, 'exito', 'Empezar');
  window.location.href = '../index.html';
});
