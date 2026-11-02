# Episodios de delegación

## Episodio 1: reglas de dominio

**Objetivo y requisito:** implementar reservas y disponibilidad con una sola regla de superposición (RF-2 a RF-5, RN-1 a RN-8, CA-1 a CA-13).

**Contexto suministrado:** `docs/especificacion.md` y `CLAUDE.md`.

**Extracto de instrucción** (`CLAUDE.md`):

> Antes de crear o modificar la lógica de superposición, escribir o actualizar una prueba de turnos consecutivos [...] y comprobar que falla por el motivo esperado. Esa prueba va en un commit anterior al de la implementación.

**Acción del agente**
1. Creó las capas con la regla sin implementar ([`2d01a87`](https://github.com/Frandols/challenge-agents-reservas/commit/2d01a87)).
2. Escribió las pruebas y observó el rojo ([`e41d6c5`](https://github.com/Frandols/challenge-agents-reservas/commit/e41d6c5)).
3. Implementó `findActiveOverlapping` ([`1bb21ed`](https://github.com/Frandols/challenge-agents-reservas/commit/1bb21ed)).
4. Ejecutó dos mutaciones para comprobar que las pruebas detectan una regla incorrecta.

**Resultado verificable:** [`docs/verificacion.md`](verificacion.md).

**Decisión humana:** aceptar. El agente señaló como punto de revisión que `availability` importa helpers de `services/reservations`. El autor lo aceptó con este motivo:

> Estoy dispuesto a aceptar acoples entre servicios al utilizar la organizacion en capas tecnicas pues, ya estoy asumiendo una relacion al agruparlas de esa manera, acepto este episodio.
