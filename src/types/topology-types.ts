
export interface Site {
  id: string;
  name: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface DC {
  id: string;
  name: string;
  siteId: string;
  isKey: boolean;
  x?: number;
  y?: number;
}

export interface ReplicationLink {
  id: string;
  sourceDC: string;
  targetDC: string;
  isInterSite: boolean;
}

export interface ValidationError {
  type: 'warning' | 'error';
  message: string;
  relatedIds: string[];
}

export interface TopologyData {
  sites: Site[];
  dcs: DC[];
  links: ReplicationLink[];
}
