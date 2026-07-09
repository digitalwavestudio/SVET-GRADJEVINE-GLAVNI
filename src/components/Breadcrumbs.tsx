import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/src/constants/config';
import { generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import JsonLd from '@/src/components/JsonLd';

interface BreadcrumbsProps {
  items: {
    label: string;
    path?: string;
  }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = () => {
  return null;
};
