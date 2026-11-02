# Verificación

Registro de lo ejecutado realmente. Lo que informa el agente sin ejecución no cuenta como comprobado.

**Entorno:** Node 22.13.1, pnpm 12.14.0, Vitest 5.0.5, macOS darwin-arm64.

## Reglas de dominio

Fecha: 2026-11-02. Base de datos en memoria.

| Paso | Commit | Comando | Resultado observado |
|---|---|---|---|
| Rojo | [`e41d6c5`](https://github.com/Frandols/challenge-agents-reservas/commit/e41d6c5) | `pnpm exec vitest run -t "límites consecutivos"` en `apps/api` | 2 fallidas: `expected 500 to be 201`, porque `findActiveOverlapping` no estaba implementada |
| Verde | [`1bb21ed`](https://github.com/Frandols/challenge-agents-reservas/commit/1bb21ed) | `pnpm exec vitest run` en `apps/api` | 36 aprobadas de 36 |
| Estáticos | [`1bb21ed`](https://github.com/Frandols/challenge-agents-reservas/commit/1bb21ed) | `pnpm exec tsc --noEmit` y `pnpm exec eslint src` | Sin errores |

**Mutaciones manuales:** se alteró la regla, se ejecutaron las pruebas y se restauró el archivo. No quedaron en el historial.

| Mutación | Resultado observado |
|---|---|
| `lt(startsAt, end)` cambiado por `lte` | 1 fallida: "permite terminar exactamente cuando empieza otra reserva" |
| Sin filtro de estado `active` | 2 fallidas: "libera el horario" y "coincide después de cancelar" |

## Persistencia

Fecha: 2026-11-02. Base de datos en archivo.

### Prueba automática

La versión original lanzaba el proceso real ([`95639cd`](https://github.com/Frandols/challenge-agents-reservas/commit/95639cd) en rojo, [`74a4857`](https://github.com/Frandols/challenge-agents-reservas/commit/74a4857) en verde). Por decisión del autor ([D-8](decisiones.md#d-8-probar-la-persistencia-en-proceso)) ahora usa `startServer`, con SQLite en un archivo temporal y reinicio dentro del mismo proceso.

| Paso | Commit | Comando | Resultado observado |
|---|---|---|---|
| Rojo original | [`95639cd`](https://github.com/Frandols/challenge-agents-reservas/commit/95639cd) | `pnpm exec vitest run src/persistence.test.ts` en `apps/api` | 2 fallidas: `expected [] to deeply equal [ { id: 'RES-0001', …(7) }, …(1) ]` |
| Verde actual | [`69ad970`](https://github.com/Frandols/challenge-agents-reservas/commit/69ad970) | `pnpm exec vitest run` en `apps/api` | 39 aprobadas de 39, en 480 ms |
| Estáticos | [`69ad970`](https://github.com/Frandols/challenge-agents-reservas/commit/69ad970) | `pnpm exec tsc --noEmit` y `pnpm exec eslint src` | Sin errores |

**Mutación manual:** con `openDatabase(":memory:")` dentro de `startServer`, fallaron 2 de 3 pruebas de persistencia. Se restauró el archivo y no quedó en el historial.

### Procedimiento manual

Ejecutado en el commit [`69ad970`](https://github.com/Frandols/challenge-agents-reservas/commit/69ad970) con `pnpm --filter @reservas/api start` y la ruta por defecto, `apps/api/data/reservas.db`. Reproducción:

1. Iniciar la API.
2. Crear `MIC-01` y `OSC-01` con `POST /api/reservations`.
3. Cancelar la segunda con `POST /api/reservations/RES-0002/cancel`.
4. Detener el proceso y reiniciarlo, sin borrar datos.
5. Consultar `GET /api/reservations` y `GET /api/availability`.

| Paso | Esperado | Observado |
|---|---|---|
| Crear dos reservas y cancelar una | 201, 201 y 200 | 201, 201 y 200 |
| Listar antes de detener | `RES-0001` activa, `RES-0002` cancelada | Coincide |
| Detener con SIGTERM y reiniciar | Las dos reservas, sin cambios | Coincide |
| Reservar `MIC-01` de 10:30 a 11:30 | 409 | 409 |
| Detener con SIGKILL y reiniciar | Las dos reservas, sin cambios | Coincide |
| Disponibilidad de `OSC-01` de 14:00 a 15:00 | Disponible, porque está cancelada | `true` |
| `pnpm db:reset` sin `--yes` | Advierte y no borra | Advirtió, y al reiniciar seguían las dos reservas |
| `pnpm db:reset --yes` | Borra las reservas | "Se borraron 2 reservas" |

**No ejecutado:** concurrencia real entre procesos, que está fuera de alcance. Tampoco se probó `pnpm db:reset` con la API en ejecución.

## Interfaz

Fecha: 2026-11-02. Commit [`7a8b33e`](https://github.com/Frandols/challenge-agents-reservas/commit/7a8b33e).

### Pruebas y controles

| Comando | Resultado observado |
|---|---|
| `pnpm test` | API: 39 aprobadas de 39. Web: 10 aprobadas de 10 |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | Sin errores |

**Límite entre features:** se agregó a propósito un import de una feature a otra y otro de `shared` a una feature. `eslint` rechazó ambos con `no-restricted-imports`. Los dos cambios se revirtieron.

### Recorrido en navegador

Lo ejecutó el agente con Playwright sobre Chromium headless, con `pnpm dev` y una base temporal por `DATABASE_PATH`. El script quedó fuera del repositorio, así que para repetirlo se siguen estos pasos a mano.

| Acción | Esperado | Observado |
|---|---|---|
| Arrastrar en `MIC-01` de 10:00 a 11:00 | Formulario precargado, libre | Coincide |
| Reservar como Ada Pruebas | Confirma `RES-0001` | Coincide |
| Arrastrar de 10:30 a 11:30 | Ocupada, botón deshabilitado | Coincide |
| Arrastrar de 11:00 a 12:00 | Libre, y se puede reservar | Coincide, `RES-0002` |
| Arrastrar en `MIC-02` de 10:00 a 11:00 | Libre, y se puede reservar | Coincide, `RES-0003` |
| Cancelar `RES-0001` | Queda en el historial como cancelada | Coincide |
| Arrastrar de nuevo en `MIC-01` de 10:00 a 11:00 | Libre | Coincide |
| Solicitante de solo espacios | Error en el campo | "Indicá quién solicita la reserva." |
| Reservar con inicio pasado | Error de la API, sin "libre" | "El inicio ya pasó. Elegí un horario futuro." |
| Reservar sin arrastrar, con el formulario y Enter | Crea la reserva y muestra su día | Coincide |
| Ancho de 390 px | Sin desborde horizontal | 0 px de desborde |
| API inaccesible | Mensaje que explica qué hacer | Coincide, repetido en los tres paneles |

**Defectos encontrados por el recorrido y corregidos antes del commit**
- El tablero estiraba toda la página en vez de hacer scroll dentro de su marco.
- El mensaje de confirmación quedaba visible al elegir otro horario desde el tablero.
- Enviar un horario ocupado mostraba dos errores.
- Con inicio pasado, se veían a la vez "está libre" y el error.
- Turborepo filtraba `DATABASE_PATH`, y el recorrido escribió en la base por defecto. Se corrigió `turbo.json` y se borraron esos datos de prueba con `pnpm db:reset --yes`.

**No ejecutado:** el recorrido en un navegador con interfaz gráfica y en otros navegadores, y lectores de pantalla.

Captura de referencia: [`capturas/tablero.png`](capturas/tablero.png).

## Clon limpio

Fecha: 2026-11-02. Commit [`166d21d`](https://github.com/Frandols/challenge-agents-reservas/commit/166d21d), clonado desde GitHub en un directorio temporal, sin variables de entorno ni cuentas. Los commits posteriores solo agregan documentación.

| Comando | Resultado observado |
|---|---|
| `pnpm install --frozen-lockfile` | Completado |
| `pnpm test` | API: 39 aprobadas de 39. Web: 10 aprobadas de 10 |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | Sin errores |
| `pnpm dev` | Puertos 3001 y 5173 servidos desde el clon. 5 unidades, web 200 y `RES-0001` creada |
| Archivos tras usar la app | `reservas.db` creada en `apps/api/data/`, y `git status` sin cambios |

**Primer intento inválido:** el agente lanzó `pnpm dev` sin comprobar los puertos, que ya usaba un servidor de la carpeta original. Las respuestas parecían correctas, pero las daba ese otro servidor, y el del clon terminó a los 97 ms. Lo delató la ausencia de `reservas.db` en el clon. La reserva de prueba cayó en la base del proyecto, que no tenía otras reservas, y se borró. La verificación se repitió comprobando antes que los puertos estuvieran libres y a qué directorio pertenecía cada proceso.
