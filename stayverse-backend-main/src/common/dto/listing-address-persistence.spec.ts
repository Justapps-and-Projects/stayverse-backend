import { GoogleMapsService } from '../providers/google-map.service';
import { ConfigService } from '@nestjs/config';
import { ApartmentService } from '../../modules/apartment/services/apartment.service';
import { ChefService } from '../../modules/chef/services/chef.service';
import { RidesService } from '../../modules/rides/services/rides.service';

const id = '60f6f92b9e7a5e3a5c3f4b1c';
const address = 'Flat 4, 12 Example Road, Lagos';
describe.each([
  ['Apartment', ApartmentService, 'apartmentModel'],
  ['Chef', ChefService, 'chefModel'],
  ['Ride', RidesService, 'rideModel'],
] as const)('%s manual address persistence', (_name, Service, key) => {
  let service: any;
  let saved: any;
  let update: jest.Mock;
  beforeEach(() => {
    service = Object.create(Service.prototype);
    service.googleMapsService = new GoogleMapsService(new ConfigService());
    update = jest.fn().mockResolvedValue({ address });
    const Model: any = jest.fn().mockImplementation(data => {
      saved = data;
      return { save: jest.fn().mockResolvedValue(data) };
    });
    Model.findOneAndUpdate = update;
    Model.findByIdAndUpdate = update;
    service[key] = Model;
  });
  it('persists the manually entered address on create', async () => {
    await service.create({ address }, id, []);
    expect(saved).toMatchObject({ address, placeId: null, location: null });
  });
  it('clears old map coordinates on a manual address update', async () => {
    if (key === 'rideModel') await service.update(id, { address }, [], id);
    else await service.update(id, { address }, id);
    expect(update.mock.calls[0][1].$set).toMatchObject({ address, placeId: null, location: null });
  });
  it('leaves the existing address and coordinates alone for unrelated edits', async () => {
    if (key === 'rideModel') await service.update(id, {}, [], id);
    else await service.update(id, {}, id);
    expect(update.mock.calls[0][1].$set).not.toHaveProperty('location');
    expect(update.mock.calls[0][1].$set).not.toHaveProperty('address');
  });
});
