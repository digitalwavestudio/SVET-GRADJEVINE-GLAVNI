import React from 'react';
import { motion } from 'motion/react';
import { Skeleton } from '@/src/components/ui/Skeleton';

export default function DashboardSkeleton() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
  };

  return (
    <motion.div 
      className="space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={itemVariants} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 min-h-[400px] flex flex-col">
             <Skeleton className="w-1/3 h-4 mb-10" variant="text" />
             <div className="space-y-6 flex-1">
                <Skeleton className="h-24 w-full rounded-[10px]" />
                <Skeleton className="h-24 w-full rounded-[10px]" />
                <Skeleton className="h-24 w-full rounded-[10px]" />
             </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 min-h-[300px]">
             <Skeleton className="w-1/4 h-4 mb-8" variant="text" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-32 w-full rounded-[10px]" />
                <Skeleton className="h-32 w-full rounded-[10px]" />
             </div>
          </motion.div>
        </div>
        <div className="space-y-8">
           {[1, 2].map(i => (
             <motion.div key={i} variants={itemVariants} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 h-[200px]">
               <Skeleton className="w-1/2 h-3 mb-6" variant="text" />
               <Skeleton className="w-20 h-10 mb-4" variant="text" />
               <Skeleton className="w-2/3 h-2" variant="text" />
             </motion.div>
           ))}
           <motion.div variants={itemVariants} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 min-h-[350px]">
             <Skeleton className="w-1/2 h-4 mb-8" variant="text" />
             <div className="space-y-6">
               {[1, 2, 3].map(j => (
                 <div key={j} className="flex gap-4">
                   <Skeleton className="w-12 h-12 rounded-[10px]" />
                   <div className="flex-1 space-y-3">
                     <Skeleton className="w-full h-3" variant="text" />
                     <Skeleton className="w-1/2 h-2" variant="text" />
                   </div>
                 </div>
               ))}
             </div>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
