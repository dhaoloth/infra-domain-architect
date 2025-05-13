
import { 
  ConfigParams, 
  ResourceSpecs, 
  SubsystemSpecs, 
  CalculationResults,
  SiteDistributionResult
} from '../types/types';

// Calculate total objects
const calculateTotalObjects = (config: ConfigParams): number => {
  return config.total_users + config.total_groups;
};

// Calculate vertical scaling (per-DC resources)
const calculateVerticalScaling = (config: ConfigParams, totalObjects: number, averageLoad: number): ResourceSpecs => {
  // Base calculations
  let ramBase = 3.0 + (totalObjects / 20000);
  let diskBase = 50.0 + (totalObjects / 20000);
  const cpuCores = Math.max(1, Math.ceil(averageLoad / 1000));
  
  // Apply modifiers
  if (config.enable_gc) {
    ramBase = ramBase * 1.15;
    diskBase = diskBase * 1.15;
  }
  
  if (config.enable_sync) {
    ramBase = ramBase * 1.10;
    diskBase = diskBase * 1.15;
  }
  
  // Enforce minimum RAM
  const ramTotal = Math.max(8, ramBase);
  
  // Determine specs based on load
  let cpuFreq = 2.0;
  let diskType = 'SSD';
  let networkSpeed = 100;
  
  if (averageLoad >= 5000) {
    cpuFreq = 3.2;
    diskType = 'SSD (RAID)';
    networkSpeed = 10000;
  } else if (averageLoad >= 3000) {
    cpuFreq = 2.8;
    diskType = 'SSD (RAID recommended)';
    networkSpeed = 1000;
  } else if (averageLoad >= 1000) {
    cpuFreq = 2.4;
    diskType = 'SSD';
    networkSpeed = 1000;
  }
  
  return {
    ram_gb: Math.ceil(ramTotal),
    disk_gb: Math.ceil(diskBase),
    cpu_cores: cpuCores,
    cpu_freq_ghz: cpuFreq,
    disk_type: diskType,
    network_mbps: networkSpeed
  };
};

// Calculate horizontal scaling (number of DCs per site)
const calculateDCsPerSite = (
  config: ConfigParams, 
  usersBySite: Record<string, number>
): SiteDistributionResult => {
  const siteDistribution: SiteDistributionResult = {};
  
  // If custom DC count is provided, distribute them proportionally
  if (config.custom_dc_count) {
    const totalUsers = config.total_users;
    let remainingDCs = config.custom_dc_count;
    let remainingUsers = totalUsers;
    
    // Allocate at least 1 DC to each site with users
    Object.keys(usersBySite).forEach(site => {
      if (usersBySite[site] > 0) {
        siteDistribution[site] = 1;
        remainingDCs--;
      } else {
        siteDistribution[site] = 0;
      }
    });
    
    // Distribute remaining DCs proportionally to user count
    Object.keys(usersBySite).forEach(site => {
      if (usersBySite[site] > 0 && remainingDCs > 0) {
        const siteShare = Math.floor((usersBySite[site] / remainingUsers) * remainingDCs);
        siteDistribution[site] += siteShare;
        remainingDCs -= siteShare;
        remainingUsers -= usersBySite[site];
      }
    });
    
    // Allocate any remaining DCs to the sites with the most users
    const sitesByUserCount = Object.keys(usersBySite)
      .sort((a, b) => usersBySite[b] - usersBySite[a]);
    
    let i = 0;
    while (remainingDCs > 0 && i < sitesByUserCount.length) {
      siteDistribution[sitesByUserCount[i]]++;
      remainingDCs--;
      i++;
    }
  } else {
    // Automatic calculation based on users_per_dc_target
    const loadTarget = config.dc_load_model === 'custom' 
      ? config.users_per_dc_target 
      : 2000; // Default target
    
    const isMultiSite = Object.keys(usersBySite).length > 1;
    
    Object.keys(usersBySite).forEach(site => {
      const siteUsers = usersBySite[site];
      
      // Calculate required DCs based on load target
      let dcsRequired = Math.ceil(siteUsers / loadTarget);
      
      // Apply HA minimum
      if (isMultiSite) {
        // Multi-site: Minimum 2 DCs if there are users
        dcsRequired = siteUsers > 0 ? Math.max(dcsRequired, 2) : 0;
      } else {
        // Single-site: Minimum 1 DC if no users, otherwise minimum 2
        dcsRequired = siteUsers === 0 ? 1 : Math.max(dcsRequired, 2);
      }
      
      siteDistribution[site] = dcsRequired;
    });
  }
  
  return siteDistribution;
};

