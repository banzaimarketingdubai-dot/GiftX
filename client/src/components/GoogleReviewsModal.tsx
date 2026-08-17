import React, { useEffect } from 'react';
import { Partner } from '../types';

interface GoogleReviewsModalProps {
  partner: Partner;
  onClose: () => void;
}

export const GoogleReviewsModal: React.FC<GoogleReviewsModalProps> = ({ partner, onClose }) => {
  useEffect(() => {
    const mapsUrl = partner.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(partner.name + ' ' + (partner.address || ''))}`;
    window.open(mapsUrl, '_blank');
    onClose();
  }, [partner, onClose]);

  return null;
};
