/* ==========================================================================
   detalle.js  (pages/detalle.html)
   Pinta la ficha del producto que llega en la URL (detalle.html?id=7)
   y gestiona los modales de oferta, compra y preguntar al vendedor.
   ========================================================================== */

const parametrosDetalle = new URLSearchParams(window.location.search);
const idProducto = Number(parametrosDetalle.get('id') || 7);
const producto = buscarProducto(idProducto);

const $ = (selector) => document.querySelector(selector);

if (!producto) {
  pintarNoEncontrado();
} else {
  pintarProducto();
  pintarSimilares();
  activarAcciones();
}

/* ---------- Producto que no existe ---------- */
function pintarNoEncontrado() {
  document.title = 'Artículo no encontrado · ReMarket';
  $('#migas-producto').textContent = 'No encontrado';
  $('#migas-categoria').parentElement.remove();
  $('.similares').remove();

  const aviso = document.createElement('section');
  aviso.className = 'sin-resultados';
  aviso.innerHTML = `
    <h1 class="sin-resultados__titulo">Este artículo ya no está disponible</h1>
    <p>Puede que se haya vendido o que el enlace no sea correcto.</p>
    <a class="boton boton--primario" href="../index.html">Ver otros artículos</a>
  `;
  $('#detalle-producto').replaceWith(aviso);
}

/* ---------- Ficha del producto ---------- */
function pintarProducto() {
  const categoria = obtenerCategoria(producto.id_categoria);
  const vendedor = obtenerVendedor(producto.id_usuario);

  document.title = `${producto.titulo} · ReMarket`;

  // Migas de pan
  $('#migas-categoria').textContent = categoria.nombre;
  $('#migas-categoria').href = `../index.html?categoria=${encodeURIComponent(categoria.nombre)}`;
  $('#migas-producto').textContent = producto.titulo;

  // Textos principales
  $('#titulo-producto').textContent = producto.titulo;
  $('#producto-meta').textContent = `${producto.marca} · ${producto.talla} · ${producto.ubicacion}`;
  $('#producto-precio').textContent = formatearPrecio(producto.precio);

  const precioOriginal = $('#producto-precio-original');
  if (producto.precio_original) {
    precioOriginal.innerHTML = `<del>${formatearPrecio(producto.precio_original)}</del>`;
  } else {
    precioOriginal.remove();
  }

  // Etiquetas: primero el estado y luego los #tags
  const etiquetas = $('#producto-etiquetas');
  etiquetas.innerHTML = '';
  const estado = document.createElement('li');
  estado.className = 'etiqueta etiqueta--estado';
  estado.textContent = producto.estado;
  etiquetas.append(estado);
  producto.etiquetas.forEach((texto) => {
    const item = document.createElement('li');
    item.className = 'etiqueta';
    item.textContent = `#${texto}`;
    etiquetas.append(item);
  });

  $('#producto-fecha').textContent = `Publicado ${haceCuanto(producto.fecha_publicacion)}`;
  $('#producto-descripcion').textContent = producto.descripcion;

  // Ficha técnica
  $('#ficha-categoria').textContent = categoria.nombre;
  $('#ficha-marca').textContent = producto.marca;
  $('#ficha-talla').textContent = producto.talla;
  $('#ficha-estado').textContent = producto.estado;

  pintarGaleria();
  pintarBotonFavorito();
  pintarVendedor(vendedor);
}

function pintarGaleria() {
  const principal = $('#foto-principal');
  const miniaturas = $('#miniaturas');
  const fotos = producto.imagenes.length ? producto.imagenes : [null];

  function verFoto(indice) {
    principal.src = urlImagen(fotos[indice], 900, 900) || '../assets/img/sin-foto.svg';
    principal.alt = `${producto.titulo} (foto ${indice + 1} de ${fotos.length})`;
    miniaturas.querySelectorAll('button').forEach((boton, i) => {
      boton.setAttribute('aria-current', i === indice);
    });
  }

  miniaturas.innerHTML = '';
  if (fotos.length > 1) {
    fotos.forEach((foto, indice) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'galeria__miniatura';
      boton.setAttribute('aria-label', `Ver foto ${indice + 1}`);
      boton.innerHTML = `<img src="${urlImagen(foto, 160, 160)}" alt="" width="160" height="160">`;
      boton.addEventListener('click', () => verFoto(indice));
      miniaturas.append(boton);
    });
  }
  verFoto(0);
}

function pintarBotonFavorito() {
  const boton = $('#boton-favorito');
  const actualizar = () => {
    const activo = esFavorito(producto.id_producto);
    boton.setAttribute('aria-pressed', activo);
    boton.querySelector('svg').setAttribute('fill', activo ? 'currentColor' : 'none');
    $('#producto-likes').textContent = contarLikes(producto);
  };

  boton.addEventListener('click', () => {
    const ahora = cambiarFavorito(producto.id_producto);
    actualizar();
    mostrarToast(ahora ? 'Añadido a favoritos' : 'Quitado de favoritos');
  });
  actualizar();
}

