
# Calendaria · Mapa y Códigos (v3)

Esta carpeta agrega la nueva página **`mapa.html`** con un **mapamundi interactivo** para Calendaria.

## Qué incluye
- `mapa.html`: página nueva con el mapa.
- `assets/css/mapa.css`: estilos oscuros, responsivo (móvil listo).
- `assets/js/mapa.js`: lógica del mapa (Leaflet + TopoJSON world-atlas) y un panel para **guardar códigos por país** (persisten en `localStorage`).

## Cómo instalar
1. Copia **`mapa.html`** y la carpeta **`assets/`** a la raíz de tu proyecto (donde está tu `index.html`).
2. Abre tu `index.html` (y cualquier otra página con el menú) y en el **menú de navegación** agrega el nuevo ítem:
   ```html
   <a href="mapa.html">Mapa y Códigos</a>
   ```
   Si ya usas una clase `active`, en `mapa.html` ya está marcada en ese item.

3. Sube los cambios a tu hosting (GitHub Pages / Vercel).

## Cómo usar
- Pasa el mouse por países para resaltarlos y ver el nombre. Haz **click** para seleccionarlo.
- En el panel izquierdo:
  - **Buscar país** (filtra por nombre o ISO3).
  - **País seleccionado**: agrega **códigos** (separados por coma) y **notas**. Presiona **Guardar**.
  - **Códigos guardados**: lista de países con acciones de **Ir** (zoom) o **Borrar**.
- Los datos se guardan en el navegador (`localStorage`) y se pueden exportar/leer desde allí en el futuro.

## Extensiones posibles
- Cargar límites de países a mayor resolución (`world-atlas@2` 50m).
- Completar el mapeo **id → ISO3** y **id → nombre** para el 100% de países.
- Conectar el panel a tus **métricas Calendaria** (por ej., días solares, cardinalidades, aparatos, etc.).
- Añadir un botón **Exportar CSV** de los códigos guardados.

---

Hecho con 💙 por Ughr.
