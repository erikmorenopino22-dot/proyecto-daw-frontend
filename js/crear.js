/* ==========================================================================
   crear.js  (pages/crear.html)
   Validación del formulario de publicar, vista previa de las fotos,
   cálculo de lo que cobra el vendedor y guardado del artículo.
   ========================================================================== */

const formPublicar = document.querySelector('#form-publicar');
const campoTitulo = document.querySelector('#titulo');
const campoDescripcion = document.querySelector('#descripcion');
const campoPrecio = document.querySelector('#precio');
const avisoComision = document.querySelector('#aviso-comision');
const entradasFoto = formPublicar.querySelectorAll('.fotos__hueco input[type="file"]');
const radiosCategoria = formPublicar.querySelectorAll('[name="categoria"]');
const radiosEstado = formPublicar.querySelectorAll('[name="estado"]');

const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB
const fotosCargadas = []; // fotos en base64 para la vista previa

/* ---------- Validadores propios de este formulario ---------- */
const validarTitulo = validarLongitud(5, 60, 'un título');

function validarDescripcion(valor) {
  return valor.length > 500 ? 'La descripción puede tener como máximo 500 caracteres.' : '';
}

function validarFotos() {
  return fotosCargadas.some(Boolean) ? '' : 'Sube al menos una foto del artículo.';
}

// Para los grupos de radio se comprueba si hay alguno marcado
function validarGrupo(radios, mensaje) {
  return () => ([...radios].some((radio) => radio.checked) ? '' : mensaje);
}
const validarCategoria = validarGrupo(radiosCategoria, 'Elige una categoría.');
const validarEstado = validarGrupo(radiosEstado, 'Elige el estado del artículo.');

// Cada grupo enseña su error en un párrafo que no sigue la regla "error-" + id
entradasFoto[0].dataset.error = 'error-fotos';
radiosCategoria[0].dataset.error = 'error-categoria';
radiosEstado[0].dataset.error = 'error-estado';

const reglasPublicar = [
  [entradasFoto[0], validarFotos],
  [campoTitulo, validarTitulo],
  [campoDescripcion, validarDescripcion],
  [radiosCategoria[0], validarCategoria],
  [radiosEstado[0], validarEstado],
  [campoPrecio, (valor) => validarPrecio(valor)],
];

validarEnTiempoReal(campoTitulo, validarTitulo);
validarEnTiempoReal(campoDescripcion, validarDescripcion);
validarEnTiempoReal(campoPrecio, (valor) => validarPrecio(valor));

radiosCategoria.forEach((radio) => radio.addEventListener('change', () => mostrarError(radiosCategoria[0], validarCategoria())));
radiosEstado.forEach((radio) => radio.addEventListener('change', () => mostrarError(radiosEstado[0], validarEstado())));

/* ---------- Contadores de caracteres ---------- */
function activarContador(campo, idContador, maximo) {
  const contadorTexto = document.getElementById(idContador);
  campo.addEventListener('input', () => {
    contadorTexto.textContent = `${campo.value.length}/${maximo} caracteres`;
    contadorTexto.classList.toggle('campo__ayuda--limite', campo.value.length > maximo * 0.9);
  });
}
activarContador(campoTitulo, 'contador-titulo', 60);
activarContador(campoDescripcion, 'contador-descripcion', 500);

/* ---------- Lo que recibe el vendedor (precio - 5 %) ---------- */
campoPrecio.addEventListener('input', () => {
  const precio = Number(campoPrecio.value);
  if (campoPrecio.value !== '' && precio > 0 && validarPrecio(campoPrecio.value) === '') {
    const recibe = precio * (1 - COMISION);
    avisoComision.textContent = `Recibirás ${recibe.toFixed(2).replace('.', ',')} € (precio menos el 5 % de comisión).`;
  } else {
    avisoComision.textContent = 'Recibirás el precio menos un 5 % de comisión.';
  }
});

/* ---------- Fotos: comprobar el archivo y enseñar la vista previa ---------- */
entradasFoto.forEach((entrada, indice) => {
  entrada.addEventListener('change', () => {
    const archivo = entrada.files[0];
    const hueco = entrada.closest('.fotos__hueco');
    if (!archivo) return;

    let error = '';
    if (!archivo.type.startsWith('image/')) error = `"${archivo.name}" no es una imagen.`;
    else if (archivo.size > TAMANO_MAXIMO_FOTO) error = `"${archivo.name}" pesa más de 5 MB.`;

    if (error) {
      entrada.value = '';
      mostrarError(entradasFoto[0], error);
      return;
    }

    const lector = new FileReader();
    lector.addEventListener('load', () => {
      fotosCargadas[indice] = lector.result;

      let vistaPrevia = hueco.querySelector('.fotos__vista-previa');
      if (!vistaPrevia) {
        vistaPrevia = document.createElement('img');
        vistaPrevia.className = 'fotos__vista-previa';
        hueco.prepend(vistaPrevia);
      }
      vistaPrevia.src = lector.result;
      vistaPrevia.alt = `Foto ${indice + 1}: ${archivo.name}`;
      hueco.classList.add('fotos__hueco--con-foto');

      mostrarError(entradasFoto[0], validarFotos());
    });
    lector.readAsDataURL(archivo);
  });
});

