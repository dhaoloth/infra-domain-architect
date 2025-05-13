
export interface SiteDistribution {
  [siteName: string]: number | string;
}

export interface ConfigParams {
  total_users: number;
  total_groups: number;
  num_sites: number;
  distribution_type: 'percentages' | 'absolute';
  site_distributions: SiteDistribution;
  dc_load_model: 'default' | 'custom';
  users_per_dc_target: number;
  custom_dc_count?: number;
  enable_gc: boolean;
  enable_sync: boolean;
  subsystem_monitoring: boolean;
  subsystem_journaling: boolean;
  subsystem_repository: boolean;
}

export interface ResourceSpecs {
  ram_gb: number;
  disk_gb: number;
  cpu_cores: number;
  cpu_freq_ghz: number;
  disk_type: string;
  network_mbps: number;
}

export interface SubsystemSpecs {
  ram_gb: number;
  cpu_cores: number;
  disk_gb: number;
  disk_type: string;
  network_mbps: number;
}

export interface SiteDistributionResult {
  [siteName: string]: number;
}

export interface CalculationResults {
  site_distribution: SiteDistributionResult;
  vertical_specs: ResourceSpecs;
  subsystem_specs: {
    monitoring?: SubsystemSpecs;
    journaling?: SubsystemSpecs;
    repository?: SubsystemSpecs;
  };
  average_load_per_dc: number;
  warnings: string[];
  total_dcs: number;
  total_dc_ram: number;
  total_dc_cpu: number;
  total_dc_disk: number;
  total_subsystem_ram: number;
  total_subsystem_cpu: number;
  total_subsystem_disk: number;
}
