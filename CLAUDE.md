# Instrucciones del agente

Sistema local de reservas de laboratorio para el Challenge IA. La fuente de verdad funcional es `docs/especificacion.md`. La consigna original está en `docs/consigna/challenge-agents.pdf`.

## Idioma

- Documentación, textos de la interfaz y mensajes de error de la API: español.
- Código e identificadores: inglés.

## Arquitectura

Monorepo con Turborepo y pnpm.

- `apps/api`: Express, TypeScript, SQLite y Drizzle, en capas técnicas: `routes → controllers → services → models → db`. Una capa solo llama a la siguiente.
- `apps/web`: React y Vite. `main.tsx` monta `App.tsx`, que compone las features.
  - Dependencias permitidas: `App.tsx → features → shared`.
  - Una feature nunca importa a otra.
  - `shared` nunca importa features.

A `shared` solo va conocimiento realmente compartido. Dos códigos parecidos no alcanzan para abstraer: se prefiere repetir antes que abstraer temprano. No crear `packages/`.

## Reglas de dominio que no se pueden romper

1. **Prueba primero en superposición.** Antes de crear o modificar la lógica de superposición, escribir o actualizar una prueba de turnos consecutivos (10:00–11:00 seguido de 11:00–12:00 debe aceptarse) y comprobar que falla por el motivo esperado. Esa prueba va en un commit anterior al de la implementación.
2. **Una sola regla de superposición.** Disponibilidad y creación llaman a la misma función, `findActiveOverlapping`. No duplicar la condición.
3. **Cancelar nunca borra.** Una reserva cancelada conserva identificador y datos, y solo cambia de estado.
4. **El tiempo se inyecta.** El código de dominio recibe `now`; nunca llama a `new Date()` directamente. Las pruebas no dependen de la fecha real.

## Evidencia del proceso

La entrega evalúa evidencia del repositorio. Mantener esto al día durante el trabajo:

- `docs/progreso.md`: una entrada por cada paso completado.
- `docs/decisiones.md`: toda decisión significativa, con motivo, alternativas y consecuencias.
- `docs/episodios.md`: los tres episodios de delegación, con la decisión humana real.
- `docs/verificacion.md`: comando, versión y resultado de lo que se ejecutó de verdad.

Nunca inventar fallas, resultados ni decisiones humanas. Si algo no se ejecutó, decirlo. Distinguir lo que afirma el agente de lo que se comprobó.

## Revisión humana

Pausar y esperar la decisión del usuario al terminar cada episodio: dominio, persistencia e interfaz. No registrar una decisión humana antes de que ocurra.

## Comandos

- `pnpm dev`: levanta API y web.
- `pnpm test`: ejecuta todas las pruebas.
- `pnpm lint` y `pnpm typecheck`: controles estáticos.
- `pnpm db:reset --yes`: **borra todas las reservas**.

Antes de declarar algo terminado, ejecutar las pruebas y citar el resultado real.

## Seguridad

- Sin secretos, tokens ni credenciales en el repositorio.
- Sin archivos `.db` en Git.
- Solicitantes siempre ficticios, sin datos reales de estudiantes.
