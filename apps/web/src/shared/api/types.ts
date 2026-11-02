export type Unit = { id: string; name: string };

export type ReservationStatus = "active" | "cancelled";

export type Reservation = {
  id: string;
  unitId: string;
  requester: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
};

export type Availability = {
  unitId: string;
  start: string;
  end: string;
  available: boolean;
  conflicts: Reservation[];
};

export type FieldIssue = { field: string; message: string };
