import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigParams, SiteDistribution, SubsystemDistribution } from '@/types/types';
import { generateDefaultSiteDistribution, generateDefaultSubsystemDistribution } from '@/utils/calculationUtils';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus } from 'lucide-react';

interface ConfigFormProps {
  onSubmit: (config: ConfigParams) => void;
}

const SUBSYSTEM_LABELS = {
  monitoring: 'Monitoring (Zabbix)',
  journaling: 'Journaling (Syslog-NG)',
  repository: 'Software Repository (APT)',
  os_installation: 'OS Installation (TFTP + PXE)',
  printing: 'Printing (CUPS)',
  file_sharing: 'File Sharing (Samba)',
  dhcp: 'DHCP Server'
};

const ConfigForm: React.FC<ConfigFormProps> = ({ onSubmit }) => {
  const [numSites, setNumSites] = useState<number>(1);
  const [siteNames, setSiteNames] = useState<string[]>(['Site 1']);
  const [distributionType, setDistributionType] = useState<'percentages' | 'absolute'>('percentages');
  const [siteDistributions, setSiteDistributions] = useState<SiteDistribution>({ 'Site 1': '100' });
  const [dcLoadModel, setDcLoadModel] = useState<'default' | 'high_density' | 'custom'>('default');
  const [customSubsystemDist, setCustomSubsystemDist] = useState<boolean>(false);
  const [subsystemDistribution, setSubsystemDistribution] = useState<Record<string, SubsystemDistribution>>({});
  const [customDcDistribution, setCustomDcDistribution] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<ConfigParams>({
    total_users: 1000,
    total_groups: 100,
    num_sites: 1,
    distribution_type: 'percentages',
    site_distributions: { 'Site 1': '100' },
    dc_load_model: 'default',
    users_per_dc_target: 1500,
    enable_gc: true,
    enable_sync: true,
    subsystem_monitoring: true,
    subsystem_journaling: false,
    subsystem_repository: false,
    subsystem_os_installation: false,
    subsystem_printing: false,
    subsystem_file_sharing: false,
    subsystem_dhcp: false,
    custom_subsystem_distribution: false,
    subsystem_distribution: {}
  });

  // Update site names and distributions when numSites changes
  useEffect(() => {
    const newSiteNames = Array.from({ length: numSites }, (_, i) => `Site ${i + 1}`);
    setSiteNames(newSiteNames);

    const defaultDistribution = generateDefaultSiteDistribution(numSites);
    setSiteDistributions(defaultDistribution);

    setFormData(prev => ({
      ...prev,
      num_sites: numSites,
      site_distributions: defaultDistribution
    }));
    
    const defaultSubsystemDist = generateDefaultSubsystemDistribution(numSites, newSiteNames);
    setSubsystemDistribution(defaultSubsystemDist);
    
    setFormData(prev => ({
      ...prev,
      subsystem_distribution: defaultSubsystemDist
    }));
  }, [numSites]);

  // Update form data when distributionType changes
  useEffect(() => {
    let newDistribution: SiteDistribution = {};
    
    if (distributionType === 'percentages' && formData.distribution_type === 'absolute') {
      const totalUsers = formData.total_users;
      siteNames.forEach(site => {
        const currentValue = siteDistributions[site];
        const numericValue = typeof currentValue === 'string' 
          ? parseInt(currentValue, 10) 
          : Number(currentValue);
          
        if (totalUsers > 0) {
          const percentage = ((numericValue / totalUsers) * 100).toFixed(0);
          newDistribution[site] = percentage;
        } else {
          newDistribution[site] = '0';
        }
      });
    } else if (distributionType === 'absolute' && formData.distribution_type === 'percentages') {
      const totalUsers = formData.total_users;
      siteNames.forEach(site => {
        const currentValue = siteDistributions[site];
        const numericValue = typeof currentValue === 'string' 
          ? parseFloat(currentValue) 
          : Number(currentValue);
          
        const absolute = Math.round((numericValue / 100) * totalUsers);
        newDistribution[site] = absolute.toString();
      });
    } else {
      newDistribution = { ...siteDistributions };
    }
    
    setSiteDistributions(newDistribution);
    setFormData(prev => ({
      ...prev,
      distribution_type: distributionType,
      site_distributions: newDistribution
    }));
  }, [distributionType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numericValue = name === 'num_sites' 
        ? Math.max(1, parseInt(value, 10)) 
        : parseInt(value, 10);
      
      if (name === 'num_sites') {
        setNumSites(numericValue);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      
      if (name === 'total_users' && distributionType === 'absolute') {
        const newDistribution = { ...siteDistributions };
        setFormData(prev => ({
          ...prev,
          site_distributions: newDistribution
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    if (name === 'custom_subsystem_distribution') {
      setCustomSubsystemDist(checked);
      
      if (!checked) {
        const defaultSubsystemDist = generateDefaultSubsystemDistribution(numSites, siteNames);
        setSubsystemDistribution(defaultSubsystemDist);
        setFormData(prev => ({
          ...prev,
          subsystem_distribution: defaultSubsystemDist
        }));
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'dc_load_model') {
      const loadModel = value as 'default' | 'high_density' | 'custom';
      setDcLoadModel(loadModel);
      
      let usersPerDcTarget = 1500;
      if (loadModel === 'high_density') {
        usersPerDcTarget = 3000;
      } else if (loadModel === 'custom' && formData.users_per_dc_target) {
        usersPerDcTarget = formData.users_per_dc_target;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: loadModel,
        users_per_dc_target: usersPerDcTarget
      }));
    } else if (name === 'distribution_type') {
      setDistributionType(value as 'percentages' | 'absolute');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSiteNameChange = (index: number, value: string) => {
    const newSiteNames = [...siteNames];
    const oldSiteName = newSiteNames[index];
    newSiteNames[index] = value;
    setSiteNames(newSiteNames);
    
    const newSiteDistributions = { ...siteDistributions };
    newSiteDistributions[value] = newSiteDistributions[oldSiteName];
    delete newSiteDistributions[oldSiteName];
    setSiteDistributions(newSiteDistributions);
    
    setFormData(prev => ({
      ...prev,
      site_distributions: newSiteDistributions
    }));
  };

  const handleSiteDistributionChange = (site: string, value: string) => {
    const newDistributions = { ...siteDistributions, [site]: value };
    setSiteDistributions(newDistributions);
    
    setFormData(prev => ({
      ...prev,
      site_distributions: newDistributions
    }));
  };

  const handleSubsystemServerCountChange = (subsystem: string, count: number) => {
    const currentDistribution = subsystemDistribution[subsystem] || {
      total_servers: 1,
      site_distribution: {}
    };
    
    const newCount = Math.max(1, count);
    
    const updatedDistribution = {
      ...currentDistribution,
      total_servers: newCount
    };
    
    const newSubsystemDistribution = {
      ...subsystemDistribution,
      [subsystem]: updatedDistribution
    };
    
    setSubsystemDistribution(newSubsystemDistribution);
    
    setFormData(prev => ({
      ...prev,
      subsystem_distribution: newSubsystemDistribution
    }));
  };

  const handleSubsystemSiteDistributionChange = (subsystem: string, site: string, value: string) => {
    const currentDistribution = subsystemDistribution[subsystem] || {
      total_servers: 1,
      site_distribution: {}
    };
    
    const newSiteDistribution = {
      ...currentDistribution.site_distribution,
      [site]: value
    };
    
    const updatedDistribution = {
      ...currentDistribution,
      site_distribution: newSiteDistribution
    };
    
    const newSubsystemDistribution = {
      ...subsystemDistribution,
      [subsystem]: updatedDistribution
    };
    
    setSubsystemDistribution(newSubsystemDistribution);
    
    setFormData(prev => ({
      ...prev,
      subsystem_distribution: newSubsystemDistribution
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">General Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_users">Total Users</Label>
              <Input
                id="total_users"
                name="total_users"
                type="number"
                min="0"
                value={formData.total_users}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="total_groups">Total Groups</Label>
              <Input
                id="total_groups"
                name="total_groups"
                type="number"
                min="0"
                value={formData.total_groups}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <Separator />

          {/* Site Configuration */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Site Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_sites">Number of Sites</Label>
                <Input
                  id="num_sites"
                  name="num_sites"
                  type="number"
                  min="1"
                  value={numSites}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distribution_type">Distribution Type</Label>
                <Select
                  name="distribution_type"
                  value={distributionType}
                  onValueChange={(value) => handleSelectChange('distribution_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select distribution type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentages">Percentages</SelectItem>
                    <SelectItem value="absolute">Absolute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {siteNames.map((site, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor={`site_name_${index}`}>Site Name</Label>
                    <Input
                      id={`site_name_${index}`}
                      value={site}
                      onChange={(e) => handleSiteNameChange(index, e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`site_value_${index}`}>
                      User Share ({distributionType === 'percentages' ? '%' : 'Users'})
                    </Label>
                    <Input
                      id={`site_value_${index}`}
                      type="text"
                      value={siteDistributions[site] || (distributionType === 'percentages' ? '0' : '0')}
                      onChange={(e) => handleSiteDistributionChange(site, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* DC Configuration */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Domain Controller Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dc_load_model">DC Load Model</Label>
                <Select
                  name="dc_load_model"
                  value={dcLoadModel}
                  onValueChange={(value) => handleSelectChange('dc_load_model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select DC load model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (1500 users/DC)</SelectItem>
                    <SelectItem value="high_density">High Density (3000 users/DC)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dcLoadModel === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="users_per_dc_target">Users Per DC Target</Label>
                  <Input
                    id="users_per_dc_target"
                    name="users_per_dc_target"
                    type="number"
                    min="100"
                    value={formData.users_per_dc_target}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="custom_dc_distribution"
                checked={customDcDistribution}
                onCheckedChange={(checked) => setCustomDcDistribution(checked)}
              />
              <Label htmlFor="custom_dc_distribution">Custom DC Distribution</Label>
            </div>

            {customDcDistribution && (
              <div className="space-y-2">
                <Label htmlFor="custom_dc_count">Custom DC Count</Label>
                <Input
                  id="custom_dc_count"
                  name="custom_dc_count"
                  type="number"
                  min="1"
                  value={formData.custom_dc_count || ''}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable_gc"
                  checked={formData.enable_gc}
                  onCheckedChange={(checked) => handleSwitchChange('enable_gc', checked)}
                />
                <Label htmlFor="enable_gc">Enable Global Catalog</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable_sync"
                  checked={formData.enable_sync}
                  onCheckedChange={(checked) => handleSwitchChange('enable_sync', checked)}
                />
                <Label htmlFor="enable_sync">Enable Sync Service</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subsystems */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">Subsystems</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SUBSYSTEM_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={`subsystem_${key}`}
                    checked={formData[`subsystem_${key}` as keyof ConfigParams] as boolean}
                    onCheckedChange={(checked) => handleSwitchChange(`subsystem_${key}`, checked)}
                  />
                  <Label htmlFor={`subsystem_${key}`}>{label}</Label>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="custom_subsystem_distribution"
                checked={formData.custom_subsystem_distribution}
                onCheckedChange={(checked) => handleSwitchChange('custom_subsystem_distribution', checked)}
              />
              <Label htmlFor="custom_subsystem_distribution">Custom Subsystem Distribution</Label>
            </div>

            {formData.custom_subsystem_distribution && (
              <div className="space-y-6">
                {Object.entries(SUBSYSTEM_LABELS).map(([key, label]) => {
                  if (!formData[`subsystem_${key}` as keyof ConfigParams]) return null;
                  
                  const distribution = subsystemDistribution[key] || {
                    total_servers: 1,
                    site_distribution: {}
                  };
                  
                  return (
                    <div key={key} className="space-y-4">
                      <h4 className="text-sm font-semibold">{label}</h4>
                      
                      <div className="flex items-center space-x-4">
                        <Label htmlFor={`${key}_total_servers`}>Total Servers:</Label>
                        <div className="flex items-center space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSubsystemServerCountChange(
                              key, 
                              (distribution.total_servers || 1) - 1
                            )}
                            disabled={(distribution.total_servers || 1) <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-8 text-center">{distribution.total_servers || 1}</span>
                          
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSubsystemServerCountChange(
                              key, 
                              (distribution.total_servers || 1) + 1
                            )}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {siteNames.map((site, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Label className="w-24">{site}:</Label>
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={distribution.site_distribution[site] || '0'}
                              onChange={(e) => handleSubsystemSiteDistributionChange(key, site, e.target.value)}
                            />
                            <span className="text-sm text-muted-foreground">servers</span>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Button type="submit" className="w-full py-6 text-lg">Calculate Infrastructure</Button>
    </form>
  );
};

export default ConfigForm;