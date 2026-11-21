export interface Vehicle3DAsset {
  uid: string;
  creator: string;
  license: string;
  title: string;
}

/** Exact model matches with a license that permits commercial use, subject to attribution. */
export const VEHICLE_3D_ASSETS: Record<string, Vehicle3DAsset> = {
  'jetour-t1': {
    uid: '55746452b0be4fe1bd31cbc6ef1c5fbb',
    creator: 'teenlin3',
    license: 'CC BY 4.0',
    title: 'Jetour T1',
  },
  'chery-tiggo-8-pro': {
    uid: '4a51e690819a4111a2055205a1009167',
    creator: 'Nieve5677',
    license: 'CC BY 4.0',
    title: 'Chery Tiggo 8 Pro',
  },
  'byd-seal': {
    uid: '96ec5c34852f4c3090a755d4445f5e98',
    creator: 'Nazh Design',
    license: 'CC BY 4.0',
    title: '2024 BYD Seal Performance AWD',
  },
};
