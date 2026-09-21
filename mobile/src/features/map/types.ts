export type LiveOperator = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  estado: "activo" | "en_linea";
};

export type LiveStop = {
  id: number;
  operatorId: number;
  operatorName: string;
  localName: string;
  latitude: number;
  longitude: number;
  estado: string;
};

export type OperatorCatalogItem = {
  id: number;
  name: string;
};

export type MapLive = {
  operators: LiveOperator[];
  stops: LiveStop[];
  catalog: OperatorCatalogItem[];
};

export type MapFilter = "todos" | "en_linea" | "en_ruta";
