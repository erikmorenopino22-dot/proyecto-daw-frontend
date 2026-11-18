/* ==========================================================================
   validaciones.js
   Funciones para validar formularios en tiempo real y mostrar los errores
   en el DOM (los formularios tienen "novalidate", así que el navegador
   no enseña sus mensajes por defecto).

   Cada validador recibe el valor y devuelve:
     - ''          si está bien
     - 'mensaje'   con el error que hay que enseñar
   ========================================================================== */

/* ---------- Mostrar / quitar errores ---------- */

// El <p> del error de un campo tiene el id "error-" + id del campo
function buscarParrafoError(campo) {
  const id = campo.dataset.error || `error-${campo.id}`;
  return document.getElementById(id);
}

function mostrarError(campo, mensaje) {
  const parrafo = buscarParrafoError(campo);
  if (parrafo) parrafo.textContent = mensaje;

  campo.classList.toggle('input--error', mensaje !== '');
  campo.classList.toggle('input--correcto', mensaje === '' && campo.value !== '');
  campo.setAttribute('aria-invalid', mensaje !== '');
  if (parrafo) campo.setAttribute('aria-describedby', parrafo.id);
}

/**
 * Conecta un campo con su validador:
 *  - blur: al salir del campo se valida y se marca como "tocado"
 *  - input: si ya estaba tocado, se valida mientras se escribe
 *    (así no salen errores antes de que el usuario termine de escribir)
 */
function validarEnTiempoReal(campo, validador) {
  campo.addEventListener('blur', () => {
    campo.dataset.tocado = 'true';
    mostrarError(campo, validador(campo.value));
  });

  campo.addEventListener('input', () => {
    if (campo.dataset.tocado) mostrarError(campo, validador(campo.value));
  });
}

/**
 * Valida todos los campos de golpe (al enviar el formulario).
 * @param {Array} reglas  [[campo, validador], ...]
 * @returns {boolean} true si no hay ningún error
 */
function validarTodo(reglas) {
  let primerError = null;

  reglas.forEach(([campo, validador]) => {
    campo.dataset.tocado = 'true';
    const mensaje = validador(campo.value);
    mostrarError(campo, mensaje);
    if (mensaje && !primerError) primerError = campo;
  });

  // Se lleva el foco al primer campo con error
  if (primerError) primerError.focus();
  return primerError === null;
}

/* ---------- Validadores ---------- */

function validarEmail(valor) {
  const email = valor.trim();
  if (email === '') return 'Escribe tu correo electrónico.';
  const formato = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  if (!formato.test(email)) return 'El correo no es válido. Ejemplo: nombre@correo.com';
  return '';
}

function validarNombre(valor) {
  const nombre = valor.trim();
  if (nombre === '') return 'Escribe tu nombre.';
  if (!/^[a-záéíóúüñ' -]+$/i.test(nombre)) return 'El nombre solo puede tener letras y espacios.';
  if (nombre.length < 3) return 'El nombre es demasiado corto.';
  if (nombre.split(/\s+/).length < 2) return 'Escribe tu nombre y al menos un apellido.';
  return '';
}

function validarPasswordLogin(valor) {
  if (valor === '') return 'Escribe tu contraseña.';
  if (valor.length < 8) return 'La contraseña tiene al menos 8 caracteres.';
  return '';
}

// Requisitos de una contraseña segura (se usan también para la lista con ✓)
const requisitosPassword = {
  longitud: (valor) => valor.length >= 8,
  mayuscula: (valor) => /[A-ZÁÉÍÓÚÑ]/.test(valor),
  numero: (valor) => /\d/.test(valor),
};

function validarPasswordNueva(valor) {
  if (valor === '') return 'Escribe una contraseña.';
  if (!requisitosPassword.longitud(valor)) return 'La contraseña necesita al menos 8 caracteres.';
  if (!requisitosPassword.mayuscula(valor)) return 'Añade al menos una letra mayúscula.';
  if (!requisitosPassword.numero(valor)) return 'Añade al menos un número.';
  return '';
}

function validarFechaNacimiento(valor) {
  if (valor === '') return 'Indica tu fecha de nacimiento.';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'La fecha no es válida.';

  const hoy = new Date();
  if (fecha > hoy) return 'La fecha no puede ser del futuro.';

  // Calcular la edad teniendo en cuenta si ya ha cumplido este año
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const yaCumplio = hoy.getMonth() > fecha.getMonth()
    || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() >= fecha.getDate());
  if (!yaCumplio) edad--;

  if (edad > 110) return 'Revisa el año de nacimiento.';
  if (edad < 18) return 'Tienes que ser mayor de 18 años para registrarte.';
  return '';
}

function validarPrecio(valor, maximo = 10000) {
  if (valor === '') return 'Pon un precio.';
  const precio = Number(valor);
  if (Number.isNaN(precio)) return 'El precio tiene que ser un número.';
  if (precio <= 0) return 'El precio tiene que ser mayor que 0 €.';
  if (precio > maximo) return `El precio máximo es ${maximo.toLocaleString('es-ES')} €.`;
  if (!/^\d+([.,]\d{1,2})?$/.test(valor)) return 'Usa como mucho 2 decimales.';
  return '';
}

// Para campos de texto con mínimo y máximo de caracteres
function validarLongitud(minimo, maximo, nombreCampo) {
  return (valor) => {
    const texto = valor.trim();
    if (texto === '' && minimo > 0) return `Escribe ${nombreCampo}.`;
    if (texto.length < minimo) return `Escribe al menos ${minimo} caracteres (llevas ${texto.length}).`;
    if (texto.length > maximo) return `Como máximo ${maximo} caracteres.`;
    return '';
  };
}

/* ---------- Mostrar / ocultar contraseña (botón "Ver") ---------- */
document.querySelectorAll('.input-grupo__boton').forEach((boton) => {
  const campo = boton.parentElement.querySelector('input');
  if (!campo || campo.type !== 'password') return;

  boton.addEventListener('click', () => {
    const verla = campo.type === 'password';
    campo.type = verla ? 'text' : 'password';
    boton.textContent = verla ? 'Ocultar' : 'Ver';
    boton.setAttribute('aria-label', verla ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
});

/* ---------- Botones de Google / Apple (todavía sin backend) ---------- */
document.querySelectorAll('.boton-social').forEach((boton) => {
  boton.addEventListener('click', () => {
    avisar(
      `Entrar con ${boton.textContent.trim()}`,
      'Esta opción estará disponible cuando la web se conecte con el servidor. De momento usa tu correo.',
      'aviso'
    );
  });
});

/* ---------- Guardar la "sesión" (simulada) ---------- */
function guardarSesion(usuario) {
  try {
    localStorage.setItem('remarket-usuario', JSON.stringify(usuario));
  } catch (error) {
    // Si el navegador no deja guardar, la web sigue funcionando igual
  }
}
