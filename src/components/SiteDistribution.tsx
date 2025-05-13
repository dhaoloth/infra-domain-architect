
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteDistributionResult } from '@/types/types';

interface SiteDistributionProps {
  distribution: SiteDistributionResult;
  totalDCs: number;
}

const SiteDistribution: React.FC<SiteDistributionProps> = ({ distribution, totalDCs }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(distribution).map(([site, count], index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{site}</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded"
                     style={{ width: `${Math.max((count / totalDCs) * 200, 24)}px` }}></div>
                <span className="text-sm font-bold">{count} DCs</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteDistribution;
