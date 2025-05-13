
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Edit, Plus, X } from 'lucide-react';
import useTopologyStore from '@/store/useTopologyStore';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const SitePanel = () => {
  const { sites, dcs, addSite, addDC, updateSite, removeSite, removeDC, updateDC } = useTopologyStore();
  
  // State for new site and DC
  const [newSiteName, setNewSiteName] = useState('');
  const [newDCName, setNewDCName] = useState('');
  const [newDCSiteId, setNewDCSiteId] = useState('');
  const [isKeyDC, setIsKeyDC] = useState(false);
  
  // State for editing site name
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingSiteName, setEditingSiteName] = useState('');
  
  const handleAddSite = () => {
    if (newSiteName.trim()) {
      addSite(newSiteName.trim());
      setNewSiteName('');
    }
  };
  
  const handleAddDC = () => {
    if (newDCName.trim() && newDCSiteId) {
      addDC(newDCName.trim(), newDCSiteId, isKeyDC);
      setNewDCName('');
      setIsKeyDC(false);
    }
  };
  
  const handleEditSite = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (site) {
      setEditingSiteId(siteId);
      setEditingSiteName(site.name);
    }
  };
  
  const handleSaveSite = () => {
    if (editingSiteId && editingSiteName.trim()) {
      updateSite(editingSiteId, editingSiteName.trim());
      setEditingSiteId(null);
      setEditingSiteName('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingSiteId(null);
    setEditingSiteName('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Topology Components</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="sites">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="dcs">Domain Controllers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sites" className="px-4 pt-4 space-y-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="new-site" className="text-xs">Add New Site</Label>
                <Input 
                  id="new-site"
                  placeholder="Site name" 
                  value={newSiteName} 
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button 
                onClick={handleAddSite} 
                size="sm" 
                disabled={!newSiteName.trim()}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Sites ({sites.length})</h3>
              {sites.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sites defined. Add a site to begin.</p>
              ) : (
                <ul className="space-y-2">
                  {sites.map((site) => {
                    const siteHasDCs = dcs.some(dc => dc.siteId === site.id);
                    
                    return (
                      <li key={site.id} className="border rounded-md p-2 text-sm">
                        {editingSiteId === site.id ? (
                          <div className="flex items-center space-x-2">
                            <Input 
                              value={editingSiteName} 
                              onChange={(e) => setEditingSiteName(e.target.value)}
                              className="h-7 text-xs flex-1"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={handleSaveSite} className="h-7 w-7 p-0">
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 p-0">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{site.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({dcs.filter(dc => dc.siteId === site.id).length} DCs)
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0" 
                                onClick={() => handleEditSite(site.id)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700" 
                                onClick={() => removeSite(site.id)}
                                disabled={siteHasDCs}
                                title={siteHasDCs ? "Remove all DCs first" : "Remove site"}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="dcs" className="px-4 pt-4 space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-dc" className="text-xs">Add New Domain Controller</Label>
                <Input 
                  id="new-dc"
                  placeholder="DC name" 
                  value={newDCName} 
                  onChange={(e) => setNewDCName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="new-dc-site" className="text-xs">Site</Label>
                <select 
                  id="new-dc-site"
                  value={newDCSiteId} 
                  onChange={(e) => setNewDCSiteId(e.target.value)}
                  className="w-full h-8 text-sm rounded-md border border-input px-3 py-1"
                  disabled={sites.length === 0}
                >
                  <option value="">Select site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new-dc-key" 
                  checked={isKeyDC} 
                  onCheckedChange={(checked) => setIsKeyDC(checked === true)}
                />
                <Label htmlFor="new-dc-key" className="text-xs">Key Domain Controller</Label>
              </div>
              
              <Button 
                onClick={handleAddDC} 
                size="sm" 
                disabled={!newDCName.trim() || !newDCSiteId || sites.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Domain Controller
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Domain Controllers ({dcs.length})</h3>
              {dcs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No domain controllers defined.</p>
              ) : (
                <ul className="space-y-2">
                  {dcs.map((dc) => {
                    const site = sites.find(s => s.id === dc.siteId);
                    return (
                      <li key={dc.id} className={`border rounded-md p-2 text-sm ${dc.isKey ? 'bg-amber-50 border-amber-300' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{dc.name}</span>
                            {dc.isKey && <span className="text-[10px] ml-2 bg-amber-400 text-white rounded px-1 py-0.5">KEY</span>}
                            <div className="text-xs text-muted-foreground">
                              Site: {site?.name || 'Unknown'}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700" 
                            onClick={() => removeDC(dc.id)}
                            title="Remove domain controller"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SitePanel;
