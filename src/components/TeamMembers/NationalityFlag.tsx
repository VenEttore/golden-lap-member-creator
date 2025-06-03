import React from 'react';

interface NationalityFlagProps {
  country?: string;
}

export default function NationalityFlag({ country }: NationalityFlagProps) {
  if (!country) {
    return (
      <div style={{ 
        width: 32, 
        height: 22, 
        background: '#ece9e2', 
        borderRadius: 4, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#bbb', 
        fontWeight: 700, 
        fontSize: 16 
      }}>
        ?
      </div>
    );
  }

  const code = country.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={country}
      width={32}
      height={22}
      style={{ 
        borderRadius: 4, 
        border: '1px solid #ccc', 
        background: '#fff', 
        objectFit: 'cover', 
        display: 'block' 
      }}
    />
  );
} 