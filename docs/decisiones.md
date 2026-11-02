# Registro de decisiones

## D-1: Stack y reproducibilidad

**Fecha:** 2026-11-02. **Decidió:** el autor.

**Contexto:** la consigna deja libres lenguaje, almacenamiento e interfaz, pero exige que la aplicación y sus pruebas se reproduzcan.

**Evolución**
1. El agente propuso Python, SQLite y una CLI, por tener pocas dependencias.
2. El autor pidió Next.js, TypeScript, Drizzle y Postgres en Neon, con arquitectura por features.
3. El agente señaló que las credenciales de Neon no pueden ir al repositorio, así que quien evalúe necesitaría crear su propia base o una alternativa local.
4. El autor decidió cambiar a un monorepo con Turborepo: Express, TypeScript, SQLite y Drizzle en el backend, y React con Vite en el frontend.

**Decisión:** la opción 4.

**Alternativas descartadas**
- Python con CLI: el autor prefirió un stack TypeScript con interfaz web.
- Neon con fallback a Postgres embebido: reproducible, pero con dos drivers de base.
- Neon con Postgres en Docker: exige Docker a quien evalúe.

**Consecuencias**
- La app corre con `pnpm install` y `pnpm dev`, sin cuentas ni credenciales.
- Como SQLite no tiene restricciones de exclusión como Postgres, la superposición se verifica en la aplicación, dentro de una transacción.
- No se creó ningún recurso en Neon.

## D-2: Arquitectura del código

**Fecha:** 2026-11-02. **Decidió:** el autor.

**Decisión**
- `apps/api` en capas técnicas: rutas, controladores, servicios, modelos y base de datos.
- `apps/web` por features: `src/features`, `src/shared` y `App.tsx` como raíz. `main.tsx` se mantiene porque Vite lo usa para montar la aplicación.
- A `shared` solo va conocimiento compartido. Se acepta repetir código antes que abstraer temprano.

**Alternativa descartada:** un paquete compartido de tipos entre `api` y `web`.

**Consecuencia:** los tipos de la API se repiten en `web`. Un cambio de contrato se toca en dos lugares.

## D-3: Hosting

**Fecha:** 2026-11-02. **Decidió:** el autor.

**Decisión:** solo local.

**Alternativa descartada:** Vercel. La consigna no lo exige y, sin autenticación, cualquiera con el enlace podría reservar o cancelar.

**Consecuencia:** no hay URL pública. Se evalúa clonando el repositorio.

## D-4: Superficie de revisión humana

**Fecha:** 2026-11-02. **Decidió:** el autor.

**Decisión:** el agente hace commits solo, pero pausa al terminar cada episodio para una decisión humana.

**Alternativas descartadas**
- Aprobar cada commit: da más control, pero es lo más lento.
- Revisar solo al final: no deja decisiones sobre cada entrega.

**Consecuencia:** `git push` sigue requiriendo aprobación.
