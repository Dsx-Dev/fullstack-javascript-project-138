
📦 Utilidad de carga de páginas (@hexlet/code)
Una utilidad de línea de comandos para descargar páginas web y sus recursos locales (imágenes, scripts, estilos) en un directorio específico. El programa modifica los enlaces de los recursos en el HTML descargado para que apunten a los archivos locales.

🚀 Instalación y Uso
Este paquete está diseñado para ser instalado localmente como una herramienta de desarrollo y ser ejecutado desde la raíz del proyecto.

Instalación Local
Para usar el comando page-loader directamente desde el directorio raíz del proyecto (donde se encuentra package.json), usa npm link:

Bash

npm link
Uso Básico
Descarga una página web y sus recursos al directorio de trabajo actual.

Bash

page-loader https://codica.la/cursos
Página descargada exitosamente en: /home/user/current-dir/codica-la-cursos.html
Descarga a un Directorio Específico
Usa la opción -o o --output para especificar el directorio de destino.

Bash

page-loader --output /var/tmp https://codica.la/cursos
Página descargada exitosamente en: /var/tmp/codica-la-cursos.html
---
## 🎬 Ejemplos de Funcionamiento (Asciinema)

### 1. Ejemplo de Instalación y Uso Exitoso
Esta grabación muestra el proceso de enlazar el paquete con `npm link` y ejecutar una descarga exitosa del sitio, guardando el HTML y sus recursos.

[![asciicast: Ejemplo de uso exitoso](https://asciinema.org/a/sIcmx02YY3FGYeLGfmz0Ak2qr.svg)](https://asciinema.org/a/sIcmx02YY3FGYeLGfmz0Ak2qr)

---

### 2. Ejemplo con Manejo de Errores
Esta grabación demuestra cómo el programa maneja los errores, como un fallo de conexión o un código de estado HTTP no exitoso (ej. 404 Not Found).

[![asciicast: Ejemplo de manejo de errores HTTP/FS](https://asciinema.org/a/VVQopqjpT8Zc79axqov2OcqcB.svg)](https://asciinema.org/a/VVQopqjpT8Zc79axqov2OcqcB)

---

### 3. Ejemplo con Debugging Habilitado
Esta grabación muestra el log de depuración detallado cuando se utiliza la variable de entorno `DEBUG=page-loader`.

*Nota: Tu enlace para el debug parece ser un enlace de conexión directa y no un enlace de reproducción (`/a/`). He asumido que necesitas el código de incrustación. Si el enlace de arriba falla, verifica si el enlace de reproducción es diferente.*

[![asciicast: Ejemplo con DEBUG=page-loader](https://asciinema.org/connect/26de17d3-eeb1-477a-9c2f-96780b133696.svg)](https://asciinema.org/connect/26de17d3-eeb1-477a-9c2f-96780b133696)

⚙️ Desarrollo
(Aquí puedes añadir comandos como make install, make test, y la estructura de directorios si es relevante para otros desarrolladores).