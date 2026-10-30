# KGS Exam Portal

This project runs locally and does not require a Render deployment.

## Start the backend

1. Copy `backend/.env.example` to `backend/.env` and provide the required local database and secret values.
2. From `backend`, install dependencies and start the API:

   ```powershell
   npm install
   npm run dev
   ```

The API is available at `http://localhost:4000`.

## Start the frontend

From `KGS Exam Portal Design`, install dependencies and start Vite:

```powershell
npm install
npm run dev
```

Vite prints the local frontend URL when it starts (normally `http://localhost:5173`; the Figma development environment may use `http://localhost:8443`). Both origins are accepted by the local API.

# LMS-Portal
