jest.mock('src/modules/booking/schemas/booking.schema', () => ({ Booking: class Booking {} }));
jest.mock('src/modules/favorite/schemas/favorite.schema', () => ({ Favorite: class Favorite {} }));
jest.mock('src/modules/apartment/schemas/apartment.schema', () => ({ Apartment: class Apartment {} }));
jest.mock('src/modules/rides/schemas/rides.schema', () => ({ Ride: class Ride {} }));
jest.mock('src/modules/chef/schemas/chef.schema', () => ({ Chef: class Chef {} }));
import { AgentService } from './agent.service';
import { EmailType, Roles } from '../../../common/constants/enum';

function fixture(user: any) {
  const select = jest.fn().mockResolvedValue(user);
  const users = { findOne: jest.fn().mockReturnValue({ select }) };
  const otp = { sendEmailMessage: jest.fn() };
  const service = new AgentService(users as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, otp as any, {} as any, {} as any);
  return { service, users, otp };
}

describe('agent authentication regressions', () => {
  it('uses the same normalized account lookup for login and reset', async () => {
    const { service, users } = fixture(null);
    await expect(service.login(' BRUCEWHITEHEAD17@gmail.com ', 'wrong')).rejects.toThrow('Agent not found');
    await expect(service.forgotPassword(' BRUCEWHITEHEAD17@gmail.com ')).rejects.toThrow('Agent not found');
    for (const [query] of users.findOne.mock.calls) {
      expect(query.role).toBe(Roles.AGENT);
      expect(query.email.test('brucewhitehead17@gmail.com')).toBe(true);
    }
  });
  it('does not claim a reset email was sent when delivery failed', async () => {
    const user = { email: 'a@example.com', firstname: 'A', save: jest.fn() };
    const { service, otp } = fixture(user);
    otp.sendEmailMessage.mockResolvedValue({ status: true, emailDelivered: false, otp: '123456' });
    await expect(service.forgotPassword(user.email)).rejects.toThrow('Failed to send');
    expect(user.save).not.toHaveBeenCalled();
  });
  it.each([null, new Date(0)])('rejects reset tokens without a live expiry (%s)', async (pinExpires) => {
    const user = { otp: '123456', otpPurpose: EmailType.RESET_PASSWORD, pinExpires, save: jest.fn() };
    const { service } = fixture(user);
    await expect(service.resetForgottenPassword({ email: 'a@example.com', otp: '123456', password: 'NewPassword1' })).rejects.toThrow('Invalid or expired');
    expect(user.save).not.toHaveBeenCalled();
  });
  it('rejects verification codes used as password-reset codes', async () => {
    const { service } = fixture({ otp: '123456', otpPurpose: EmailType.EMAIL_VERIFICATION, pinExpires: new Date(Date.now() + 60000) });
    await expect(service.resetForgottenPassword({ email: 'a@example.com', otp: '123456', password: 'NewPassword1' })).rejects.toThrow('Invalid or expired');
  });
  it('explains customer-account conflicts without claiming an agent exists', async () => {
    const { service, users } = fixture(null);
    users.findOne.mockResolvedValueOnce({ role: Roles.USER } as never);
    await expect(service.register({ email: 'a@example.com', phoneNumber: '+2348012345678' } as any)).rejects.toThrow('customer account');
  });
});
