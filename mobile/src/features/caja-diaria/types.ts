export type CajaDiariaRow = {
  id: string;
  conductorId: string;
  fecha: string;
  monto: number;
  updatedAt: string | null;
};

export type CajaDiariaMap = Record<string, CajaDiariaRow>;
