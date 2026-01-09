# Quiniela App

Una aplicación web para gestionar y participar en quinielas deportivas.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS 4
- **Iconos**: Lucide React
- **Routing**: React Router DOM 7

### Backend
- **Framework**: NestJS
- **Lenguaje**: TypeScript
- **Base de Datos / Auth**: Firebase (Firebase Admin SDK)
- **HTTP Client**: Axios

## 📂 Estructura del Proyecto

El proyecto está organizado en dos carpetas principales:

- `frontend/`: Contiene la aplicación cliente en React.
- `backend/`: Contiene la API y lógica del servidor en NestJS.

## 🚀 Comenzando

Sigue estas instrucciones para configurar el proyecto localmente.

### Pre-requisitos
- Node.js (v18 o superior)
- npm

### Configuración del Backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Asegúrate de tener el archivo de credenciales de Firebase (por ejemplo, `serviceAccountKey.json`) en la ubicación correcta (`src/config/`).

4. Inicia el servidor de desarrollo:
   ```bash
   npm run start:dev
   ```

### Configuración del Frontend

1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📜 Scripts Disponibles

### Frontend
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con Vite. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run lint` | Ejecuta el linter para encontrar errores. |

### Backend
| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Inicia el servidor NestJS en modo observador (watch mode). |
| `npm run build` | Compila la aplicación NestJS. |
| `npm run start:prod` | Ejecuta la versión compilada de producción. |

## ✨ Características Principales

- **Scoreboard**: Visualización de marcadores y resultados.
- **Panel de Administración**: Gestión de partidos, resultados y configuración.
- **Sistema de Quiniela**: (En desarrollo) Predicciones y tablas de posiciones.
