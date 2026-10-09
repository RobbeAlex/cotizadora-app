# Cotizadora App

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20SQLite%20%7C%20Vite-blue)
![License](https://img.shields.io/badge/License-MIT-green)

Aplicación web Full-Stack diseñada para la gestión y generación de cotizaciones. Construida con un frontend moderno en React y un backend robusto con Node.js (Express) y Drizzle ORM.

## 🚀 Tecnologías Principales

*   **Frontend:** React, Vite, Tailwind CSS, Radix UI, Framer Motion.
*   **Backend:** Node.js, Express.js.
*   **Base de Datos:** SQLite (con Drizzle ORM).
*   **Validación de Datos:** Zod.

## 📁 Arquitectura del Proyecto

El proyecto está dividido en tres capas principales:
*   `client/` - Código del frontend (React).
*   `server/` - Lógica del backend y configuración de la API (Express).
*   `shared/` - Esquemas de la base de datos (Zod/Drizzle) y tipos compartidos entre cliente y servidor.

## 🛠️ Instalación y Configuración Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/TU_USUARIO/cotizadora.git
    cd cotizadora
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar la base de datos:**
    Asegúrate de ejecutar las migraciones para generar la estructura en SQLite (`data.db`).
    ```bash
    npm run db:push
    ```

4.  **Iniciar el entorno de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible localmente para pruebas.

## 📦 Scripts Disponibles

*   `npm run dev` - Inicia el servidor de desarrollo en caliente (frontend + backend).
*   `npm run build` - Compila la aplicación para producción.
*   `npm start` - Inicia la aplicación en modo producción.
*   `npm run check` - Ejecuta la verificación de tipos de TypeScript.
