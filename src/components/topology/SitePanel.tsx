
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash, Network, Server } from 'lucide-react';
import useTopologyStore from '@/store/useTopologyStore';
import { useState } from 'react';

const SitePanel = () => {
  const { sites, dcs, addSite, updateSite, removeSite, addDC, removeDC, updateDC } = useTopologyStore();
  const [newSiteName, setNewSiteName] = useState('');
  const [newDCName, setNewDCName] = useState('');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [isKeyDC, setIsKeyDC] = useState(false);

  const handleAddSite = () => {
    if (newSiteName.trim()) {
      addSite(newSiteName.trim());
      setNewSiteName('');
    }
  };

  const handleAddDC = () => {
    if (newDCName.trim() && selectedSite) {
      addDC(newDCName.trim(), selectedSite, isKeyDC);
      setNewDCName('');
      setIsKeyDC(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network size={18} />
          Sites and Domain Controllers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add Site */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Add New Site</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Site Name"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddSite} size="sm">
                <Plus size={16} className="mr-1" /> Add Site
              </Button>
            </div>
          </div>

          {/* Site List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Existing Sites</h3>
            {sites.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No sites created yet.</p>
            ) : (
              <div className="space-y-3">
                {sites.map((site) => (
                  <div key={site.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        value={site.name}
                        onChange={(e) => updateSite(site.id, e.target.value)}
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSite(site.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                    
                    {/* DCs in this site */}
                    <div className="pl-2 border-l-2 border-gray-200 space-y-2">
                      <h4 className="text-xs font-medium flex items-center gap-1">
                        <Server size={14} /> 
                        Domain Controllers
                      </h4>
                      
                      {dcs.filter(dc => dc.siteId === site.id).map(dc => (
                        <div key={dc.id} className="flex items-center space-x-2 text-sm">
                          <Input
                            value={dc.name}
                            onChange={(e) => updateDC(dc.id, { name: e.target.value })}
                            className="flex-1 h-8 text-sm"
                          />
                          <div className="flex items-center space-x-1">
                            <Switch
                              id={`key-${dc.id}`}
                              checked={dc.isKey}
                              onCheckedChange={(checked) => updateDC(dc.id, { isKey: checked })}
                            />
                            <Label htmlFor={`key-${dc.id}`} className="text-xs">Key</Label>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => removeDC(dc.id)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      ))}
                      
                      {/* Add new DC to this site */}
                      <div className="flex items-center space-x-2 pt-1">
                        {site.id === selectedSite ? (
                          <>
                            <Input
                              placeholder="DC Name"
                              value={newDCName}
                              onChange={(e) => setNewDCName(e.target.value)}
                              className="flex-1 h-8 text-sm"
                            />
                            <div className="flex items-center space-x-1">
                              <Switch
                                id="new-dc-key"
                                checked={isKeyDC}
                                onCheckedChange={setIsKeyDC}
                              />
                              <Label htmlFor="new-dc-key" className="text-xs">Key</Label>
                            </div>
                            <Button
                              size="sm"
                              className="h-7"
                              onClick={handleAddDC}
                            >
                              <Plus size={14} />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 w-full"
                            onClick={() => setSelectedSite(site.id)}
                          >
                            <Plus size={14} className="mr-1" /> Add DC
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SitePanel;
