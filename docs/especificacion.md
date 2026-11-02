# Especificación

Versión 1. Los cambios posteriores quedan en el historial de Git de este archivo y en la sección [Cambios](#cambios).

## Problema

La coordinación de un laboratorio registra pedidos en mensajes y una planilla. A veces se confirma la misma unidad para horarios superpuestos, y otras veces una cancelación sigue bloqueando el horario. Necesita consultar disponibilidad, reservar y cancelar sin perder el historial.

## Alcance

**Incluido**
- Leer el inventario precargado.
- Consultar disponibilidad por unidad e intervalo.
- Crear reservas de una unidad.
- Cancelar reservas conservando sus datos.
- Persistir reservas y estados entre reinicios.
- Interfaz web local para operar el sistema.

**Excluido**
- Administrar el inventario.
- Autenticación y roles.
- Notificaciones, pagos e integraciones externas.
- Despliegue, concurrencia distribuida y escalabilidad de producción.

## Inventario

Cada ID identifica una unidad física distinta.

| ID | Equipo |
|---|---|
| MIC-01 | Microscopio digital |
| MIC-02 | Microscopio digital |
| OSC-01 | Osciloscopio |
| MUL-01 | Multímetro |
| FUE-01 | Fuente de alimentación |

## Requisitos funcionales

| ID | Requisito |
|---|---|
| RF-1 | Listar las unidades del inventario. |
| RF-2 | Consultar si una unidad está disponible en un intervalo e informar los conflictos. |
| RF-3 | Crear una reserva identificable con unidad, solicitante, inicio y fin. |
| RF-4 | Cancelar una reserva conservando identificador y datos, y liberar el intervalo. |
| RF-5 | Listar reservas activas y canceladas. |
| RF-6 | Recuperar reservas y estados después de reiniciar la aplicación. |

## Reglas

| ID | Regla |
|---|---|
| RN-1 | Una reserva activa ocupa su intervalo. Una cancelada no bloquea disponibilidad. |
| RN-2 | La unidad debe existir en el inventario. |
| RN-3 | El solicitante no puede estar vacío ni tener solo espacios. |
| RN-4 | Las fechas y horas deben ser válidas y el inicio debe ser estrictamente anterior al fin. |
| RN-5 | Se rechazan las superposiciones de reservas activas de la misma unidad. |
| RN-6 | Se permiten límites consecutivos: una reserva puede empezar cuando termina otra. |
| RN-7 | Se permiten reservas simultáneas de unidades distintas. |
| RN-8 | La consulta de disponibilidad usa las mismas reglas que la creación. |

Dos intervalos `[a, b)` y `[c, d)` se superponen si y solo si `a < d` y `c < b`.

## Supuestos

| ID | Supuesto | Motivo |
|---|---|---|
| S-1 | Zona horaria fija: `America/Argentina/Buenos_Aires`. | El laboratorio opera en un solo lugar. |
| S-2 | Formato de fecha y hora: `YYYY-MM-DDTHH:MM`, sin segundos ni desplazamiento. | Es un formato inequívoco, y las cadenas se ordenan cronológicamente. |
| S-3 | No se puede crear una reserva con inicio en el pasado. | Reservar algo que ya ocurrió no tiene sentido operativo. |
| S-4 | Se puede consultar disponibilidad de intervalos pasados. | Es una lectura sin efectos. |
| S-5 | Se puede cancelar una reserva cuyo horario ya pasó. | Sirve para corregir el registro. |
| S-6 | Cancelar una reserva ya cancelada es un error. | Evita sobrescribir la fecha de cancelación original. |
| S-7 | No hay límites de duración ni de anticipación. | La consigna no los pide. |
| S-8 | Los identificadores son secuenciales con formato `RES-0001`. | Son fáciles de leer y citar para la coordinación. |
| S-9 | Reservar sobre el horario de una reserva cancelada está permitido. | Es consecuencia directa de RN-1. |

## Criterios de aceptación

Salvo que se indique otra cosa, parten de `MIC-01` reservado de 10:00 a 11:00 en una fecha futura.

| ID | Dado | Cuando | Entonces | Cubre |
|---|---|---|---|---|
| CA-1 | Sin reservas | Se crea una reserva válida | Responde 201 con identificador `RES-` y estado activo | RF-3 |
| CA-2 | La reserva base | Se reserva `MIC-01` de 10:30 a 11:30 | Responde 409 con el conflicto y no se crea nada | RN-5 |
| CA-3 | La reserva base | Se reserva `MIC-01` de 11:00 a 12:00 | Responde 201 | RN-6 |
| CA-4 | La reserva base | Se reserva `MIC-02` de 10:00 a 11:00 | Responde 201 | RN-7 |
| CA-5 | Sin reservas | La unidad no existe | Responde 404 | RN-2 |
| CA-6 | Sin reservas | El solicitante está vacío o tiene solo espacios | Responde 400 | RN-3 |
| CA-7 | Sin reservas | La fecha es imposible, como `2026-02-30T10:00` | Responde 400 | RN-4 |
| CA-8 | Sin reservas | El inicio es igual o posterior al fin | Responde 400 | RN-4 |
| CA-9 | Sin reservas | El inicio ya pasó | Responde 400 | S-3 |
| CA-10 | La reserva base | Se cancela | Conserva identificador y datos, con estado cancelada | RF-4 |
| CA-11 | La reserva base cancelada | Se vuelve a reservar el mismo intervalo | Responde 201 | RN-1 |
| CA-12 | La reserva base cancelada | Se cancela otra vez | Responde 409 | S-6 |
| CA-13 | Cada caso de CA-2 a CA-4 y CA-11 | Se consulta disponibilidad | El resultado coincide con el de la creación | RN-8 |
| CA-14 | Reservas activas y canceladas | Se detiene y reinicia la aplicación sin borrar datos | Siguen con sus datos y estados | RF-6 |

## Cambios

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-02 | Versión inicial. | |