// Calculate subsystem specs
const calculateSubsystemSpecs = (
  config: ConfigParams, 
  totalUsers: number
): Record<string, SubsystemSpecs> => {
  const subsystemSpecs: Record<string, SubsystemSpecs> = {};
  
  // Base specs for each subsystem
  const baseSpecs = {
    monitoring: {
      ram_gb: 2,
      cpu_cores: 2,
      disk_gb: 30,
      disk_type: 'SSD',
      network_mbps: 1000
    },
    journaling: {
      ram_gb: 2,
      cpu_cores: 2,
      disk_gb: 100,
      disk_type: 'SSD',
      network_mbps: 1000
    },
    repository: {
      ram_gb: 2,
      cpu_cores: 2,
      disk_gb: 100,
      disk_type: 'SSD',
      network_mbps: 1000
    }
  };
  
  // Calculate scaling factor for large deployments
  let scaleFactor = 1;
  if (totalUsers > 10000) {
    scaleFactor = 1 + (totalUsers - 10000) / 20000;
  }
  
  // Apply scaling to enabled subsystems
  if (config.subsystem_monitoring) {
    const base = baseSpecs.monitoring;
    subsystemSpecs.monitoring = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 3)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 4)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 5)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  if (config.subsystem_journaling) {
    const base = baseSpecs.journaling;
    subsystemSpecs.journaling = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 3)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 4)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 5)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  if (config.subsystem_repository) {
    const base = baseSpecs.repository;
    subsystemSpecs.repository = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 3)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 4)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 5)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  return subsystemSpecs;
};

// Generate warnings
const generateWarnings = (
  config: ConfigParams,
  siteDistribution: SiteDistributionResult,
  averageLoad: number
): string[] => {
  const warnings: string[] = [];
  
  // Check for sites with more than 10 DCs
  Object.entries(siteDistribution).forEach(([site, dcCount]) => {
    if (dcCount > 10) {
      warnings.push(`Site '${site}' has ${dcCount} DCs, which exceeds the recommended maximum of 10.`);
    }
  });
  
  // Check for excessive load per DC
  if (averageLoad > 10000) {
    warnings.push(`Average load of ${averageLoad} users per DC exceeds the recommended maximum of 10,000.`);
  }
  
  return warnings;
};

// Convert site distribution with percentages to absolute numbers
const convertSiteDistribution = (
  config: ConfigParams
): Record<string, number> => {
  const result: Record<string, number> = {};
  const siteDistributions = config.site_distributions;
  
  if (config.distribution_type === 'percentages') {
    // Convert percentages to absolute numbers
    let totalAllocated = 0;
    
    Object.entries(siteDistributions).forEach(([site, percentage]) => {
      const numericPercentage = typeof percentage === 'string' 
        ? parseFloat(percentage) 
        : Number(percentage);
      
      const userCount = Math.round((numericPercentage / 100) * config.total_users);
      result[site] = userCount;
      totalAllocated += userCount;
    });
    
    // Adjust for rounding errors
    const diff = config.total_users - totalAllocated;
    if (diff !== 0 && Object.keys(result).length > 0) {
      // Add/subtract the difference from the site with the most users
      const siteWithMostUsers = Object.entries(result)
        .sort(([, a], [, b]) => b - a)[0][0];
      
      result[siteWithMostUsers] += diff;
    }
  } else {
    // Use absolute numbers directly
    Object.entries(siteDistributions).forEach(([site, count]) => {
      result[site] = typeof count === 'string' ? parseInt(count, 10) : Number(count);
    });
  }
  
  return result;
};

