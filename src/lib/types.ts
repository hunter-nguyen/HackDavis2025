export interface DormFireSafety {
  sprinkler: {
    full: boolean;
    partial: boolean;
  };
  alarm: {
    smoke: boolean;
    duct: boolean;
    manual_pull: boolean;
    evac_device: boolean;
  };
  fire_separation: {
    corridor: boolean;
    room: boolean;
  };
}

export interface DormData {
  building_name: string;
  address: string;
  fire_safety: DormFireSafety;
  num_fire_drills: number;
  electricity: number | null;
  steam: number | null;
  chilled_water: number | null;
  domestic_water: number | null;
  latitude?: number;
  longitude?: number;
}

export type UCDDormData = DormData[];
