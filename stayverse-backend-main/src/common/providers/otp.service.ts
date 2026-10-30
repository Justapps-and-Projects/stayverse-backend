import { randomInt } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { EmailService } from "./email.service";
import { otpEmailTemplate } from "./template/otp-email.template";
import { welcomeEmailTemplate } from './template/welcome-email.template'
import { EmailType } from "../constants/enum";
import { ConfigService } from "@nestjs/config";

interface EmailResponse {
    status: boolean;
    otp?: string;
    emailDelivered?: boolean;
}

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);

    constructor(private readonly emailService: EmailService, private configService: ConfigService) { }

    private completeWithFallback(email: string, otp?: string): EmailResponse {
        if (otp) {
            this.logger.warn(
                `Email delivery failed for ${email}; continuing with generated OTP for verification.`,
            );
            return { status: true, otp, emailDelivered: false };
        }
        return { status: false, emailDelivered: false };
    }

    async sendEmailMessage(email: string, name: string, type: EmailType): Promise<EmailResponse> {
        let subject: string;
        let message: string;
        let otp: string | undefined = undefined;
        const baseurl = this.configService.get<string>('app.base_url');
        if (type === EmailType.EMAIL_VERIFICATION) {
            otp = randomInt(100000, 1000000).toString();
            subject = "Email Confirmation";
            message = otpEmailTemplate(name, otp, 'verification', baseurl);
        } else if (type === EmailType.RESET_PASSWORD) {
            otp = randomInt(100000, 1000000).toString();
            subject = "Password Reset OTP";
            message = otpEmailTemplate(name, otp, 'reset', baseurl);
        } else {
            subject = "Welcome to Our Platform";
            message = welcomeEmailTemplate(name);
        }

        try {
            const result = await this.emailService.sendEmail(email, subject, message);
            if (!result.success) {
                const fallback = this.completeWithFallback(email, otp);
                if (!fallback.status) {
                    this.logger.warn(`Failed to send ${type} email to ${email}`);
                }
                return fallback;
            }
            return {
                status: true,
                otp,
                emailDelivered: result.delivered,
            };
        } catch (error) {
            this.logger.error(`Error sending ${type} email to ${email}: ${error.message}`);
            return this.completeWithFallback(email, otp);
        }
    }
}
