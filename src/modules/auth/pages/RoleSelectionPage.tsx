import { motion } from 'motion/react';
import { DashboardLayout } from '@/src/modules/core';
import RoleSelection from '@/src/modules/auth/components/RoleSelection';

export default function RoleSelectionPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <RoleSelection />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
