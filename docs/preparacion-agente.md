# Preparación del agente

## Entorno y modelo

| Dato | Valor |
|---|---|
| Harness | Claude Code, CLI |
| Versión | 2.1.316, obtenida con `claude --version` |
| Modelo | Opus 5.5, identificador `claude-opus-5-5`, informado por el entorno de la sesión |
| Sistema | macOS (Darwin 25.6.0) |
| Agentes | Uno solo |

**Función:** leer la consigna, proponer el diseño, escribir código, pruebas y documentación, ejecutar comandos en el repositorio y registrar el proceso.

**Motivo de la elección:** actúa sobre el repositorio con herramientas reales (archivos, terminal y Git), y el autor ya lo tenía disponible.

## Instrucciones

- [`CLAUDE.md`](../CLAUDE.md): arquitectura, reglas de dominio, evidencia, revisión humana y seguridad. Claude Code lo carga al iniciar cada sesión en este directorio.
- [`.claude/settings.json`](../.claude/settings.json): permisos del proyecto.

## Contexto

**Suministrado**
- La consigna completa, `docs/consigna/challenge-agents.pdf`.
- Las directivas del autor sobre stack y arquitectura, registradas en [`decisiones.md`](decisiones.md).
- `docs/especificacion.md`, como fuente de verdad funcional una vez escrita.

**Excluido**
- Credenciales y variables de entorno: no se necesitan, y `.env` está bloqueado por permisos.
- Datos reales de personas: los solicitantes son ficticios.
- Las transcripciones completas de conversación no se adjuntan, como pide la consigna.

## Permisos y controles

| Acción | Tratamiento |
|---|---|
| Pruebas, lint, typecheck y build | Permitidas sin confirmación |
| `git status`, `diff`, `log`, `add`, `commit` | Permitidas sin confirmación |
| `git push` | Requiere aprobación humana |
| `pnpm db:reset` | Requiere aprobación humana |
| Leer `.env` | Denegado |
| `git push --force`, `git reset --hard` | Denegados |

**Controles humanos previstos:** pausa al terminar cada episodio (dominio, persistencia e interfaz) para aceptar, corregir o rechazar. Las decisiones reales quedan en [`episodios.md`](episodios.md).

## Adaptación específica

`CLAUDE.md` exige que, antes de crear o modificar la lógica de superposición, exista una prueba de turnos consecutivos que falle por el motivo esperado, en un commit anterior al de la implementación.

Es comprobable en el historial de Git: el commit de la prueba debe preceder al de la implementación. La evidencia de uso está en el [Episodio 1](episodios.md#episodio-1-reglas-de-dominio).

## Retención del progreso

El progreso y las decisiones se conservan en archivos versionados: [`progreso.md`](progreso.md) y [`decisiones.md`](decisiones.md).
