export interface BarangayZone {
  id: string;
  name: string;
  category: 'purok' | 'subdivision' | 'street';
  description: string;
  landmark: string;
  centerCoords: [number, number];
  zoom: number;
}

export const HIBAO_AN_SUR_ZONES: BarangayZone[] = [
  {
    id: 'zone-1',
    name: 'Zone 1 (Near Iglesia ni Cristo Church / Main Road Area)',
    category: 'purok',
    description: 'Main road commercial and residential corridor near the Iglesia ni Cristo (INC) Church',
    landmark: 'Iglesia ni Cristo (INC) Church / Main Road',
    centerCoords: [10.7335, 122.5218],
    zoom: 16
  },
  {
    id: 'zone-3',
    name: 'Zone 3',
    category: 'purok',
    description: 'Central community sector connecting primary utility networks and residential clusters',
    landmark: 'Zone 3 Central Area',
    centerCoords: [10.7322, 122.5234],
    zoom: 16
  },
  {
    id: 'zone-4',
    name: 'Zone 4',
    category: 'purok',
    description: 'Residential sector adjoining eastern subdivision access corridors',
    landmark: 'Zone 4 Boundary Area',
    centerCoords: [10.7305, 122.5242],
    zoom: 16
  },
  {
    id: 'zone-5',
    name: 'Zone 5 (Pangpang Area)',
    category: 'purok',
    description: 'Pangpang riverside slope community with localized drainage corridors',
    landmark: 'Pangpang Area',
    centerCoords: [10.7342, 122.5202],
    zoom: 16
  },
  {
    id: 'zone-6',
    name: 'Zone 6 / San Vicente (Chapel and Basketball Court Area)',
    category: 'purok',
    description: 'San Vicente community featuring the local chapel and covered basketball court',
    landmark: 'San Vicente Chapel & Basketball Court',
    centerCoords: [10.7292, 122.5230],
    zoom: 16
  },
  {
    id: 'sacred-heart',
    name: 'Sacred Heart Subdivision (Phases I & II)',
    category: 'subdivision',
    description: 'Masterplanned residential community encompassing Phase I and Phase II',
    landmark: 'Sacred Heart Subdivision Entrance & Phases I-II',
    centerCoords: [10.7315, 122.5260],
    zoom: 16
  },
  {
    id: 'monterosa',
    name: 'Monterosa Subdivision',
    category: 'subdivision',
    description: 'Established residential subdivision community with clubhouse amenities',
    landmark: 'Monterosa Subdivision Main Entrance',
    centerCoords: [10.7285, 122.5255],
    zoom: 16
  },
  {
    id: 'amysville',
    name: 'Amysville Subdivision',
    category: 'subdivision',
    description: 'Gated residential neighborhood community',
    landmark: 'Amysville Subdivision Gate',
    centerCoords: [10.7348, 122.5238],
    zoom: 16
  },
  {
    id: 'cti',
    name: 'CTI Subdivision',
    category: 'subdivision',
    description: 'Residential community along northern access boundaries',
    landmark: 'CTI Subdivision Entrance',
    centerCoords: [10.7300, 122.5212],
    zoom: 16
  },
  {
    id: 'dona-ana-ros',
    name: 'Doña Ana Ros III Subdivision',
    category: 'subdivision',
    description: 'Residential subdivision bordering southern Mandurriao networks',
    landmark: 'Doña Ana Ros III Main Access Road',
    centerCoords: [10.7278, 122.5222],
    zoom: 16
  },
  {
    id: 'guzman-st',
    name: 'Guzman Street',
    category: 'street',
    description: 'Major arterial street connecting Hibao-an Sur with central Mandurriao transit',
    landmark: 'Guzman Street Main Thoroughfare',
    centerCoords: [10.7318, 122.5205],
    zoom: 16
  }
];

export const BARANGAY_HALL_LOCATION: [number, number] = [10.7314, 122.5228];
