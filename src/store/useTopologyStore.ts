import { create } from 'zustand';
import { DC, ReplicationLink, Site, TopologyData, ValidationError } from '@/types/topology-types';

interface SitePosition {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

interface TopologyState {
  sites: Site[];
  dcs: DC[];
  links: ReplicationLink[];
  errors: ValidationError[];
  
  // Actions
  addSite: (name: string) => void;
  updateSite: (id: string, name?: string, position?: SitePosition) => void;
  removeSite: (id: string) => void;
  
  addDC: (name: string, siteId: string, isKey: boolean) => void;
  updateDC: (id: string, data: Partial<Omit<DC, 'id'>>) => void;
  removeDC: (id: string) => void;
  
  addLink: (sourceDC: string, targetDC: string) => void;
  removeLink: (id: string) => void;
  
  validateTopology: () => ValidationError[];
  exportTopology: () => TopologyData;
  importTopology: (data: TopologyData) => void;
  
  getLinkCountForDC: (dcId: string) => number;
  canCreateLink: (sourceDC: string, targetDC: string) => boolean;
}

// Generate a random pastel color for site backgrounds
const generateRandomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 90%, 0.3)`;
};

const useTopologyStore = create<TopologyState>((set, get) => ({
  sites: [],
  dcs: [],
  links: [],
  errors: [],
  
  addSite: (name: string) => {
    const id = `site-${Date.now()}`;
    const siteName = name || `Site ${Math.floor(Math.random() * 1000)}`;
    const backgroundColor = generateRandomPastelColor();
    
    set((state) => ({
      sites: [...state.sites, { 
        id, 
        name: siteName, 
        backgroundColor,
        width: 300,  // Default width
        height: 200  // Default height
      }]
    }));
  },
  
  updateSite: (id: string, name?: string, position?: SitePosition) => {
    set((state) => ({
      sites: state.sites.map(site => {
        if (site.id === id) {
          return { 
            ...site, 
            ...(name !== undefined ? { name } : {}),
            ...(position?.x !== undefined ? { x: position.x } : {}),
            ...(position?.y !== undefined ? { y: position.y } : {}),
            ...(position?.width !== undefined ? { width: position.width } : {}),
            ...(position?.height !== undefined ? { height: position.height } : {}),
            ...(position?.backgroundColor !== undefined ? { backgroundColor: position.backgroundColor } : {})
          };
        }
        return site;
      })
    }));
  },
  
  removeSite: (id: string) => {
    // First remove all DCs in this site
    const dcsInSite = get().dcs.filter(dc => dc.siteId === id);
    if (dcsInSite.length > 0) {
      // Update DCs to have no site
      set((state) => ({
        dcs: state.dcs.map(dc => 
          dc.siteId === id ? { ...dc, siteId: "" } : dc
        )
      }));
    }
    
    set((state) => ({
      sites: state.sites.filter(site => site.id !== id)
    }));
  },
  
  addDC: (name: string, siteId: string, isKey: boolean) => {
    const id = `dc-${Date.now()}`;
    const dcName = name || `DC${Math.floor(Math.random() * 100)}`;
    set((state) => ({
      dcs: [...state.dcs, { id, name: dcName, siteId, isKey }]
    }));
  },
  
  updateDC: (id: string, data: Partial<Omit<DC, 'id'>>) => {
    set((state) => ({
      dcs: state.dcs.map(dc => 
        dc.id === id ? { ...dc, ...data } : dc
      )
    }));
  },
  
  removeDC: (id: string) => {
    // First remove all links connected to this DC
    set((state) => ({
      links: state.links.filter(link => 
        link.sourceDC !== id && link.targetDC !== id
      )
    }));
    
    set((state) => ({
      dcs: state.dcs.filter(dc => dc.id !== id)
    }));
  },
  
  addLink: (sourceDC: string, targetDC: string) => {
    if (!get().canCreateLink(sourceDC, targetDC)) return;
    
    const sourceDcData = get().dcs.find(dc => dc.id === sourceDC);
    const targetDcData = get().dcs.find(dc => dc.id === targetDC);
    
    if (!sourceDcData || !targetDcData) return;
    
    const isInterSite = sourceDcData.siteId !== targetDcData.siteId || 
                        sourceDcData.siteId === "" || 
                        targetDcData.siteId === "";
    const id = `link-${sourceDC}-${targetDC}`;
    
    set((state) => ({
      links: [...state.links, { id, sourceDC, targetDC, isInterSite }]
    }));
  },
  
  removeLink: (id: string) => {
    set((state) => ({
      links: state.links.filter(link => link.id !== id)
    }));
  },
  
  validateTopology: () => {
    const { dcs, links, sites } = get();
    const errors: ValidationError[] = [];
    
    // Check if all DCs have at least 2 links (if more than one DC exists)
    if (dcs.length > 1) {
      dcs.forEach(dc => {
        const linkCount = get().getLinkCountForDC(dc.id);
        if (linkCount < 2) {
          errors.push({
            type: 'error',
            message: `DC "${dc.name}" has fewer than 2 replication links (${linkCount})`,
            relatedIds: [dc.id]
          });
        }
      });
    }
    
    // Check if any DC exceeds 4 links
    dcs.forEach(dc => {
      const linkCount = get().getLinkCountForDC(dc.id);
      if (linkCount > 4) {
        errors.push({
          type: 'error',
          message: `DC "${dc.name}" exceeds maximum of 4 replication links (${linkCount})`,
          relatedIds: [dc.id]
        });
      }
    });
    
    // Check for inter-site connectivity if multiple sites exist
    const sitesWithDCs = sites.filter(site => 
      dcs.some(dc => dc.siteId === site.id)
    );
    
    if (sitesWithDCs.length > 1) {
      // Create a map of site connections
      const siteConnections = new Map<string, Set<string>>();
      
      sitesWithDCs.forEach(site => {
        siteConnections.set(site.id, new Set());
      });
      
      // Add connections from links
      links.forEach(link => {
        const sourceDC = dcs.find(dc => dc.id === link.sourceDC);
        const targetDC = dcs.find(dc => dc.id === link.targetDC);
        
        if (sourceDC && targetDC && 
            sourceDC.siteId !== targetDC.siteId && 
            sourceDC.siteId !== "" && targetDC.siteId !== "") {
          const sourceSiteConnections = siteConnections.get(sourceDC.siteId);
          const targetSiteConnections = siteConnections.get(targetDC.siteId);
          
          if (sourceSiteConnections) sourceSiteConnections.add(targetDC.siteId);
          if (targetSiteConnections) targetSiteConnections.add(sourceDC.siteId);
        }
      });
      
      // Check if all sites are connected
      if (sitesWithDCs.length > 0) {
        const visitedSites = new Set<string>();
        const stack = [sitesWithDCs[0].id];
        
        while (stack.length > 0) {
          const siteId = stack.pop();
          if (siteId && !visitedSites.has(siteId)) {
            visitedSites.add(siteId);
            
            const connections = siteConnections.get(siteId);
            if (connections) {
              connections.forEach(connectedSite => {
                if (!visitedSites.has(connectedSite)) {
                  stack.push(connectedSite);
                }
              });
            }
          }
        }
        
        if (visitedSites.size !== sitesWithDCs.length) {
          const unconnectedSites = sitesWithDCs.filter(site => !visitedSites.has(site.id));
          errors.push({
            type: 'error',
            message: `Not all sites are connected. Unreachable sites: ${unconnectedSites.map(s => s.name).join(', ')}`,
            relatedIds: unconnectedSites.map(s => s.id)
          });
        }
      }
    }
    
    set({ errors });
    return errors;
  },
  
  exportTopology: () => {
    return {
      sites: get().sites,
      dcs: get().dcs,
      links: get().links
    };
  },
  
  importTopology: (data: TopologyData) => {
    set({ sites: data.sites, dcs: data.dcs, links: data.links });
  },
  
  getLinkCountForDC: (dcId: string) => {
    const { links } = get();
    return links.filter(link => 
      link.sourceDC === dcId || link.targetDC === dcId
    ).length;
  },
  
  canCreateLink: (sourceDC: string, targetDC: string) => {
    const { links, dcs } = get();
    
    // Cannot link to self
    if (sourceDC === targetDC) return false;
    
    // Check if link already exists (in either direction)
    const existingLink = links.some(link => 
      (link.sourceDC === sourceDC && link.targetDC === targetDC) ||
      (link.sourceDC === targetDC && link.targetDC === sourceDC)
    );
    if (existingLink) return false;
    
    // Check if either DC already has 4 links
    const sourceLinkCount = get().getLinkCountForDC(sourceDC);
    const targetLinkCount = get().getLinkCountForDC(targetDC);
    
    if (sourceLinkCount >= 4 || targetLinkCount >= 4) return false;
    
    return true;
  }
}));

export default useTopologyStore;
