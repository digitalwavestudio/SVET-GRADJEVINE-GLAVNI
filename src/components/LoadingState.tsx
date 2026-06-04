import React from 'react';
import SkeletonCard from '@/src/components/SkeletonCard';

interface LoadingStateProps {
  count?: number;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  count = 6, 
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
}) => {
  return (
    <div className={className}>
      {[...Array(count)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default LoadingState;
