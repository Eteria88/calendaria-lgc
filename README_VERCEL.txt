
Calendaria · Build final (Mapa y códigos)

Despliegue en Vercel (recomendado):
1) Settings → Build & Output:
   - Framework Preset: Other (None)
   - Build Command: (vacío)
   - Output Directory: public
2) Redeploy.

Ruta del mapa:
- /public/mapa/index.html  (accesible como https://tu-dominio/mapa/)
- /public/mapa.html redirige automáticamente a /mapa/

Si tras el deploy no ves el nuevo ítem en el menú:
- Hard refresh (Cmd/Ctrl + Shift + R).
- Si usas PWA/Service Worker: DevTools → Application → Service Workers → Unregister + Update on reload.
- El nav también se inyecta por JS en runtime para asegurar que aparezca el enlace “Mapa y codigos”.
