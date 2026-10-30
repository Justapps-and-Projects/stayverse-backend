import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";

const PLACEHOLDER_MAIL_VALUES = new Set([
    "test",
    "your_mailtrap_user",
    "your_mailtrap_pass",
    "your_mail_username",
    "your_mail_password",
]);

export interface EmailSendResult {
    success: boolean;
    delivered: boolean;
}

@Injectable()
export class EmailService implements OnModuleInit {
    private readonly logger = new Logger(EmailService.name);
    private readonly emailTimeoutMs: number;
    private mailConfigured = false;
    private brevoApiKey = "";
    private resendApiKey = "";
    private logOtpFallback = false;
    private fromAddress = "";

    constructor(
        private configService: ConfigService,
        private mailerService: MailerService
    ) {
        this.emailTimeoutMs = Number(
            this.configService.get<string>("mail.timeoutMs") || 15000
        );
    }

    onModuleInit() {
        const host = this.configService.get<string>("mail.host");
        const user = this.configService.get<string>("mail.user");
        const pass = this.configService.get<string>("mail.pass");
        const from = this.configService.get<string>("mail.from");
        this.brevoApiKey = this.configService.get<string>("mail.brevoApiKey") || "";
        this.resendApiKey = this.configService.get<string>("mail.resendApiKey") || "";
        this.logOtpFallback = this.configService.get('mail.logOtpFallback') !== false
            && this.configService.get('mail.logOtpFallback') !== 'false';
        this.fromAddress = from || user || "no-reply@stayverse.com";

        this.mailConfigured = Boolean(
            host &&
            user &&
            pass &&
            !PLACEHOLDER_MAIL_VALUES.has(user) &&
            !PLACEHOLDER_MAIL_VALUES.has(pass)
        );

        if (this.brevoApiKey) {
            this.logger.log("Brevo HTTP mail transport enabled");
            return;
        }

        if (this.resendApiKey) {
            this.logger.log("Resend HTTP mail transport enabled");
            return;
        }

        if (!this.mailConfigured) {
            this.logger.error(
                "No mail transport configured. Set BREVO_API_KEY, RESEND_API_KEY, or valid MAIL_HOST/MAIL_USER/MAIL_PASS."
            );
            if (this.logOtpFallback) {
                this.logger.warn(
                    "MAIL_LOG_OTP_FALLBACK=true: OTP emails will be logged server-side when mail is unavailable."
                );
            }
            return;
        }

        this.logger.log(
            `Mail transport configured (host=${host}, port=${this.configService.get<number>("mail.port")}, from=${this.fromAddress})`
        );
    }

    async sendEmail(to: string, subject: string, message: string): Promise<EmailSendResult> {
        if (this.brevoApiKey) {
            const delivered = await this.sendViaBrevo(to, subject, message);
            return { success: delivered, delivered };
        }

        if (this.resendApiKey) {
            const delivered = await this.sendViaResend(to, subject, message);
            return { success: delivered, delivered };
        }

        if (!this.mailConfigured) {
            if (this.logOtpFallback) {
                this.logger.warn(
                    `[MAIL_LOG_OTP_FALLBACK] "${subject}" for ${to}. Body preview: ${this.extractOtpPreview(message)}`
                );
                return { success: true, delivered: false };
            }
            this.logger.error(`Skipped sending "${subject}" to ${to}: mail is not configured`);
            return { success: false, delivered: false };
        }

        try {
            const mailOptions = {
                to,
                from: this.fromAddress,
                subject,
                html: message,
            };
            await Promise.race([
                this.mailerService.sendMail(mailOptions),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`Email timeout after ${this.emailTimeoutMs}ms`)),
                        this.emailTimeoutMs
                    )
                ),
            ]);
            this.logger.log(`Email sent to ${to}: ${subject}`);
            return { success: true, delivered: true };
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
            return { success: false, delivered: false };
        }
    }

    private async sendViaBrevo(to: string, subject: string, message: string): Promise<boolean> {
        try {
            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "api-key": this.brevoApiKey,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    sender: { email: this.fromAddress, name: "Stayverse" },
                    to: [{ email: to }],
                    subject,
                    htmlContent: message,
                }),
            });

            if (!response.ok) {
                const body = await response.text();
                this.logger.error(`Brevo API failed (${response.status}): ${body}`);
                return false;
            }

            this.logger.log(`Brevo email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            this.logger.error(`Brevo send failed for ${to}: ${error.message}`, error.stack);
            return false;
        }
    }

    private async sendViaResend(to: string, subject: string, message: string): Promise<boolean> {
        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: this.fromAddress.includes("@")
                        ? `Stayverse <${this.fromAddress}>`
                        : this.fromAddress,
                    to: [to],
                    subject,
                    html: message,
                }),
            });

            if (!response.ok) {
                const body = await response.text();
                this.logger.error(`Resend API failed (${response.status}): ${body}`);
                return false;
            }

            this.logger.log(`Resend email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            this.logger.error(`Resend send failed for ${to}: ${error.message}`, error.stack);
            return false;
        }
    }

    private extractOtpPreview(html: string): string {
        const match = html.match(/\b(\d{6})\b/);
        return match ? `OTP=${match[1]}` : html.slice(0, 120);
    }
}
