export type {
  CertificadoHistorial,
  CertificadoPendiente,
  CertificadoTab,
  CertUploadInput,
} from "./types";
export { useCertificadosScreen } from "./hooks";
export {
  fetchPendientes,
  fetchHistorial,
  uploadCertificado,
  deleteHistorialItem,
} from "./api";
