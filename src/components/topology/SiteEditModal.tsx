
import { useState, useEffect } from 'react';
import { Site } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SiteEditModalProps {
  siteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SiteEditModal = ({ siteId, open, onOpenChange }: SiteEditModalProps) => {
  const { sites, updateSite, removeSite, dcs } = useTopologyStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#e6f2ff');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  
  // Get site data and DCs in this site
  const site = sites.find(s => s.id === siteId);
  const sitesDCs = dcs.filter(dc => dc.siteId === siteId);
  
  // Update form when site changes
  useEffect(() => {
    if (site) {
      setName(site.name || '');
      setColor(site.backgroundColor || '#e6f2ff');
      setWidth(site.width || 300);
      setHeight(site.height || 200);
    }
  }, [site]);
  
  const handleSave = () => {
    if (!siteId) return;
    
    // Ensure name is not empty
    const siteName = name.trim() ? name : `Site ${Math.floor(Math.random() * 1000)}`;
    
    updateSite(siteId, siteName, { 
      backgroundColor: color,
      // Do not update width/height here as they are managed by the resizer
    });
    
    onOpenChange(false);
  };
  
  const handleRemove = () => {
    if (!siteId) return;
    
    // Check if site has DCs
    if (sitesDCs.length === 0) {
      removeSite(siteId);
      onOpenChange(false);
    }
  };
  
  if (!site) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Site</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter site name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="site-color">Background Color</Label>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: color }}
              ></div>
              <Input
                id="site-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="site-width">Width</Label>
              <Input
                id="site-width"
                value={width}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="site-height">Height</Label>
              <Input
                id="site-height"
                value={height}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          
          {sitesDCs.length > 0 && (
            <div className="grid gap-2">
              <Label>Domain Controllers</Label>
              <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-auto">
                <ul className="space-y-1">
                  {sitesDCs.map(dc => (
                    <li key={dc.id} className="text-sm flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {dc.name || 'Unnamed DC'}
                      {dc.isKey && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">Key</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={sitesDCs.length > 0}
            className="mr-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Remove Site
          </Button>
          
          {sitesDCs.length > 0 && (
            <p className="text-xs text-amber-600 mr-auto">
              Cannot remove site with assigned DCs
            </p>
          )}
          
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SiteEditModal;
