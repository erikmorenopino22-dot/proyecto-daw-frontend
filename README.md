# ReMarket – Frontend

Web de compraventa de segunda mano hecha con **HTML5, CSS3 y JavaScript nativo** (Proyecto Interdisciplinar 2).
Está basada en el prototipo de Figma y en la base de datos del Proyecto 1.

- Prototipo de Figma: https://www.figma.com/make/JakRPG8EfBgMaZ4Ru07P3J/ReMarket-hito2

## Estructura

```
proyecto-daw-frontend/
├── index.html          → Inicio / dashboard con el grid de artículos
├── pages/
│   ├── login.html      → Iniciar sesión
│   ├── registro.html   → Crear cuenta
│   ├── crear.html      → Publicar un artículo
│   └── detalle.html    → Ficha de un producto
├── css/
│   ├── variables.css   → Colores, fuentes y espaciados (:root)
│   ├── base.css        → Reset y estilos generales
│   ├── layout.css      → Cabecera, menú y pie
│   ├── components.css  → Botones, tarjetas, formularios, chips...
│   └── pages.css       → Estilos de cada página
├── js/
│   ├── mockData.js     → Datos simulados de la BD (usuarios, categorías, productos, valoraciones)
│   ├── productos.js    → Funciones comunes y creación de tarjetas con <template>
│   ├── modal.js        → Modales (<dialog>) y avisos (toast)
│   ├── menu.js         → Menú hamburguesa en móvil
│   ├── validaciones.js → Validadores y mensajes de error en el DOM
│   ├── dashboard.js    → Inicio: tarjetas, buscador, categorías, pestañas y orden
│   ├── login.js        → Validación del login y recuperar contraseña
│   ├── registro.js     → Validación del registro y requisitos de la contraseña
│   ├── crear.js        → Publicar: validación, fotos, comisión y guardado
│   └── detalle.js      → Ficha por ?id=, oferta, compra y preguntar
└── assets/
    ├── icons/          → Favicon
    └── img/            → Imagen para artículos sin foto
```

## Diseño responsive (mobile first)

| Dispositivo | Ancho      | Columnas del grid |
|-------------|------------|-------------------|
| Móvil       | < 768px    | 2                 |
| Tablet      | ≥ 768px    | 3                 |
| Escritorio  | ≥ 1024px   | 4                 |

## Cómo verlo

Abrir `index.html` con la extensión **Live Server** de Visual Studio Code.
