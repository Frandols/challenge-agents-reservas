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

`.claude/settings.json` se creó durante la primera sesión. No se comprobó si Claude Code aplicó estas reglas en esa misma sesión ni si cada `git push` pasó por una confirmación explícita, así que la tabla describe lo configurado, no lo observado.

**Controles humanos aplicados**
- El autor aprobó el plan antes de que el agente modificara el proyecto.
- El autor cambió el stack durante la planificación (D-1).
- Hubo una pausa de revisión al terminar cada episodio: uno se aceptó, uno se corrigió y uno se aceptó después de probar la aplicación. Ver [`episodios.md`](episodios.md).

**Qué se revisó antes de aceptar:** diffs y salidas de pruebas en el caso del agente; las decisiones señaladas en cada pausa y la aplicación funcionando en el caso del autor.

**Herramientas usadas además de archivos y terminal**
- MCP de GitHub, para crear el repositorio.
- MCP de Neon, solo para leer organizaciones, proyectos y regiones. No se creó nada (D-1).
- Playwright en un directorio temporal, para el recorrido en navegador. No forma parte del repositorio.
- Skill `frontend-design`, para la dirección visual.

## Adaptación específica

`CLAUDE.md` exige que, antes de crear o modificar la lógica de superposición, exista una prueba de turnos consecutivos que falle por el motivo esperado, en un commit anterior al de la implementación.

Es comprobable en el historial de Git: el commit de la prueba debe preceder al de la implementación. La evidencia de uso está en el [Episodio 1](episodios.md#episodio-1-reglas-de-dominio).

## Retención del progreso

El progreso y las decisiones se conservan en archivos versionados: [`progreso.md`](progreso.md) y [`decisiones.md`](decisiones.md).
