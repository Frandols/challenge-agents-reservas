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

Levanta el proceso real de la API, lo detiene y lo vuelve a levantar sobre el mismo archivo.

| Paso | Commit | Comando | Resultado observado |
|---|---|---|---|
| Rojo | [`95639cd`](https://github.com/Frandols/challenge-agents-reservas/commit/95639cd) | `pnpm exec vitest run src/persistence.test.ts` en `apps/api` | 2 fallidas: `expected [] to deeply equal [ { id: 'RES-0001', …(7) }, …(1) ]`, porque la API usaba `:memory:` |
| Verde | [`74a4857`](https://github.com/Frandols/challenge-agents-reservas/commit/74a4857) | `pnpm exec vitest run` en `apps/api` | 39 aprobadas de 39 |
| Estáticos | [`74a4857`](https://github.com/Frandols/challenge-agents-reservas/commit/74a4857) | `pnpm exec tsc --noEmit` y `pnpm exec eslint src` | Sin errores |

Cubre la detención con SIGTERM y con SIGKILL, y el reinicio de datos con y sin confirmación.

### Procedimiento manual

Ejecutado en el commit [`74a4857`](https://github.com/Frandols/challenge-agents-reservas/commit/74a4857) con `pnpm --filter @reservas/api start` y la ruta por defecto, `apps/api/data/reservas.db`.

| Paso | Esperado | Observado |
|---|---|---|
| Crear `MIC-01` de 10:00 a 11:00 | `RES-0001`, activa | `RES-0001`, `active` |
| Crear `OSC-01` de 14:00 a 15:00 | `RES-0002`, activa | `RES-0002`, `active` |
| Cancelar `RES-0002` | Estado cancelada, mismos datos | `cancelled`, mismos datos |
| Reservar `MIC-01` de 10:30 a 11:30 | 409 | 409 |
| Detener con SIGTERM | Puerto libre, archivo presente | Puerto libre, `reservas.db` de 32768 bytes |
| Reiniciar y listar | Las dos reservas, sin cambios | Las dos reservas, con estados y datos idénticos |
| Disponibilidad de `MIC-01` de 10:30 a 11:30 | No disponible | `available: false` |
| Disponibilidad de `OSC-01` de 14:00 a 15:00 | Disponible, porque está cancelada | `available: true`, sin conflictos |
| `pnpm db:reset` sin `--yes` | Advierte y no borra | Advirtió y terminó con error |
| `pnpm db:reset --yes` | Borra las reservas | "Se borraron 2 reservas" |

**No ejecutado:** concurrencia real entre procesos, que está fuera de alcance. Tampoco se probó `pnpm db:reset` con la API en ejecución.