// Calculate total aggregates
const calculateTotalAggregates = (
  siteDistribution: SiteDistributionResult,
  verticalSpecs: ResourceSpecs,
  subsystemSpecs: Record<string, SubsystemSpecs>
) => {
  // Calculate total number of DCs
  const totalDCs = Object.values(siteDistribution).reduce((sum, count) => sum + count, 0);
  
  // Calculate totals for DCs
  const totalDCRam = totalDCs * verticalSpecs.ram_gb;
  const totalDCCpu = totalDCs * verticalSpecs.cpu_cores;
  const totalDCDisk = totalDCs * verticalSpecs.disk_gb;
  
  // Calculate totals for subsystems
  let totalSubsystemRam = 0;
  let totalSubsystemCpu = 0;
  let totalSubsystemDisk = 0;
  
  Object.values(subsystemSpecs).forEach(specs => {
    totalSubsystemRam += specs.ram_gb;
    totalSubsystemCpu += specs.cpu_cores;
    totalSubsystemDisk += specs.disk_gb;
  });
  
  return {
    totalDCs,
    totalDCRam,
    totalDCCpu,
    totalDCDisk,
    totalSubsystemRam,
    totalSubsystemCpu,
    totalSubsystemDisk
  };
};

// Main calculation function
export const calculateInfrastructure = (config: ConfigParams): CalculationResults => {
  // Convert site distribution to absolute numbers
  const usersBySite = convertSiteDistribution(config);
  
  // Calculate total objects
  const totalObjects = calculateTotalObjects(config);
  
  // Calculate horizontal scaling (DCs per site)
  const siteDistribution = calculateDCsPerSite(config, usersBySite);
  
  // Calculate total DCs
  const totalDCs = Object.values(siteDistribution).reduce((sum, count) => sum + count, 0);
  
  // Calculate average load per DC
  const averageLoad = totalDCs > 0 ? config.total_users / totalDCs : 0;
  
  // Calculate vertical scaling (per-DC resources)
  const verticalSpecs = calculateVerticalScaling(config, totalObjects, averageLoad);
  
  // Calculate subsystem specs
  const subsystemSpecs = calculateSubsystemSpecs(config, config.total_users);
  
  // Generate warnings
  const warnings = generateWarnings(config, siteDistribution, averageLoad);
  
  // Calculate total aggregates
  const aggregates = calculateTotalAggregates(siteDistribution, verticalSpecs, subsystemSpecs);
  
  return {
    site_distribution: siteDistribution,
    vertical_specs: verticalSpecs,
    subsystem_specs: subsystemSpecs,
    average_load_per_dc: averageLoad,
    warnings,
    total_dcs: aggregates.totalDCs,
    total_dc_ram: aggregates.totalDCRam,
    total_dc_cpu: aggregates.totalDCCpu,
    total_dc_disk: aggregates.totalDCDisk,
    total_subsystem_ram: aggregates.totalSubsystemRam,
    total_subsystem_cpu: aggregates.totalSubsystemCpu,
    total_subsystem_disk: aggregates.totalSubsystemDisk
  };
};

// Function to generate default site distribution
export const generateDefaultSiteDistribution = (numSites: number): Record<string, string> => {
  const distribution: Record<string, string> = {};
  
  if (numSites <= 0) return distribution;
  
  // For single site, 100%
  if (numSites === 1) {
    distribution['Site 1'] = '100';
    return distribution;
  }
  
  // For multiple sites, distribute evenly
  const basePercentage = Math.floor(100 / numSites);
  let remaining = 100 - (basePercentage * numSites);
  
  for (let i = 1; i <= numSites; i++) {
    const siteName = `Site ${i}`;
    let sitePercentage = basePercentage;
    
    // Add remaining percentage to the first site
    if (i === 1 && remaining > 0) {
      sitePercentage += remaining;
    }
    
    distribution[siteName] = sitePercentage.toString();
  }
  
  return distribution;
};
