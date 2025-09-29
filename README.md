### Hexlet tests and linter status:
[![Actions Status](https://github.com/Dsx-Dev/fullstack-javascript-project-138/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Dsx-Dev/fullstack-javascript-project-138/actions)

# 📦 Page Loader Utility (`@hexlet/code`)

Una utilidad de línea de comandos para descargar páginas web y sus recursos locales (imágenes, scripts, estilos) en un directorio específico.

## 🚀 Instalación

Este paquete está diseñado para ser instalado localmente como una herramienta de desarrollo.

```bash
# Para usar el comando page-loader desde el directorio raíz del proyecto:
npm link
🛠️ Uso
Descarga Básica
Descarga una página web y sus recursos al directorio de trabajo actual.

Bash

page-loader [https://codica.la/cursos](https://codica.la/cursos)
Página descargada exitosamente en: /home/user/current-dir/codica-la-cursos.html
Descarga a un Directorio Específico
Usa la opción -o o --output para especificar el directorio de destino.

Bash

page-loader --output /var/tmp [https://codica.la/cursos](https://codica.la/cursos)
Página descargada exitosamente en: /var/tmp/codica-la-cursos.html
🎬 Ejemplos de Funcionamiento (Asciinema)
(Aquí debes incrustar las animaciones de Asciinema que muestren el uso exitoso, el manejo de errores y el registro de logs, como se requiere en las tareas).

Ejemplo de Uso Exitoso
[Asciinema: Ejemplo de uso exitoso]

Ejemplo con Manejo de Errores
[Asciinema: Ejemplo de manejo de errores HTTP/FS]

Ejemplo con Debugging Habilitado
[Asciinema: Ejemplo con DEBUG=page-loader]