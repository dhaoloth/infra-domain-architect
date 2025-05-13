
export interface DC {
  id: string;
  name: string;
  siteId: string;
  isKey: boolean;
  x?: number;
  y?: number;
}

export interface Site {
  id: string;
  name: string;
}

export interface ReplicationLink {
  id: string;
  sourceDC: string;
  targetDC: string;
  isInterSite: boolean;
}

export interface TopologyData {
  sites: Site[];
  dcs: DC[];
  links: ReplicationLink[];
}

export type ValidationError = {
  type: 'error' | 'warning';
  message: string;
  relatedIds?: string[];
};

export interface TopologyNode {
  id: string;
  type: 'dc';
  data: DC;
  position: { x: number, y: number };
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  data: { isInterSite: boolean };
}
