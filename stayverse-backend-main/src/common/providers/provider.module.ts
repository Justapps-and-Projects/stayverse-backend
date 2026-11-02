import { StorageHealthController } from './storage-health.controller';
import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import { OtpService } from "./otp.service";
import { GoogleMapsService } from "./google-map.service";
import { DojahService } from "./dojah.service";
import { FirebaseService } from "./firebase.service";
import { DOUploadService } from "./digiital-ocean.service";

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const port = configService.get<number>("mail.port") || 587;
        const from = configService.get<string>("mail.from") || "no-reply@stayverse.com";
        return {
          transport: {
            host: configService.get<string>("mail.host"),
            port,
            secure: port === 465,
            auth: {
              user: configService.get<string>("mail.user"),
              pass: configService.get<string>("mail.pass"),
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
            ...(port === 587 ? { requireTLS: true } : {}),
          },
          defaults: {
            from: `"Stayverse" <${from}>`,
          },
        };
      },
    }),
  ],
  controllers: [StorageHealthController],
  providers: [EmailService, OtpService,GoogleMapsService,DojahService,FirebaseService,DOUploadService],
  exports: [EmailService, OtpService,GoogleMapsService,DojahService,FirebaseService,DOUploadService],
})
export class ProviderModule {}