// Reduce la foto principal con un <canvas> para que quepa en localStorage
function reducirFoto(base64) {
  return new Promise((resolve) => {
    const imagen = new Image();
    imagen.addEventListener('load', () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 400;
      lienzo.height = 530;
      const contexto = lienzo.getContext('2d');
      // Recortar al centro con la proporción de las tarjetas (3:4)
      const escala = Math.max(400 / imagen.width, 530 / imagen.height);
      const ancho = imagen.width * escala;
      const alto = imagen.height * escala;
      contexto.drawImage(imagen, (400 - ancho) / 2, (530 - alto) / 2, ancho, alto);
      resolve(lienzo.toDataURL('image/jpeg', 0.7));
    });
    imagen.addEventListener('error', () => resolve(null));
    imagen.src = base64;
  });
}

/* ---------- Publicar ---------- */
formPublicar.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!validarTodo(reglasPublicar)) {
    mostrarToast('Revisa los campos marcados en rojo');
    return;
  }

  const datos = new FormData(formPublicar);
  const precio = Number(datos.get('precio'));
  const titulo = datos.get('titulo').trim();
  const recibe = (precio * (1 - COMISION)).toFixed(2).replace('.', ',');

  const quierePublicar = await confirmar(
    '¿Publicar el artículo?',
    `Vas a publicar "${titulo}" por ${precio.toLocaleString('es-ES')} €. Cuando se venda recibirás ${recibe} €.`,
    'Publicar'
  );
  if (!quierePublicar) return;

  const radioCategoria = formPublicar.querySelector('[name="categoria"]:checked');
  const categoria = categorias.find((c) => c.nombre.toLowerCase() === radioCategoria.value);
  const estado = formPublicar.querySelector('[name="estado"]:checked').closest('.estado').querySelector('.estado__nombre').textContent;
  const marca = datos.get('marca').trim();
  const fotoPrincipal = await reducirFoto(fotosCargadas.find(Boolean));

  // Mismo formato que la tabla Producto de mockData.js
  const nuevo = {
    id_producto: Date.now(),
    titulo,
    precio,
    precio_original: null,
    estado,
    marca: marca || 'Sin marca',
    talla: datos.get('talla').trim() || 'Única',
    ubicacion: datos.get('ubicacion').trim() || 'España',
    descripcion: datos.get('descripcion').trim() || 'El vendedor no ha añadido descripción.',
    etiquetas: [marca, categoria ? categoria.nombre : ''].filter(Boolean).map((t) => t.toLowerCase()),
    imagenes: fotoPrincipal ? [fotoPrincipal] : [],
    fecha_publicacion: new Date().toISOString().split('T')[0],
    likes: 0,
    id_usuario: 0, // 0 = el usuario que usa la web
    id_categoria: categoria ? categoria.id_categoria : 8,
  };

  const publicados = leerGuardado('remarket-publicados', []);
  // Si la foto no cabe en localStorage se guarda el artículo sin foto
  if (!guardar('remarket-publicados', [nuevo, ...publicados])) {
    nuevo.imagenes = [];
    guardar('remarket-publicados', [nuevo, ...publicados]);
  }

  await avisar('¡Artículo publicado!', 'Ya aparece en la página de inicio para que lo vean los compradores.', 'exito', 'Ver mi artículo');
  window.location.href = `detalle.html?id=${nuevo.id_producto}`;
});

/* ---------- Cancelar: avisar si hay datos sin guardar ---------- */
function hayDatosEscritos() {
  const textos = formPublicar.querySelectorAll('input[type="text"], input[type="number"], textarea');
  const algunTexto = [...textos].some((campo) => campo.value.trim() !== '');
  const algunRadio = formPublicar.querySelector('input[type="radio"]:checked') !== null;
  return algunTexto || algunRadio || fotosCargadas.some(Boolean);
}

document.querySelector('#cancelar-publicar').addEventListener('click', async (evento) => {
  if (!hayDatosEscritos()) return; // sin datos, el enlace funciona normal
  evento.preventDefault();
  const salir = await confirmar('¿Salir sin publicar?', 'Se perderá lo que has escrito en el formulario.', 'Salir');
  if (salir) window.location.href = '../index.html';
});
