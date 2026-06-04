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
  const schema = React.useMemo(() => generateBreadcrumbSchema([
    { name: 'Početna', url: APP_CONFIG.BASE_URL },
    ...items.map(item => ({
      name: item.label,
      url: item.path ? `${APP_CONFIG.BASE_URL}${item.path}` : ''
    }))
  ].filter(i => i.url)), [items]);

  return (
    <>
      <JsonLd data={schema} />
      <div className="bg-background border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-8 py-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-hide" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link to="/" itemProp="item" className="text-white/40 hover:text-white transition-colors flex items-center">
                <span className="material-symbols-outlined text-sm mr-1">home</span>
                <span itemProp="name" className="sr-only">Početna</span>
              </Link>
              <span hidden itemProp="position">1</span>
            </li>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const position = index + 2;
              
              return (
                <li key={index} className="flex items-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span className="material-symbols-outlined text-white/20 text-xs mx-2" aria-hidden="true">chevron_right</span>
                  {isLast || !item.path ? (
                    <span itemProp="name" className="text-[10px] font-black text-white/60 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      to={item.path}
                      itemProp="item"
                      className="text-[10px] font-black text-white/40 hover:text-secondary uppercase tracking-widest transition-colors"
                    >
                      <span itemProp="name">{item.label}</span>
                    </Link>
                  )}
                  <span hidden itemProp="position">{position.toString()}</span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </>
  );
};
