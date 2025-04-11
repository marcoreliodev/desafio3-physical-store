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
