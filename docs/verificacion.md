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

**No ejecutado todavía:** persistencia en archivo y reinicio de la aplicación.
