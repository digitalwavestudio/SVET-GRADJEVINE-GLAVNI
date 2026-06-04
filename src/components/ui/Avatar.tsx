import React from 'react';

interface AvatarProps {
  name: string;
  url?: string | null;
  className?: string;
}

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
};

const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

export default function Avatar({ name, url, className = "w-10 h-10 rounded-full" }: AvatarProps) {
  if (url) {
    return <img src={url} alt={name} className={`${className} object-cover`} />;
  }

  return (
    <div 
      className={`${className} flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: stringToColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
