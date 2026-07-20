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

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const schemaItems = items.map((item) => ({
    name: item.label,
    url: item.path ? `${APP_CONFIG.BASE_URL}${item.path}` : APP_CONFIG.BASE_URL,
  }));

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(schemaItems)} />
      <nav aria-label="Breadcrumb" className="w-full overflow-x-auto whitespace-nowrap scrollbar-none">
        <ol className="flex items-center gap-1.5 text-xs font-medium text-white/40 py-2 px-1">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="material-symbols-outlined text-[10px] text-white/20">chevron_right</span>
                )}
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="hover:text-secondary transition-colors duration-200 truncate max-w-[180px]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-white/70 font-semibold truncate max-w-[200px]' : 'truncate max-w-[180px]'}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
