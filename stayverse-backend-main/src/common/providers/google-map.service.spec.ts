import { ConfigService } from '@nestjs/config';
import { GoogleMapsService } from './google-map.service';

describe('Listing address resolution', () => {
  let service: GoogleMapsService;
  let geocode: jest.SpyInstance;
  beforeEach(() => {
    service = new GoogleMapsService(new ConfigService());
    geocode = jest.spyOn(service, 'reverseGeocode').mockResolvedValue({
      formattedAddress: 'Google address', placeId: 'selected-place',
      coordinates: { lat: 6.5, lng: 3.4 },
    });
  });
  it('saves a typed address without calling Google or inventing coordinates', async () => {
    await expect(service.resolveListingAddress({ address: '  12 Example Road, Lagos  ' }))
      .resolves.toEqual({ address: '12 Example Road, Lagos', placeId: null, location: null });
    expect(geocode).not.toHaveBeenCalled();
  });
  it('rejects an empty address when no place is selected', async () => {
    await expect(service.resolveListingAddress({ address: '  ', placeId: '' })).rejects.toThrow();
  });
  it('keeps the entered address when a selected place supplies coordinates', async () => {
    await expect(service.resolveListingAddress({ address: 'Flat 4, Example Road', placeId: 'selected-place' }))
      .resolves.toEqual({ address: 'Flat 4, Example Road', placeId: 'selected-place', location: { type: 'Point', coordinates: [3.4, 6.5] } });
  });
  it('still supports existing clients sending only a Place ID', async () => {
    expect((await service.resolveListingAddress({ placeId: 'selected-place' })).address).toBe('Google address');
  });
});
