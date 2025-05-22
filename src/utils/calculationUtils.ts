import { 
  ConfigParams, 
  ResourceSpecs, 
  SubsystemSpecs, 
  CalculationResults,
  SiteDistributionResult,
  SubsystemDistribution
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
    },
    os_installation: {
      ram_gb: 4,
      cpu_cores: 2,
      disk_gb: 200,
      disk_type: 'SSD',
      network_mbps: 1000
    },
    printing: {
      ram_gb: 2,
      cpu_cores: 1,
      disk_gb: 50,
      disk_type: 'SSD',
      network_mbps: 1000
    },
    file_sharing: {
      ram_gb: 4,
      cpu_cores: 2,
      disk_gb: 500,
      disk_type: 'SSD',
      network_mbps: 1000
    },
    dhcp: {
      ram_gb: 2,
      cpu_cores: 1,
      disk_gb: 20,
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
  
  // Add the remaining subsystems
  if (config.subsystem_os_installation) {
    const base = baseSpecs.os_installation;
    subsystemSpecs.os_installation = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 3)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 4)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 5)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  if (config.subsystem_printing) {
    const base = baseSpecs.printing;
    subsystemSpecs.printing = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 2)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 3)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 4)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  if (config.subsystem_file_sharing) {
    const base = baseSpecs.file_sharing;
    subsystemSpecs.file_sharing = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 4)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 4)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 6)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  if (config.subsystem_dhcp) {
    const base = baseSpecs.dhcp;
    subsystemSpecs.dhcp = {
      ram_gb: Math.ceil(base.ram_gb * Math.min(scaleFactor, 2)),
      cpu_cores: Math.ceil(base.cpu_cores * Math.min(scaleFactor, 2)),
      disk_gb: Math.ceil(base.disk_gb * Math.min(scaleFactor, 3)),
      disk_type: base.disk_type,
      network_mbps: base.network_mbps
    };
  }
  
  return subsystemSpecs;
};

// Calculate subsystem distribution per site
const calculateSubsystemDistribution = (
  config: ConfigParams,
  siteNames: string[],
  usersBySite: Record<string, number>
): Record<string, SiteDistributionResult> => {
  const result: Record<string, SiteDistributionResult> = {};
  const totalUsers = config.total_users;
  
  // Define subsystems to process
  const subsystems = [
    { key: 'monitoring', enabled: config.subsystem_monitoring },
    { key: 'journaling', enabled: config.subsystem_journaling },
    { key: 'repository', enabled: config.subsystem_repository },
    { key: 'os_installation', enabled: config.subsystem_os_installation },
    { key: 'printing', enabled: config.subsystem_printing },
    { key: 'file_sharing', enabled: config.subsystem_file_sharing },
    { key: 'dhcp', enabled: config.subsystem_dhcp }
  ];
  
  for (const { key, enabled } of subsystems) {
    if (!enabled) continue;
    
    const subsystemKey = key as keyof typeof config.subsystem_distribution;
    const customDistribution = config.custom_subsystem_distribution && 
                              config.subsystem_distribution[subsystemKey];
    
    if (customDistribution) {
      // Use custom distribution if provided
      const siteDistribution: SiteDistributionResult = {};
      let remainingServers = customDistribution.total_servers;
      
      // First, ensure each site gets its specified distribution
      for (const site of siteNames) {
        const siteDistValue = customDistribution.site_distribution[site];
        if (siteDistValue !== undefined) {
          const serverCount = typeof siteDistValue === 'string' 
            ? parseInt(siteDistValue, 10) 
            : Number(siteDistValue);
          
          siteDistribution[site] = serverCount;
          remainingServers -= serverCount;
        } else {
          siteDistribution[site] = 0;
        }
      }
      
      // If there's a mismatch, adjust the site with most users
      if (remainingServers !== 0 && siteNames.length > 0) {
        const sortedSites = [...siteNames].sort((a, b) => 
          (usersBySite[b] || 0) - (usersBySite[a] || 0)
        );
        
        siteDistribution[sortedSites[0]] += remainingServers;
      }
      
      result[key] = siteDistribution;
    } else {
      // Auto-distribute based on user distribution
      const siteDistribution: SiteDistributionResult = {};
      
      // Default: 1 server per site with users, minimum 1 server
      let totalServers = 0;
      for (const site of siteNames) {
        const userCount = usersBySite[site] || 0;
        // Default logic: Each site with users gets at least one server
        const serverCount = userCount > 0 ? 1 : 0;
        siteDistribution[site] = serverCount;
        totalServers += serverCount;
      }
      
      // Ensure at least one server is deployed
      if (totalServers === 0 && siteNames.length > 0) {
        siteDistribution[siteNames[0]] = 1;
      }
      
      result[key] = siteDistribution;
    }
  }
  
  return result;
};

