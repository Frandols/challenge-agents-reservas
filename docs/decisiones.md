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

## D-5: Fijar `better-sqlite3` en 12.11.1

**Fecha:** 2026-11-02. **Decidió:** el agente, por una falla observada.

**Contexto:** con la versión 13.0.3, abrir una base terminó con segmentation fault (exit 139) en Node 22.13.1 sobre darwin-arm64.

**Decisión:** fijar la versión exacta 12.11.1, que abrió una base y respondió `select sqlite_version()` con 3.53.2 en el mismo entorno.

**Alternativa descartada:** `node:sqlite`. Funciona, pero Node lo marca como experimental.

**Consecuencia:** no se usa la última versión mayor. No se investigó la causa de la falla en la 13.

## D-6: Fijar TypeScript en 6.0.x

**Fecha:** 2026-11-02. **Decidió:** el agente, según lo previsto en el plan.

**Contexto:** `typescript-eslint` 8.72.1 pide TypeScript `>=4.8.4 <6.1.0`, y la última versión es la 7.0.2.

**Decisión:** usar TypeScript 6.0.x.

**Alternativa descartada:** quedarse en la 7 sin lint con tipos TypeScript, porque el control de dependencias entre features depende de ESLint.

## D-7: Aceptar acoples entre servicios

**Fecha:** 2026-11-02. **Decidió:** el autor, en la revisión del Episodio 1.

**Contexto:** `services/availability` reutiliza `assertUnitExists` y `serializeReservation` de `services/reservations`.

**Decisión:** mantener ese acople. Organizar por capas técnicas ya asume una relación entre los servicios de una misma capa.

**Alternativa descartada:** extraer esos helpers a un módulo común.

**Consecuencia:** un cambio en `services/reservations` puede afectar a `availability`. Las pruebas de coherencia cubren esa relación.

## D-8: Probar la persistencia en proceso

**Fecha:** 2026-11-02. **Decidió:** el autor, en la revisión del Episodio 2.

**Contexto:** la prueba original lanzaba el proceso real, por lo que era más lenta y dependía de `tsx`.

**Decisión:** extraer `startServer` e invertir sus dependencias (`databasePath`, `port`, `now`). La prueba automática reinicia app y base en el mismo proceso, y la detención del proceso real queda en el procedimiento manual.

**Alternativas descartadas**
- Mocks o un fake de la base: pasarían aunque SQLite no guardara nada.
- Mantener la prueba con procesos: cubre señales, pero con más costo.

**Consecuencias**
- La suite completa de la API tarda menos de un segundo.
- SIGTERM, SIGKILL, la lectura de `DATABASE_PATH` y la confirmación `--yes` de `db:reset` solo se comprueban con el procedimiento manual.
