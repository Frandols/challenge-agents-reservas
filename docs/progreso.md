# Progreso

## 2026-11-02

- Se leyó la consigna y se acordó el plan con el autor.
- Se inicializó Git y se escribieron la especificación v1, las instrucciones del agente, los permisos y el registro de decisiones.
- Se creó el monorepo con Turborepo y pnpm. Pruebas, typecheck, lint y build pasan en el esqueleto.
- `better-sqlite3` 13.0.3 falló con segmentation fault y se fijó la 12.11.1 (ver D-5). TypeScript se fijó en 6.0.x (ver D-6).

- Episodio 1: se implementaron las reglas de dominio con prueba previa. 36 pruebas aprobadas sobre base en memoria.

- El autor aceptó el Episodio 1 (ver D-7).

- Episodio 2: se conectó SQLite en archivo y se comprobó el reinicio de forma automática y manual. 39 pruebas aprobadas.

- El autor corrigió el Episodio 2 (ver D-8). La prueba automática ya no lanza procesos y el procedimiento manual suma SIGKILL.

- Episodio 3: se construyó la interfaz y se recorrió en navegador. 39 pruebas de API y 10 de web aprobadas.

- El autor aceptó el Episodio 3.

**Siguiente:** README y verificación desde un clon limpio.
