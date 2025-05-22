import { SiteDistribution } from './types';

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
  per_server?: {
    ram_gb: number;
    cpu_cores: number;
    disk_gb: number;
  };
}

export interface ConfigParams {
  total_users: number;
  total_groups: number;
  num_sites: number;
  distribution_type: 'percentages' | 'absolute';
  site_distributions: SiteDistribution;
  dc_load_model: 'default' | 'high_density' | 'custom';
  users_per_dc_target: number;
  custom_dc_count?: number;
  enable_gc: boolean;
  enable_sync: boolean;
  subsystem_monitoring: boolean;
  subsystem_journaling: boolean;
  subsystem_repository: boolean;
  subsystem_os_installation: boolean;
  subsystem_printing: boolean;
  subsystem_file_sharing: boolean;
  subsystem_dhcp: boolean;
  custom_subsystem_distribution: boolean;
  subsystem_distribution: {
    monitoring?: SubsystemDistribution;
    journaling?: SubsystemDistribution;
    repository?: SubsystemDistribution;
    os_installation?: SubsystemDistribution;
    printing?: SubsystemDistribution;
    file_sharing?: SubsystemDistribution;
    dhcp?: SubsystemDistribution;
  };
}

export interface SubsystemDistribution {
  total_servers: number;
  site_distribution: SiteDistribution;
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
    os_installation?: SubsystemSpecs;
    printing?: SubsystemSpecs;
    file_sharing?: SubsystemSpecs;
    dhcp?: SubsystemSpecs;
  };
  subsystem_distribution?: {
    monitoring?: SiteDistributionResult;
    journaling?: SiteDistributionResult;
    repository?: SiteDistributionResult;
    os_installation?: SiteDistributionResult;
    printing?: SiteDistributionResult;
    file_sharing?: SiteDistributionResult;
    dhcp?: SiteDistributionResult;
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
  total_subsystem_servers: {
    monitoring?: number;
    journaling?: number;
    repository?: number;
    os_installation?: number;
    printing?: number;
    file_sharing?: number;
    dhcp?: number;
  };
}