import React from 'react';
import { motion } from 'motion/react';
import { AdminStatsGrid } from '@/src/modules/admin/components/admin/AdminStatsGrid';
import { AdminLaunchGuard } from '@/src/modules/admin/components/admin/AdminLaunchGuard';
import { AdminCharts } from '@/src/modules/admin/components/admin/AdminCharts';
import { HousekeepingStatus } from '@/src/modules/admin/components/admin/HousekeepingStatus';

export interface SectorData {
  name: string;
  value: number;
}

export interface RegistrationData {
  date: string;
  count: number;
}

interface OverviewTabProps {
  dynamicSectorData: SectorData[];
  dynamicRegistrationData: RegistrationData[];
  launchMode: boolean;
  toggleLaunchMode: () => void;
  isUpdatingLaunchMode: boolean;
}

export function OverviewTab({
  dynamicSectorData,
  dynamicRegistrationData,
  launchMode,
  toggleLaunchMode,
  isUpdatingLaunchMode
}: OverviewTabProps) {
  return (
    <motion.div 
      key="overview"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      {/* 1. Global Metrics (Consumes Zustand internally) */}
      <AdminStatsGrid />

      {/* 2. Launch Guard Control */}
      <AdminLaunchGuard 
        launchMode={launchMode} 
        toggleLaunchMode={toggleLaunchMode} 
        isUpdatingLaunchMode={isUpdatingLaunchMode} 
      />

      {/* 3. Housekeeping Status */}
      <HousekeepingStatus />

      {/* 4. Data Visualization */}
      <AdminCharts 
        dynamicRegistrationData={dynamicRegistrationData} 
        dynamicSectorData={dynamicSectorData} 
      />
    </motion.div>
  );
}
