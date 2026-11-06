import React, { useState } from 'react';
import { Customer, Property, Device, StaffUser, Organization } from '../../lib/types';
import { VisualExplorationSwitcher, DesignVariant } from '../exploration/VisualExplorationSwitcher';
import { CustomersVariantA } from './CustomersVariantA';
import { CustomersVariantB } from './CustomersVariantB';

interface CustomersViewProps {
  currentOrg: Organization;
  customers: Customer[];
  properties: Property[];
  devices: Device[];
  currentUser: StaffUser;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onSelectCustomerDetail?: (customer: Customer) => void;
  designVariant?: DesignVariant;
  onChangeDesignVariant?: (variant: DesignVariant) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  currentOrg,
  customers,
  properties,
  devices,
  currentUser,
  onAddCustomer,
  onUpdateCustomer,
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
        activeScreenName="Danh Bạ Khách Hàng (Customers)"
      />

      {activeVariant === 'A' ? (
        <CustomersVariantA
          currentOrg={currentOrg}
          customers={customers}
          properties={properties}
          devices={devices}
          currentUser={currentUser}
          onAddCustomer={onAddCustomer}
          onUpdateCustomer={onUpdateCustomer}
        />
      ) : (
        <CustomersVariantB
          currentOrg={currentOrg}
          customers={customers}
          properties={properties}
          devices={devices}
          currentUser={currentUser}
          onAddCustomer={onAddCustomer}
          onUpdateCustomer={onUpdateCustomer}
        />
      )}
    </div>
  );
};
