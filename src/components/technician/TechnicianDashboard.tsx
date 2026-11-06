import React, { useState } from 'react';
import { Job } from '../../lib/types';
import { VisualExplorationSwitcher, DesignVariant } from '../exploration/VisualExplorationSwitcher';
import { DashboardVariantA } from './DashboardVariantA';
import { DashboardVariantB } from './DashboardVariantB';

interface TechnicianDashboardProps {
  jobs: Job[];
  onOpenDetails: (job: Job) => void;
  onQuickAction: (job: Job) => void;
  onOpenInvoice: (job: Job) => void;
  onCreateJobRequest: () => void;
  technicianName?: string;
  designVariant?: DesignVariant;
  onChangeDesignVariant?: (variant: DesignVariant) => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  jobs,
  onOpenDetails,
  onQuickAction,
  onOpenInvoice,
  onCreateJobRequest,
  technicianName = 'Trần Văn Hùng',
  designVariant: propVariant,
  onChangeDesignVariant,
}) => {
  const [localVariant, setLocalVariant] = useState<DesignVariant>('A');
  const activeVariant = propVariant || localVariant;
  const handleVariantChange = onChangeDesignVariant || setLocalVariant;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Visual Exploration Switcher Header */}
      <VisualExplorationSwitcher
        currentVariant={activeVariant}
        onChangeVariant={handleVariantChange}
        activeScreenName="Dashboard Hôm Nay (Today Jobs)"
      />

      {activeVariant === 'A' ? (
        <DashboardVariantA
          jobs={jobs}
          technicianName={technicianName}
          onOpenDetails={onOpenDetails}
          onQuickAction={onQuickAction}
          onOpenInvoice={onOpenInvoice}
          onCreateJobRequest={onCreateJobRequest}
        />
      ) : (
        <DashboardVariantB
          jobs={jobs}
          technicianName={technicianName}
          onOpenDetails={onOpenDetails}
          onQuickAction={onQuickAction}
          onOpenInvoice={onOpenInvoice}
          onCreateJobRequest={onCreateJobRequest}
        />
      )}
    </div>
  );
};
