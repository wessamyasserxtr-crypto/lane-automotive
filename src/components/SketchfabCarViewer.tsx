import { CarImage } from './CarImage';
import type { Vehicle3DAsset } from '../data/vehicle3d';

interface SketchfabCarViewerProps {
  image: string;
  carName: string;
  asset: Vehicle3DAsset;
  className?: string;
}

/** An actual interactive vehicle asset. The poster remains visible beneath the iframe while it loads. */
export function SketchfabCarViewer({ image, carName, asset, className = '' }: SketchfabCarViewerProps) {
  const modelPage = `https://sketchfab.com/3d-models/${asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${asset.uid}`;
  const modelUrl = `https://sketchfab.com/models/${asset.uid}/embed?autostart=1&ui_theme=dark&ui_hint=2&autospin=0.12`;
  return (
    <div className={`sketchfab-car-viewer ${className}`}>
      <CarImage src={image} alt={`${carName} — exterior photograph`} label={carName} className="sketchfab-car-poster" />
      <iframe
        className="sketchfab-car-frame"
        title={`Interactive 3D model of ${carName}`}
        src={modelUrl}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <a className="sketchfab-credit" href={modelPage} target="_blank" rel="noopener noreferrer">
        3D model: {asset.title} by {asset.creator} · {asset.license}
      </a>
    </div>
  );
}
