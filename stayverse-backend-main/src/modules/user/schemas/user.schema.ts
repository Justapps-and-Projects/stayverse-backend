import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import mongoose, { Document } from 'mongoose';
import { KycStatus, ONE_MINUTES, Roles } from 'src/common/constants/enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstname: string;

  @Prop({ required: true })
  lastname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ minlength: 10, required: true })
  phoneNumber: string;

  @Prop({
    type: String,
    required: false,
    validate: {
      validator: (v: string) => typeof v === 'string' && v.length > 0,
      message: 'Profile picture must be a valid string URL'
    }
  })
  profilePicture: string;

  @Prop({
    type: String,
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  kycStatus: KycStatus;

  @Prop({ required: true, select: false })
  @Exclude()
  passwordHash: string;

  @Prop({ required: false, default: 0, select: false })
  balance: number;

  @Prop({ required: false, default: null, select: false })
  customerCode: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, enum: Roles, default: Roles.USER })
  role: Roles;

  @Prop({ select: false })
  @Exclude()
  otp?: string;

  @Prop({ type: String, select: false })
  @Exclude()
  otpPurpose?: string;

  @Prop({ type: Date, select: false })
  @Exclude()
  pinExpires: Date;

  @Prop({ type: String, default: null })
  socketId?: string;

  @Prop({ type: Date, default: null })
  lastSeenAt?: Date;

  @Prop({ type: String, default: null, select: false })
  deviceToken?: string;

  @Prop({ type: Boolean, default: true })
  notificationsEnabled: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre(/^find/, function (next) {
    if (this instanceof mongoose.Query) {
        this.find({ isDeleted: { $ne: true } });
    }
    next();
});
