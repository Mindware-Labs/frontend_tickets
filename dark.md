# Dark Mode

  El dark mode del frontend usa una paleta oscura neutra, sin tonos azulados o “galácticos”. La base visual está construida con grises
  `neutral` y fondos casi negros para mantener una interfaz sobria, legible y consistente en todo el sistema.

  ## Objetivo

  El objetivo del dark mode es reducir el brillo general de la interfaz sin perder claridad en textos, tablas, formularios, botones,
  badges, modales y paneles de navegación. Debe sentirse como un modo oscuro estándar de aplicación operativa, no como un tema decorativo.

  ## Paleta Principal

  - Fondo principal: negro neutro / gris muy oscuro.
  - Superficies y cards: gris neutro oscuro.
  - Bordes: gris neutro medio-bajo.
  - Texto principal: blanco suave.
  - Texto secundario: gris claro.
  - Acento principal: verde/teal de la marca.
  - Estados de alerta: rojo, amarillo, azul y verde conservan su semántica.

  ## Reglas Visuales

  - Evitar fondos azulados tipo `slate` para superficies principales en dark mode.
  - Usar `neutral-*` para fondos, bordes, textos secundarios y hover states.
  - Mantener el verde de marca solo como acento para acciones, estados activos, focus rings y elementos destacados.
  - El texto sobre fondos oscuros debe tener contraste suficiente.
  - Las iniciales dentro de avatares deben mostrarse en blanco en dark mode.
  - Las tablas, modales, sidebars y dropdowns deben usar superficies oscuras neutras, no negras puras si necesitan separación visual.

  ## Tokens Globales

  El dark mode se activa mediante la clase `.dark`.

  Los tokens globales principales son:

  - `--background`: fondo general oscuro neutro.
  - `--foreground`: texto principal claro.
  - `--card`: fondo de cards/paneles.
  - `--popover`: fondo de menús y popovers.
  - `--muted`: superficies secundarias.
  - `--border`: bordes visibles pero sutiles.
  - `--ring`: color de focus, basado en el verde de marca.

  ## Convenciones Tailwind

  Preferir:

  - `dark:bg-neutral-950`
  - `dark:bg-neutral-900`
  - `dark:border-neutral-800`
  - `dark:text-neutral-100`
  - `dark:text-neutral-300`
  - `dark:text-neutral-400`
  - `dark:hover:bg-neutral-800`

  Evitar para superficies principales:

  - `dark:bg-slate-950`
  - `dark:bg-slate-900`
  - `dark:border-slate-800`
  - `dark:text-slate-*`

  ## Resultado Esperado

  El resultado debe ser un dark mode normal, limpio y profesional: fondo oscuro neutro, buena legibilidad, componentes consistentes y sin
  dominante azul o efectos visuales decorativos.