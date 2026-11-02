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