function pintarVendedor(vendedor) {
  const iniciales = vendedor.nombre.split(' ').map((parte) => parte[0]).join('').slice(0, 2).toUpperCase();
  const avatar = $('#vendedor-avatar');
  avatar.textContent = iniciales;
  avatar.style.backgroundColor = vendedor.color;

  $('#vendedor-nombre').textContent = vendedor.nombre;
  $('#vendedor-verificado').hidden = !vendedor.verificado;

  const { media, total } = obtenerValoracion(vendedor.id);
  if (total === 0) {
    $('#vendedor-media').textContent = 'Nuevo';
    $('#vendedor-valoraciones').textContent = '· sin valoraciones todavía';
  } else {
    $('#vendedor-media').textContent = media.toFixed(1).replace('.', ',');
    $('#vendedor-valoraciones').textContent = `· ${total} ${total === 1 ? 'valoración' : 'valoraciones'}`;
  }
}

/* ---------- Artículos parecidos (misma categoría primero) ---------- */
function pintarSimilares() {
  const otros = obtenerProductos().filter((p) => p.id_producto !== producto.id_producto);
  const mismaCategoria = otros.filter((p) => p.id_categoria === producto.id_categoria);
  const resto = otros.filter((p) => p.id_categoria !== producto.id_categoria);
  const sugeridos = [...mismaCategoria, ...resto].slice(0, 4);

  const contenedor = $('#lista-similares');
  sugeridos.forEach((p) => contenedor.append(crearTarjeta(p, 'detalle.html')));
  activarFavoritos(contenedor);
}

/* ---------- Botones: oferta, comprar y preguntar ---------- */
function activarAcciones() {
  const vendedor = obtenerVendedor(producto.id_usuario);

  // Si el artículo es del propio usuario no puede comprarlo
  if (producto.id_usuario === 0) {
    $('.producto__acciones').innerHTML = '<p class="producto__propio">Este artículo lo has publicado tú.</p>';
    $('#boton-preguntar').hidden = true;
    return;
  }

  $('#boton-oferta').addEventListener('click', () => abrirOferta(vendedor));
  $('#boton-comprar').addEventListener('click', abrirCompra);
  $('#boton-preguntar').addEventListener('click', () => abrirPregunta(vendedor));
}

function abrirOferta(vendedor) {
  const minimo = Math.ceil(producto.precio * 0.5);

  const contenido = document.createElement('div');
  contenido.className = 'formulario';
  contenido.innerHTML = `
    <p>Precio actual: <strong>${formatearPrecio(producto.precio)}</strong>. Si ${vendedor.nombre} acepta tu oferta, podrás comprarlo a ese precio.</p>
    <div class="campo">
      <label class="campo__etiqueta" for="oferta-cantidad">Tu oferta</label>
      <div class="input-grupo">
        <span class="input-grupo__prefijo" aria-hidden="true">€</span>
        <input class="input" type="number" id="oferta-cantidad" min="1" step="0.01" inputmode="decimal" placeholder="${Math.floor(producto.precio * 0.9)}">
      </div>
      <p class="campo__error" id="error-oferta-cantidad" aria-live="polite"></p>
    </div>
    <div class="sugerencias" aria-label="Ofertas rápidas"></div>
  `;

  const campo = contenido.querySelector('#oferta-cantidad');

  // Botones de oferta rápida: -5 %, -10 %, -15 %
  const sugerencias = contenido.querySelector('.sugerencias');
  [5, 10, 15].forEach((descuento) => {
    const cantidad = Math.floor(producto.precio * (1 - descuento / 100));
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'chip';
    boton.textContent = `${cantidad} € (-${descuento} %)`;
    boton.addEventListener('click', () => {
      campo.value = cantidad;
      campo.dataset.tocado = 'true';
      mostrarError(campo, validarOferta(campo.value));
    });
    sugerencias.append(boton);
  });

  function validarOferta(valor) {
    const error = validarPrecio(valor);
    if (error) return error.replace('Pon un precio.', 'Escribe cuánto ofreces.');
    if (Number(valor) >= producto.precio) return `La oferta tiene que ser menor que ${formatearPrecio(producto.precio)}.`;
    if (Number(valor) < minimo) return `Es una oferta muy baja. El mínimo es ${formatearPrecio(minimo)} (la mitad del precio).`;
    return '';
  }
  validarEnTiempoReal(campo, validarOferta);

  abrirModal({
    titulo: 'Hacer una oferta',
    contenido,
    botones: [
      { texto: 'Cancelar', clase: 'boton--secundario', valor: false },
      { texto: 'Enviar oferta', clase: 'boton--primario', valor: true, alPulsar: () => validarTodo([[campo, validarOferta]]) },
    ],
  }).then((enviada) => {
    if (enviada) {
      avisar('¡Oferta enviada!', `Le hemos enviado tu oferta de ${formatearPrecio(Number(campo.value))} a ${vendedor.nombre}. Te avisaremos cuando conteste.`);
    }
  });
}

