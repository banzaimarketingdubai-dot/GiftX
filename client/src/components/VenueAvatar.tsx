import React, { useState } from 'react';
import { getVenueInitials } from '../utils/stockImages';

interface VenueAvatarProps {
  logoUrl?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const VenueAvatar: React.FC<VenueAvatarProps> = ({ logoUrl, name, className = '', style }) => {
  const [imgError, setImgError] = useState(false);
  const hasValidLogo = logoUrl && logoUrl.trim().length > 5 && !logoUrl.includes('placeholder') && !imgError;

  if (hasValidLogo) {
    return (
      <img
        src={logoUrl}
        alt={name || 'Venue'}
        onError={() => setImgError(true)}
        className={`object-cover bg-slate-950 ${className}`}
        style={style}
      />
    );
  }

  const initials = getVenueInitials(name);

  return (
    <div
      style={style}
      className={`rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 font-black flex items-center justify-center border-2 border-amber-300 shadow-xl select-none shrink-0 ${className}`}
    >
      <span className="leading-none tracking-wider text-slate-950 font-black">{initials}</span>
    </div>
  );
};
