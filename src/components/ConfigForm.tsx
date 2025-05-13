import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigParams, SiteDistribution } from '@/types/types';
import { generateDefaultSiteDistribution } from '@/utils/calculationUtils';

interface ConfigFormProps {
  onSubmit: (config: ConfigParams) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onSubmit }) => {
  const [numSites, setNumSites] = useState<number>(1);
  const [siteNames, setSiteNames] = useState<string[]>(['Site 1']);
  const [distributionType, setDistributionType] = useState<'percentages' | 'absolute'>('percentages');
  const [siteDistributions, setSiteDistributions] = useState<SiteDistribution>({ 'Site 1': '100' });
  const [dcLoadModel, setDcLoadModel] = useState<'default' | 'custom'>('default');
  const [formData, setFormData] = useState<ConfigParams>({
    total_users: 1000,
    total_groups: 100,
    num_sites: 1,
    distribution_type: 'percentages',
    site_distributions: { 'Site 1': '100' },
    dc_load_model: 'default',
    users_per_dc_target: 2000,
    enable_gc: true,
    enable_sync: true,
    subsystem_monitoring: true,
    subsystem_journaling: false,
    subsystem_repository: false,
  });

  // Update site names and distributions when numSites changes
  useEffect(() => {
    const newSiteNames = Array.from({ length: numSites }, (_, i) => `Site ${i + 1}`);
    setSiteNames(newSiteNames);

    // Generate default distribution
    const defaultDistribution = generateDefaultSiteDistribution(numSites);
    setSiteDistributions(defaultDistribution);

    // Update form data
    setFormData(prev => ({
      ...prev,
      num_sites: numSites,
      site_distributions: defaultDistribution
    }));
  }, [numSites]);

  // Update form data when distributionType changes
  useEffect(() => {
    let newDistribution: SiteDistribution = {};
    
    if (distributionType === 'percentages') {
      // Convert absolute to percentages
      const totalUsers = formData.total_users;
      siteNames.forEach(site => {
        const currentValue = siteDistributions[site];
        const numericValue = typeof currentValue === 'string' 
          ? parseInt(currentValue, 10) 
          : Number(currentValue);
          
        if (distributionType === 'absolute' && totalUsers > 0) {
          // Convert from absolute to percentage
          const percentage = ((numericValue / totalUsers) * 100).toFixed(0);
          newDistribution[site] = percentage;
        } else {
          // Keep as is
          newDistribution[site] = currentValue || '0';
        }
      });
    } else {
      // Convert percentages to absolute
      const totalUsers = formData.total_users;
      siteNames.forEach(site => {
        const currentValue = siteDistributions[site];
        const numericValue = typeof currentValue === 'string' 
          ? parseFloat(currentValue) 
          : Number(currentValue);
          
        if (distributionType === 'percentages') {
          // Convert from percentage to absolute
          const absolute = Math.round((numericValue / 100) * totalUsers);
          newDistribution[site] = absolute.toString();
        } else {
          // Keep as is
          newDistribution[site] = currentValue || '0';
        }
      });
    }
    
    setSiteDistributions(newDistribution);
    setFormData(prev => ({
      ...prev,
      distribution_type: distributionType,
      site_distributions: newDistribution
    }));
  }, [distributionType]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Handle numeric inputs
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
      
      // If total_users changes, update site distributions for absolute values
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

  // Handle switch toggles
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'dc_load_model') {
      setDcLoadModel(value as 'default' | 'custom');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle site distribution changes
  const handleSiteDistributionChange = (site: string, value: string) => {
    const newDistributions = { ...siteDistributions, [site]: value };
    setSiteDistributions(newDistributions);
    
    setFormData(prev => ({
      ...prev,
      site_distributions: newDistributions
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="sites">Site Distribution</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>
        
        {/* Basic Settings Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Site Distribution Tab */}
        <TabsContent value="sites" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {siteNames.map((site, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`site_${index}`}>
                      {site} ({distributionType === 'percentages' ? '%' : 'Users'})
                    </Label>
                    <Input
                      id={`site_${index}`}
                      name={`site_${index}`}
                      type="text"
                      value={siteDistributions[site] || (distributionType === 'percentages' ? '0' : '0')}
                      onChange={(e) => handleSiteDistributionChange(site, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="default">Default</SelectItem>
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
                
                <div className="space-y-2">
                  <Label htmlFor="custom_dc_count">Custom DC Count (Optional)</Label>
                  <Input
                    id="custom_dc_count"
                    name="custom_dc_count"
                    type="number"
                    min="0"
                    value={formData.custom_dc_count || ''}
                    onChange={handleInputChange}
                    placeholder="Leave empty for automatic"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Subsystems</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="subsystem_monitoring"
                      checked={formData.subsystem_monitoring}
                      onCheckedChange={(checked) => handleSwitchChange('subsystem_monitoring', checked)}
                    />
                    <Label htmlFor="subsystem_monitoring">Monitoring</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="subsystem_journaling"
                      checked={formData.subsystem_journaling}
                      onCheckedChange={(checked) => handleSwitchChange('subsystem_journaling', checked)}
                    />
                    <Label htmlFor="subsystem_journaling">Journaling</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="subsystem_repository"
                      checked={formData.subsystem_repository}
                      onCheckedChange={(checked) => handleSwitchChange('subsystem_repository', checked)}
                    />
                    <Label htmlFor="subsystem_repository">Repository</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Button type="submit" className="w-full">Calculate Infrastructure</Button>
    </form>
  );
};

export default ConfigForm;