// Generate warnings
const generateWarnings = (
  config: ConfigParams,
  siteDistribution: SiteDistributionResult,
  averageLoad: number,
  subsystemDistribution?: Record<string, SiteDistributionResult>
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
  
  // Add subsystem warnings
  if (subsystemDistribution) {
    for (const [subsystem, distribution] of Object.entries(subsystemDistribution)) {
      const totalServers = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      
      if (totalServers === 0 && config[`subsystem_${subsystem}` as keyof ConfigParams]) {
        warnings.push(`Warning: ${subsystem.charAt(0).toUpperCase() + subsystem.slice(1)} subsystem is enabled but has no servers allocated.`);
      }
    }
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
  subsystemSpecs: Record<string, SubsystemSpecs>,
  subsystemDistribution?: Record<string, SiteDistributionResult>
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
  const totalSubsystemServers: Record<string, number> = {};
  
  if (subsystemDistribution) {
    Object.entries(subsystemDistribution).forEach(([key, distribution]) => {
      const specs = subsystemSpecs[key];
      if (specs) {
        const serverCount = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        totalSubsystemServers[key] = serverCount;
        
        totalSubsystemRam += specs.ram_gb * serverCount;
        totalSubsystemCpu += specs.cpu_cores * serverCount;
        totalSubsystemDisk += specs.disk_gb * serverCount;
      }
    });
  } else {
    // Fall back to old calculation if subsystemDistribution is not provided
    Object.entries(subsystemSpecs).forEach(([key, specs]) => {
      totalSubsystemRam += specs.ram_gb;
      totalSubsystemCpu += specs.cpu_cores;
      totalSubsystemDisk += specs.disk_gb;
      totalSubsystemServers[key] = 1; // Default to 1 server per subsystem
    });
  }
  
  return {
    totalDCs,
    totalDCRam,
    totalDCCpu,
    totalDCDisk,
    totalSubsystemRam,
    totalSubsystemCpu,
    totalSubsystemDisk,
    totalSubsystemServers
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
  
  // Calculate subsystem distribution
  const siteNames = Object.keys(usersBySite);
  const subsystemDistribution = calculateSubsystemDistribution(config, siteNames, usersBySite);
  
  // Generate warnings
  const warnings = generateWarnings(config, siteDistribution, averageLoad, subsystemDistribution);
  
  // Calculate total aggregates
  const aggregates = calculateTotalAggregates(siteDistribution, verticalSpecs, subsystemSpecs, subsystemDistribution);
  
  return {
    site_distribution: siteDistribution,
    vertical_specs: verticalSpecs,
    subsystem_specs: subsystemSpecs,
    subsystem_distribution: subsystemDistribution,
    average_load_per_dc: averageLoad,
    warnings,
    total_dcs: aggregates.totalDCs,
    total_dc_ram: aggregates.totalDCRam,
    total_dc_cpu: aggregates.totalDCCpu,
    total_dc_disk: aggregates.totalDCDisk,
    total_subsystem_ram: aggregates.totalSubsystemRam,
    total_subsystem_cpu: aggregates.totalSubsystemCpu,
    total_subsystem_disk: aggregates.totalSubsystemDisk,
    total_subsystem_servers: aggregates.totalSubsystemServers
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

// New helper function to generate default subsystem distribution
export const generateDefaultSubsystemDistribution = (
  numSites: number,
  siteNames: string[]
): Record<string, SubsystemDistribution> => {
  const result: Record<string, SubsystemDistribution> = {};
  
  // Define subsystems
  const subsystems = [
    'monitoring',
    'journaling',
    'repository',
    'os_installation',
    'printing',
    'file_sharing',
    'dhcp'
  ];
  
  // For each subsystem, create a default distribution
  for (const subsystem of subsystems) {
    const siteDistribution: Record<string, string> = {};
    
    // Default: one server per site, equally distributed
    for (let i = 0; i < numSites; i++) {
      const siteName = siteNames[i] || `Site ${i + 1}`;
      siteDistribution[siteName] = i === 0 ? '1' : '0';
    }
    
    result[subsystem] = {
      total_servers: 1,
      site_distribution: siteDistribution
    };
  }
  
  return result;
};
