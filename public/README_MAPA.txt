
Calendaria — Fix mapa (sin bucles de redirección)

Qué hice:
- Creé/asegure la carpeta: /mapa/ con index.html
- Reemplacé mapa.html en la raíz por una redirección a ./mapa/
- Actualicé todos los enlaces del menú a ./mapa/ (carpeta)
- Ajusté rutas de assets dentro de /mapa/index.html (../assets/...)

Cómo subir a GitHub/Vercel:
- Sube TODO el contenido de esta carpeta (donde está index.html) como base del repo.
- En Vercel → Settings → Build & Output:
  - Framework Preset: Other (None)
  - Build Command: (vacío)
  - Output Directory: .    (el punto)  ← si tu index.html está en la raíz del repo
  - O bien Output Directory: public  ← si mueves todo a una carpeta /public

Abre luego: https://tu-dominio/mapa/  (debe cargar el mapamundi).
