/* ==========================================================================
   dashboard.js  (index.html)
   Pinta las tarjetas de mockData.js y las filtra en tiempo real:
   buscador, categorías, pestañas "Para ti / Siguiendo" y orden.
   ========================================================================== */

const lista = document.querySelector('#lista-articulos');
const contador = document.querySelector('#contador-articulos');
const sinResultados = document.querySelector('#sin-resultados');
const buscador = document.querySelector('#busqueda');
const filtroCategorias = document.querySelector('#filtro-categorias');
const selectorOrden = document.querySelector('#orden');
const pestanas = document.querySelectorAll('.pestana');

// Estado de los filtros: cada vez que cambia algo se vuelve a pintar
const filtros = {
  texto: '',
  categoria: 'Todo',
  pestana: 'para-ti',
  orden: 'recientes',
};

/* ---------- Pintar los botones de categoría desde mockData ---------- */
function pintarCategorias() {
  const nombres = ['Todo', ...categorias.map((categoria) => categoria.nombre)];
  filtroCategorias.innerHTML = '';

  nombres.forEach((nombre) => {
    const item = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'chip';
    boton.textContent = nombre;
    boton.dataset.categoria = nombre;
    item.append(boton);
    filtroCategorias.append(item);
  });
  marcarCategoria();
}

function marcarCategoria() {
  filtroCategorias.querySelectorAll('.chip').forEach((chip) => {
    const activa = chip.dataset.categoria === filtros.categoria;
    chip.classList.toggle('chip--activo', activa);
    chip.setAttribute('aria-pressed', activa);
  });
}

/* ---------- Filtrar y ordenar ---------- */
function filtrarProductos() {
  const texto = normalizar(filtros.texto);
  const sesion = leerGuardado('remarket-usuario', null);
  const intereses = sesion && sesion.intereses ? sesion.intereses : [];

  let resultado = obtenerProductos().filter((producto) => {
    const categoria = obtenerCategoria(producto.id_categoria);
    const vendedor = obtenerVendedor(producto.id_usuario);

    // 1. Buscador: título, marca, categoría o etiquetas
    const textoProducto = normalizar(
      [producto.titulo, producto.marca, categoria.nombre, ...producto.etiquetas].join(' ')
    );
    const coincideTexto = texto === '' || textoProducto.includes(texto);

    // 2. Categoría
    const coincideCategoria = filtros.categoria === 'Todo' || categoria.nombre === filtros.categoria;

    // 3. "Siguiendo" = solo vendedores verificados
    const coincidePestana = filtros.pestana === 'para-ti' || vendedor.verificado;

    return coincideTexto && coincideCategoria && coincidePestana;
  });

  // Ordenar (copia del array para no tocar los datos originales)
  resultado = [...resultado].sort((a, b) => {
    if (filtros.orden === 'precio-asc') return a.precio - b.precio;
    if (filtros.orden === 'precio-desc') return b.precio - a.precio;
    if (filtros.orden === 'likes') return contarLikes(b) - contarLikes(a);
    return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
  });

  // "Para ti": primero los de las categorías que el usuario eligió al registrarse
  if (filtros.pestana === 'para-ti' && intereses.length > 0 && filtros.orden === 'recientes') {
    const leInteresa = (p) => intereses.includes(normalizar(obtenerCategoria(p.id_categoria).nombre));
    resultado.sort((a, b) => Number(leInteresa(b)) - Number(leInteresa(a)));
  }

  return resultado;
}

/* ---------- Pintar las tarjetas ---------- */
function pintarProductos() {
  const resultado = filtrarProductos();

  lista.innerHTML = '';
  // DocumentFragment: se meten todas las tarjetas de golpe en el DOM
  const fragmento = document.createDocumentFragment();
  resultado.forEach((producto) => fragmento.append(crearTarjeta(producto, 'pages/detalle.html')));
  lista.append(fragmento);

  contador.textContent = resultado.length === 1 ? '1 artículo' : `${resultado.length} artículos`;
  sinResultados.hidden = resultado.length > 0;
}

/* ---------- Eventos ---------- */

// Buscador en tiempo real (evento input = cada vez que se escribe)
buscador.addEventListener('input', () => {
  filtros.texto = buscador.value;
  pintarProductos();
});

// Que Enter no recargue la página
buscador.form.addEventListener('submit', (evento) => evento.preventDefault());

filtroCategorias.addEventListener('click', (evento) => {
  const chip = evento.target.closest('.chip');
  if (!chip) return;
  filtros.categoria = chip.dataset.categoria;
  marcarCategoria();
  pintarProductos();
});

pestanas.forEach((pestana) => {
  pestana.addEventListener('click', () => {
    filtros.pestana = pestana.dataset.pestana;
    pestanas.forEach((p) => p.setAttribute('aria-pressed', p === pestana));
    pintarProductos();
  });
});

selectorOrden.addEventListener('change', () => {
  filtros.orden = selectorOrden.value;
  pintarProductos();
});

document.querySelector('#limpiar-filtros').addEventListener('click', () => {
  filtros.texto = '';
  filtros.categoria = 'Todo';
  buscador.value = '';
  marcarCategoria();
  pintarProductos();
  buscador.focus();
});

activarFavoritos(lista);

/* ---------- Arranque ---------- */

// Se puede llegar con filtros en la URL, p. ej. index.html?categoria=Ropa (desde las migas de pan)
const parametros = new URLSearchParams(window.location.search);
if (parametros.has('categoria') && categorias.some((c) => c.nombre === parametros.get('categoria'))) {
  filtros.categoria = parametros.get('categoria');
}
if (parametros.has('q')) {
  filtros.texto = parametros.get('q');
  buscador.value = filtros.texto;
}

pintarCategorias();
pintarProductos();
