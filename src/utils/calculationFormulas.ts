// Base formulas for resource calculations
export const formulas = {
  // RAM calculation formula
  ramPerDC: (totalObjects: number): number => {
    const baseRam = 3.0 + (totalObjects / 20000);
    return Math.max(8, baseRam); // Minimum 8GB
  },

  // Disk calculation formula
  diskPerDC: (totalObjects: number): number => {
    return 50.0 + (totalObjects / 20000);
  },

  // CPU cores calculation formula
  cpuCoresPerDC: (userLoad: number): number => {
    return Math.max(1, Math.ceil(userLoad / 1000));
  },

  // Network bandwidth calculation formula
  networkBandwidth: (userLoad: number): number => {
    if (userLoad >= 5000) return 10000;
    if (userLoad >= 1000) return 1000;
    return 100;
  },

  // CPU frequency calculation formula
  cpuFrequency: (userLoad: number): number => {
    if (userLoad >= 5000) return 3.2;
    if (userLoad >= 3000) return 2.8;
    if (userLoad >= 1000) return 2.4;
    return 2.0;
  },

  // Resource modifiers
  modifiers: {
    globalCatalog: {
      ram: 1.15,
      disk: 1.15
    },
    syncService: {
      ram: 1.10,
      disk: 1.15
    }
  },

  // Subsystem base requirements
  subsystemBase: {
    monitoring: {
      ram: 2,
      cpu: 2,
      disk: 30,
      network: 1000
    },
    journaling: {
      ram: 2,
      cpu: 2,
      disk: 100,
      network: 1000
    },
    repository: {
      ram: 2,
      cpu: 2,
      disk: 100,
      network: 1000
    },
    os_installation: {
      ram: 4,
      cpu: 2,
      disk: 200,
      network: 1000
    },
    printing: {
      ram: 2,
      cpu: 1,
      disk: 50,
      network: 1000
    },
    file_sharing: {
      ram: 4,
      cpu: 2,
      disk: 500,
      network: 1000
    },
    dhcp: {
      ram: 2,
      cpu: 1,
      disk: 20,
      network: 1000
    }
  },

  // Scaling factors
  scalingFactors: {
    calculateUserScaling: (totalUsers: number): number => {
      if (totalUsers > 10000) {
        return 1 + (totalUsers - 10000) / 20000;
      }
      return 1;
    },
    
    maxScaling: {
      ram: 3,
      cpu: 4,
      disk: 5
    }
  }
};