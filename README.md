# 📦 Page Loader

**Page Loader** es una utilidad de línea de comandos para descargar páginas web completas junto con sus recursos locales (imágenes, scripts, estilos).
El programa reescribe los enlaces en el HTML para que apunten a los archivos locales, lo que permite navegar la página sin conexión.

---

## 🚀 Instalación

Este paquete está diseñado para instalarse localmente como herramienta de desarrollo.

```bash
# Clonar el repositorio
git clone https://github.com/hexlet-code/page-loader.git
cd page-loader

# Instalar dependencias
npm install

# Hacer el link para usar el comando `page-loader`
npm link
```

---

## ⚡ Uso Básico

Descargar una página web y sus recursos al directorio actual:

```bash
page-loader https://codica.la/cursos
```

📂 Salida esperada:

```text
Página descargada exitosamente en: /home/user/current-dir/codica-la-cursos.html
```

---

### 📂 Descargar en un Directorio Específico

Usa la opción `-o` o `--output` para definir el directorio destino:

```bash
page-loader --output /var/tmp https://codica.la/cursos
```

📂 Salida esperada:

```text
Página descargada exitosamente en: /var/tmp/codica-la-cursos.html
```

---

## 🎬 Ejemplos de Funcionamiento

* **Ejemplo de Instalación y Uso Exitoso**
  [![asciicast: Ejemplo de uso exitoso](https://asciinema.org/a/sIcmx02YY3FGYeLGfmz0Ak2qr.svg)](https://asciinema.org/a/sIcmx02YY3FGYeLGfmz0Ak2qr)


* **Ejemplo con Manejo de Errores**
 [![asciicast: Ejemplo de manejo de errores HTTP/FS](https://asciinema.org/a/VVQopqjpT8Zc79axqov2OcqcB.svg)](https://asciinema.org/a/VVQopqjpT8Zc79axqov2OcqcB)


* **Ejemplo con Debugging Habilitado**
[![asciicast](https://asciinema.org/a/KgntfA30o6f9vp23e5jOoyWOQ.svg)](https://asciinema.org/a/KgntfA30o6f9vp23e5jOoyWOQ)
> ⚠️ Nota: Asegúrate de que el enlace usado sea el de **reproducción (/a/)** y no un enlace de conexión directa.

---

## 🛠️ Desarrollo

Comandos útiles para desarrollo local:

```bash
# Instalar dependencias
make install

# Ejecutar pruebas
make test

# Revisar formato y lint
make lint
```
### Hexlet tests and linter status:
[![Actions Status](https://github.com/Dsx-Dev/fullstack-javascript-project-138/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Dsx-Dev/fullstack-javascript-project-138/actions)

---

