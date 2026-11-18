/* ==========================================================================
   modal.js
   Ventanas modales (con la etiqueta <dialog>) y avisos rápidos (toast).
   Se usa en todas las páginas.
   ========================================================================== */

/**
 * Abre una ventana modal y devuelve una promesa con el botón pulsado.
 * @param {Object} opciones
 * @param {string} opciones.titulo   Título del modal
 * @param {string|Node} opciones.contenido  Texto o elemento HTML del cuerpo
 * @param {Array} opciones.botones   [{ texto, clase, valor, alPulsar }]
 *        Si alPulsar() devuelve false, el modal no se cierra (sirve para validar).
 * @param {string} opciones.icono    'exito' | 'aviso' (opcional)
 * @returns {Promise} valor del botón pulsado, o null si se cierra con la X / Esc
 */
function abrirModal({ titulo, contenido, botones = [], icono = '' }) {
  return new Promise((resolve) => {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'modal';
    dialogo.setAttribute('aria-labelledby', 'modal-titulo');

    dialogo.innerHTML = `
      <div class="modal__cabecera">
        <h2 class="modal__titulo" id="modal-titulo"></h2>
        <button class="modal__cerrar" type="button" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal__cuerpo"></div>
      <div class="modal__acciones"></div>
    `;

    // Título con textContent para no meter HTML por error
    dialogo.querySelector('.modal__titulo').textContent = titulo;

    // Icono de éxito o aviso encima del título
    if (icono) {
      const circulo = document.createElement('span');
      circulo.className = `modal__icono modal__icono--${icono}`;
      circulo.setAttribute('aria-hidden', 'true');
      circulo.textContent = icono === 'exito' ? '✓' : '!';
      dialogo.querySelector('.modal__cabecera').prepend(circulo);
      dialogo.classList.add('modal--centrado');
    }

    // Cuerpo: puede ser un texto o un elemento ya creado
    const cuerpo = dialogo.querySelector('.modal__cuerpo');
    if (typeof contenido === 'string') {
      const parrafo = document.createElement('p');
      parrafo.textContent = contenido;
      cuerpo.append(parrafo);
    } else if (contenido) {
      cuerpo.append(contenido);
    }

    // Cierra el modal, lo borra del DOM y devuelve el valor
    function cerrar(valor) {
      dialogo.close();
      dialogo.remove();
      resolve(valor);
    }

    // Botones de abajo
    const acciones = dialogo.querySelector('.modal__acciones');
    botones.forEach((boton) => {
      const elemento = document.createElement('button');
      elemento.type = 'button';
      elemento.className = `boton ${boton.clase || 'boton--secundario'}`;
      elemento.textContent = boton.texto;
      elemento.addEventListener('click', () => {
        if (boton.alPulsar && boton.alPulsar() === false) return;
        cerrar(boton.valor);
      });
      acciones.append(elemento);
    });

    // Formas de cerrar: la X, la tecla Esc y hacer clic fuera del modal
    dialogo.querySelector('.modal__cerrar').addEventListener('click', () => cerrar(null));
    dialogo.addEventListener('cancel', (evento) => {
      evento.preventDefault();
      cerrar(null);
    });
    dialogo.addEventListener('click', (evento) => {
      if (evento.target === dialogo) cerrar(null);
    });

    document.body.append(dialogo);
    dialogo.showModal();

    // El foco va al primer campo del modal, o al último botón (el principal)
    const primerCampo = cuerpo.querySelector('input, textarea, select');
    const botonPrincipal = acciones.lastElementChild;
    (primerCampo || botonPrincipal || dialogo).focus();
  });
}

/** Modal de confirmación con Cancelar / Aceptar. Devuelve true o false. */
async function confirmar(titulo, mensaje, textoAceptar = 'Aceptar') {
  const respuesta = await abrirModal({
    titulo,
    contenido: mensaje,
    botones: [
      { texto: 'Cancelar', clase: 'boton--secundario', valor: false },
      { texto: textoAceptar, clase: 'boton--primario', valor: true },
    ],
  });
  return respuesta === true;
}

/** Modal de aviso con un solo botón. */
function avisar(titulo, mensaje, icono = 'exito', textoBoton = 'Entendido') {
  return abrirModal({
    titulo,
    contenido: mensaje,
    icono,
    botones: [{ texto: textoBoton, clase: 'boton--primario', valor: true }],
  });
}

/** Aviso pequeño que aparece abajo unos segundos y se va solo. */
function mostrarToast(mensaje) {
  let zona = document.querySelector('.toasts');
  if (!zona) {
    zona = document.createElement('div');
    zona.className = 'toasts';
    zona.setAttribute('role', 'status');
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }

  const toast = document.createElement('p');
  toast.className = 'toast';
  toast.textContent = mensaje;
  zona.append(toast);

  setTimeout(() => toast.classList.add('toast--saliendo'), 2600);
  setTimeout(() => toast.remove(), 3000);
}
