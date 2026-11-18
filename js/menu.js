/* ==========================================================================
   menu.js
   Menú hamburguesa para móvil: se abre y se cierra con el botón,
   con la tecla Esc, al pulsar un enlace o al pasar a escritorio.
   ========================================================================== */

const botonMenu = document.querySelector('.boton-menu');
const menu = document.querySelector('#menu-principal');

function abrirCerrarMenu(abrir) {
  menu.classList.toggle('abierto', abrir);
  botonMenu.setAttribute('aria-expanded', abrir);
  botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  botonMenu.classList.toggle('boton-menu--abierto', abrir);
}

if (botonMenu && menu) {
  botonMenu.addEventListener('click', () => {
    const estaAbierto = menu.classList.contains('abierto');
    abrirCerrarMenu(!estaAbierto);
  });

  // Cerrar con Esc y devolver el foco al botón
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
      abrirCerrarMenu(false);
      botonMenu.focus();
    }
  });

  // Cerrar al pulsar cualquier enlace del menú
  menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', () => abrirCerrarMenu(false));
  });

  // Si se agranda la ventana a escritorio, el menú vuelve a su estado normal
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (consulta) => {
    if (consulta.matches) abrirCerrarMenu(false);
  });
}