function abrirCompra() {
  const proteccion = producto.precio * COMISION;
  const total = producto.precio + GASTOS_ENVIO + proteccion;
  const euros = (cantidad) => formatoEuros.format(cantidad);

  const contenido = document.createElement('div');
  contenido.className = 'formulario';
  contenido.innerHTML = `
    <div class="campo">
      <label class="campo__etiqueta" for="compra-direccion">Dirección de envío</label>
      <input class="input" type="text" id="compra-direccion" placeholder="Calle, número y piso" autocomplete="street-address">
      <p class="campo__error" id="error-compra-direccion" aria-live="polite"></p>
    </div>
    <div class="dos-columnas">
      <div class="campo">
        <label class="campo__etiqueta" for="compra-cp">Código postal</label>
        <input class="input" type="text" id="compra-cp" inputmode="numeric" maxlength="5" placeholder="28001" autocomplete="postal-code">
        <p class="campo__error" id="error-compra-cp" aria-live="polite"></p>
      </div>
      <div class="campo">
        <label class="campo__etiqueta" for="compra-pago">Método de pago</label>
        <select class="input" id="compra-pago">
          <option>Tarjeta</option>
          <option>PayPal</option>
          <option>Bizum</option>
        </select>
      </div>
    </div>
    <dl class="resumen">
      <dt>Artículo</dt><dd>${euros(producto.precio)}</dd>
      <dt>Envío</dt><dd>${euros(GASTOS_ENVIO)}</dd>
      <dt>Protección al comprador (5 %)</dt><dd>${euros(proteccion)}</dd>
      <dt class="resumen__total">Total</dt><dd class="resumen__total">${euros(total)}</dd>
    </dl>
  `;

  const direccion = contenido.querySelector('#compra-direccion');
  const codigoPostal = contenido.querySelector('#compra-cp');
  const validarDireccion = validarLongitud(8, 120, 'la dirección');
  // Código postal español: 5 números y empieza por 01-52
  const validarCodigoPostal = (valor) => {
    if (valor.trim() === '') return 'Escribe el código postal.';
    if (!/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(valor.trim())) return 'El código postal tiene que ser de 5 números (por ejemplo 28001).';
    return '';
  };
  validarEnTiempoReal(direccion, validarDireccion);
  validarEnTiempoReal(codigoPostal, validarCodigoPostal);

  abrirModal({
    titulo: 'Finalizar compra',
    contenido,
    botones: [
      { texto: 'Cancelar', clase: 'boton--secundario', valor: false },
      {
        texto: `Pagar ${euros(total)}`,
        clase: 'boton--primario',
        valor: true,
        alPulsar: () => validarTodo([[direccion, validarDireccion], [codigoPostal, validarCodigoPostal]]),
      },
    ],
  }).then((pagado) => {
    if (pagado) {
      avisar('¡Compra realizada!', `El vendedor preparará tu pedido y te llegará a ${direccion.value.trim()} (${codigoPostal.value.trim()}). Recibirás un correo con el seguimiento.`);
    }
  });
}

function abrirPregunta(vendedor) {
  const contenido = document.createElement('div');
  contenido.className = 'formulario';
  contenido.innerHTML = `
    <div class="campo">
      <label class="campo__etiqueta" for="pregunta-texto">Mensaje para ${vendedor.nombre}</label>
      <textarea class="input" id="pregunta-texto" rows="4" maxlength="300" placeholder="Hola, ¿sigue disponible?"></textarea>
      <p class="campo__error" id="error-pregunta-texto" aria-live="polite"></p>
    </div>
  `;
  const campo = contenido.querySelector('#pregunta-texto');
  const validarMensaje = validarLongitud(5, 300, 'tu mensaje');
  validarEnTiempoReal(campo, validarMensaje);

  abrirModal({
    titulo: 'Preguntar al vendedor',
    contenido,
    botones: [
      { texto: 'Cancelar', clase: 'boton--secundario', valor: false },
      { texto: 'Enviar', clase: 'boton--primario', valor: true, alPulsar: () => validarTodo([[campo, validarMensaje]]) },
    ],
  }).then((enviado) => {
    if (enviado) mostrarToast(`Mensaje enviado a ${vendedor.nombre}`);
  });
}
