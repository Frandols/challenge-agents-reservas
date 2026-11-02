import { z } from "zod";
import { AppError } from "../errors/app-error";
import { isLocalDate, isLocalDateTime } from "../lib/time";

const FORMAT_MESSAGE = "Debe ser una fecha y hora válida con formato YYYY-MM-DDTHH:MM.";

const localDateTime = z.string(FORMAT_MESSAGE).refine(isLocalDateTime, FORMAT_MESSAGE);

const interval = z
  .object({ start: localDateTime, end: localDateTime })
  .refine(({ start, end }) => start < end, {
    path: ["end"],
    message: "El inicio debe ser anterior al fin.",
  });

const createReservationBody = z
  .object({
    unitId: z.string("Indicá una unidad."),
    requester: z
      .string("Indicá quién solicita la reserva.")
      .trim()
      .min(1, "Indicá quién solicita la reserva."),
    start: localDateTime,
    end: localDateTime,
  })
  .refine(({ start, end }) => start < end, {
    path: ["end"],
    message: "El inicio debe ser anterior al fin.",
  });

const availabilityQuery = interval.extend({ unitId: z.string("Indicá una unidad.") });

const listReservationsQuery = z.object({
  unitId: z.string().optional(),
  date: z
    .string()
    .refine(isLocalDate, "Debe ser una fecha válida con formato YYYY-MM-DD.")
    .optional(),
  status: z.enum(["active", "cancelled"], "Debe ser active o cancelled.").optional(),
});

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new AppError(
      400,
      "invalid_input",
      "Revisá los datos enviados.",
      result.error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
    );
  }

  return result.data;
}

export const parseCreateReservation = (input: unknown) => parse(createReservationBody, input);
export const parseAvailabilityQuery = (input: unknown) => parse(availabilityQuery, input);
export const parseListReservationsQuery = (input: unknown) => parse(listReservationsQuery, input);
