import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { model } from 'mongoose';
import { CreateChefDto, UpdateChefDto } from '../../modules/chef/dto/chef.dto';
import { CreateApartmentDto, UpdateApartmentDto } from '../../modules/apartment/dto/apartment.dto';
import { CreateRideDto, UpdateRideDto } from '../../modules/rides/dto/rides.dto';
import { ChefSchema } from '../../modules/chef/schemas/chef.schema';
import { ApartmentSchema } from '../../modules/apartment/schemas/apartment.schema';
import { RideSchema } from '../../modules/rides/schemas/rides.schema';

const addressErrors = async (type: any, input: object) => {
  const dto = plainToInstance(type, input) as object;
  return (await validate(dto, { whitelist: true })).filter(e => ['address', 'placeId'].includes(e.property));
};
describe.each([CreateChefDto, CreateApartmentDto, CreateRideDto])('%s address validation', (Dto) => {
  it('accepts manual text without a Place ID', async () => {
    expect(await addressErrors(Dto, { address: '12 Example Road, Lagos', placeId: '' })).toHaveLength(0);
  });
  it('accepts legacy Place ID requests', async () => {
    expect(await addressErrors(Dto, { placeId: 'selected-place' })).toHaveLength(0);
  });
  it.each([{}, { address: '   ' }, { address: null }, { address: 123 }])('rejects missing or invalid address: %p', async input => {
    expect((await addressErrors(Dto, input)).length).toBeGreaterThan(0);
  });
});
describe.each([UpdateChefDto, UpdateApartmentDto, UpdateRideDto])('%s address updates', (Dto) => {
  it('accepts a manual address and rejects whitespace', async () => {
    expect(await addressErrors(Dto, { address: 'New address, Lagos' })).toHaveLength(0);
    expect((await addressErrors(Dto, { address: '  ' })).length).toBeGreaterThan(0);
    expect(await addressErrors(Dto, {})).toHaveLength(0);
  });
});
describe.each([['chef', ChefSchema], ['apartment', ApartmentSchema], ['ride', RideSchema]] as const)('%s address storage', (name, schema) => {
  it('supports missing coordinates without a phantom GeoJSON point', () => {
    const Model = model('ManualAddress_' + name, schema as any);
    const doc = new Model({ address: '12 Example Road, Lagos' });
    expect(doc.toObject().location).toBeNull();
    const errors = doc.validateSync()?.errors ?? {};
    expect(Object.keys(errors).filter(k => k === 'placeId' || k.startsWith('location'))).toEqual([]);
  });
});
