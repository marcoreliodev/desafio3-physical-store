export type Coordinates = {
  lat: number;
  lng: number;
};

export type Geometry = {
  geometry: {
    location: Coordinates;
  };
};

export type GeocodeData = {
  results: Geometry[];
};

type DistanceAndDuration = {
  text: string;
  value: number;
};

export type TravelDistanceAndDuration = {
  distance: DistanceAndDuration;
  duration: DistanceAndDuration;
  status: string;
};

export type DistanceMatrixData = {
  rows: {
    elements: TravelDistanceAndDuration[];
  }[];
};
