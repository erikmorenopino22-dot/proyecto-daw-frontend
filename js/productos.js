/* ==========================================================================
   productos.js
   Funciones comunes para trabajar con los datos de mockData.js:
   buscar vendedor y categoría, favoritos, productos publicados por el usuario
   y crear la tarjeta de un producto a partir de la plantilla <template>.
   ========================================================================== */

/* ---------- localStorage (con try/catch por si el navegador lo bloquea) ---------- */
function leerGuardado(clave, valorPorDefecto) {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? JSON.parse(texto) : valorPorDefecto;
  } catch (error) {
    return valorPorDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    return false;
  }
}

/* ---------- Productos ---------- */

// Productos de mockData.js + los que haya publicado el usuario desde crear.html
function obtenerProductos() {
  const publicados = leerGuardado('remarket-publicados', []);
  return [...publicados, ...productos];
}

function buscarProducto(id) {
  return obtenerProductos().find((producto) => producto.id_producto === id);
}

function obtenerCategoria(idCategoria) {
  return categorias.find((categoria) => categoria.id_categoria === idCategoria);
}

// Vendedor de un producto. El id 0 es el usuario que está usando la web.
function obtenerVendedor(idUsuario) {
  if (idUsuario === 0) {
    const sesion = leerGuardado('remarket-usuario', null);
    return { id: 0, nombre: sesion ? sesion.nombre : 'Tú', verificado: false, color: '#ff5433' };
  }
  return usuarios.find((usuario) => usuario.id === idUsuario);
}

// La media de valoraciones no se guarda en la BD (3FN): se calcula aquí
function obtenerValoracion(idUsuario) {
  const suyas = valoraciones.filter((v) => v.usuario_valorado === idUsuario);
  if (suyas.length === 0) return { media: 0, total: 0 };
  const suma = suyas.reduce((total, v) => total + v.puntuacion, 0);
  return { media: suma / suyas.length, total: suyas.length };
}

/* ---------- Favoritos ---------- */
function obtenerFavoritos() {
  return leerGuardado('remarket-favoritos', []);
}

function esFavorito(id) {
  return obtenerFavoritos().includes(id);
}

// Añade o quita un favorito y devuelve si ahora lo es
function cambiarFavorito(id) {
  let favoritos = obtenerFavoritos();
  const loEra = favoritos.includes(id);
  favoritos = loEra ? favoritos.filter((fav) => fav !== id) : [...favoritos, id];
  guardar('remarket-favoritos', favoritos);
  return !loEra;
}

// Los "me gusta" suben en 1 si el usuario lo tiene en favoritos
function contarLikes(producto) {
  return producto.likes + (esFavorito(producto.id_producto) ? 1 : 0);
}

/* ---------- Formatos ---------- */
const formatoEuros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function formatearPrecio(precio) {
  // Sin decimales si el precio es redondo (45 €), con decimales si no (22,50 €)
  return Number.isInteger(precio)
    ? `${precio.toLocaleString('es-ES')} €`
    : formatoEuros.format(precio);
}

// Las fotos de mockData son de Unsplash; las del usuario se guardan en base64
function urlImagen(imagen, ancho = 400, alto = 530) {
  if (!imagen) return null;
  if (imagen.startsWith('data:')) return imagen;
  return `https://images.unsplash.com/${imagen}?w=${ancho}&h=${alto}&fit=crop&auto=format`;
}

// "hace 2 días", "hoy", "ayer"...
function haceCuanto(fechaTexto) {
  const dias = Math.floor((Date.now() - new Date(fechaTexto).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 14) return 'hace 1 semana';
  if (dias < 31) return `hace ${Math.floor(dias / 7)} semanas`;
  return 'hace más de un mes';
}

// Quita tildes y pasa a minúsculas para que "electronica" encuentre "Electrónica"
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/* ---------- Tarjeta ---------- */

/**
 * Crea la tarjeta de un producto clonando el <template id="plantilla-tarjeta">.
 * @param {Object} producto  Producto de mockData
 * @param {string} rutaDetalle  Ruta a detalle.html desde la página actual
 */
function crearTarjeta(producto, rutaDetalle) {
  const plantilla = document.querySelector('#plantilla-tarjeta');
  const tarjeta = plantilla.content.firstElementChild.cloneNode(true);
  const enlace = `${rutaDetalle}?id=${producto.id_producto}`;

  const imagen = tarjeta.querySelector('.tarjeta__imagen');
  const foto = urlImagen(producto.imagenes[0]);
  if (foto) imagen.src = foto;
  imagen.alt = producto.titulo;

  // Etiqueta verde solo si está como nuevo
  const etiqueta = tarjeta.querySelector('.tarjeta__etiqueta');
  if (producto.estado === 'Como nuevo' || producto.estado === 'Nuevo con etiqueta') {
    etiqueta.textContent = `✓ ${producto.estado}`;
    etiqueta.hidden = false;
  }

  const titulo = tarjeta.querySelector('.tarjeta__titulo a');
  titulo.textContent = producto.titulo;
  titulo.href = enlace;

  tarjeta.querySelector('.tarjeta__info').textContent = `${producto.marca} · ${producto.talla}`;
  tarjeta.querySelector('.tarjeta__precio').textContent = formatearPrecio(producto.precio);
  tarjeta.querySelector('.tarjeta__num-likes').textContent = contarLikes(producto);

  const botonFavorito = tarjeta.querySelector('.tarjeta__favorito');
  botonFavorito.dataset.id = producto.id_producto;
  pintarFavorito(botonFavorito, esFavorito(producto.id_producto));

  // Toda la tarjeta es clicable, no solo el título
  tarjeta.addEventListener('click', (evento) => {
    if (!evento.target.closest('button, a')) window.location.href = enlace;
  });

  return tarjeta;
}

function pintarFavorito(boton, activo) {
  boton.setAttribute('aria-pressed', activo);
  boton.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
  boton.querySelector('svg').setAttribute('fill', activo ? 'currentColor' : 'none');
}

/**
 * Activa los corazones de un contenedor de tarjetas (delegación de eventos:
 * un solo listener para todas las tarjetas, aunque se vuelvan a pintar).
 */
function activarFavoritos(contenedor) {
  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.tarjeta__favorito');
    if (!boton) return;

    const id = Number(boton.dataset.id);
    const ahoraEsFavorito = cambiarFavorito(id);
    pintarFavorito(boton, ahoraEsFavorito);

    const producto = buscarProducto(id);
    boton.closest('.tarjeta').querySelector('.tarjeta__num-likes').textContent = contarLikes(producto);
    mostrarToast(ahoraEsFavorito ? 'Añadido a favoritos' : 'Quitado de favoritos');
  });
}
