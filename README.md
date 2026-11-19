# Códigos Sagrados · Biblioteca y rosario

Aplicación web estática **independiente** para buscar los Códigos Sagrados Numéricos atribuidos a Agesta, y contar manualmente 45 repeticiones con un rosario interactivo.

## Funcionalidades

- Búsqueda por **palabras clave**, sin distinguir mayúsculas ni tildes, y por **número**. Busca dentro del nombre, descripción y secuencia.
- Catálogo extraído del PDF proporcionado, con **referencia de página** y enlace al **PDF original** para comprobarlo.
- Preserva entradas con **varios códigos**, **secuencias de cuatro números** y explicaciones sin número asignado.
- **Rosario circular de 45 cuentas**: pulsa el botón después de cada repetición, pulsa directamente una cuenta, o usa la barra espaciadora (cuando no estés dentro de un campo o botón). No hay temporizador ni reproducción automática.
- Deshacer, reiniciar y **continuar una sesión** (el progreso se conserva en el almacenamiento local del navegador).
- Favoritos y filtros. No necesita registro ni servidor, ni envía información a terceros.
- Funciona en ordenador y móvil y se puede abrir el archivo `index.html` sin conexión.

## Datos de referencia

- Fuente: *Códigos Sagrados Numéricos*, canalizados por José Gabriel Uribe (Agesta) y compilados por Diana Cerón Otoya (PDF, 31/05/2018), 115 páginas.
- `data/codigos.json`: fichas estructuradas obtenidas de los bloques de texto de la obra.
- `data/paginas.json`: transcripción searchable por página; también conserva notas no estructuradas.
- `fuente.pdf`: copia del PDF proporcionado, para revisar atribuciones, secuencias y posibles errores de extracción.
- `data/auditoria.json`: estadísticas del proceso.
- `scripts/extraer_codigos.py`: script de extracción reproducible con PyMuPDF (puedes regenerar la base si tienes permiso para usar el documento).

**Nota editorial:** la extracción automatizada conserva el contenido textual y su página, pero las maquetaciones con dos columnas y las secuencias especiales pueden requerir revisión manual. Ante cualquier discrepancia, consulta el PDF original. Las cifras del catálogo son **entradas**, no necesariamente códigos únicos.

## Publicación gratuita en GitHub Pages

1. Crea un repositorio nuevo, por ejemplo `codigos-sagrados-agesta` (no se integra con ningún otro repositorio).
2. Sube **todo el contenido de esta carpeta a la raíz** del repositorio (el archivo `index.html` debe estar en la raíz).
3. En el repositorio abre **Settings → Pages**.
4. En **Build and deployment → Source**, selecciona **Deploy from a branch**; escoge la rama `main`, carpeta **/(root)**, y guarda.
5. La web aparecerá en `https://TU-USUARIO.github.io/codigos-sagrados-agesta/` después de que GitHub Pages publique el sitio.

No requiere `npm`, claves API, servicios externos ni cuotas de uso. Los favoritos y avances se guardan **en ese navegador concreto**. Si cambias de dispositivo o limpias los datos del navegador, se perderán. Si quieres sincronización, necesitarás una cuenta y almacenamiento adicional (no incluido).

## Créditos y precaución

Recopilación original: Diana Cerón Otoya. Códigos atribuidos a José Gabriel Uribe (Agesta). Esta aplicación no valida las afirmaciones espirituales o médicas del PDF, y no constituye consejo sanitario. Antes de publicar el PDF y sus textos en un repositorio público, comprueba que dispones de permiso para su redistribución.
