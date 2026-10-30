import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Roles } from 'src/common/constants/enum';
import { UserNotification } from '../interfaces/notification.interface';
import { FirebaseService } from 'src/common/providers/firebase.service';
import { EmailService } from 'src/common/providers/email.service';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/modules/user/schemas/user.schema';
import { BroadcastMessageDto } from '../dto/broadcast-message.dto';
import { CuratedMessage, CuratedMessageDocument } from '../schemas/curated-message.schema';
import { curatedMessageEmailTemplate } from 'src/common/providers/template/curated-message-email.template';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(CuratedMessage.name)
    private readonly curatedMessageModel: Model<CuratedMessageDocument>,
  ) {}

  async sendToUser(notification: UserNotification): Promise<boolean> {
    const { token, title, body, extras = {} } = notification;
    if (!token) {
      this.logger.debug('No device token provided');
      return false;
    }

    const sound = 'default';
    const message = {
      token,
      notification: { title, body },
      data: extras,
      android: {
        priority: 'high' as const,
        notification: {
          sound,
          channelId: sound,
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: `${sound}.WAV`,
          },
        },
      },
      webpush: {
        headers: { Urgency: 'high' },
      },
    };

    try {
      const response = await this.firebaseService.getMessaging().send(message);
      this.logger.log(`Notification sent to token: ${token}`);
      this.logger.debug(`Response: ${JSON.stringify(response)}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error sending notification: ${error.message}`);
      return false;
    }
  }

  private targetRoles(audience: BroadcastMessageDto['audience']) {
    const roleMap: Record<BroadcastMessageDto['audience'], Roles[]> = {
      user: [Roles.USER],
      agent: [Roles.AGENT],
      all: [Roles.USER, Roles.AGENT],
    };
    return roleMap[audience];
  }

  private buildAudienceFilter(role: Roles) {
    return role === Roles.AGENT
      ? { audience: { $in: ['agent', 'all'] }, status: 'sent' }
      : { audience: { $in: ['user', 'all'] }, status: 'sent' };
  }

  private roleAsAudience(role: Roles): 'user' | 'agent' {
    return role === Roles.AGENT ? 'agent' : 'user';
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async sendCuratedEmails(
    recipients: Array<{ email: string; firstname?: string }>,
    message: {
      title: string;
      body: string;
      imageUrl?: string;
      imagePosition?: 'before' | 'after';
    },
    concurrency = 8,
  ) {
    let emailSentCount = 0;
    let emailFailedCount = 0;

    for (let i = 0; i < recipients.length; i += concurrency) {
      const batch = recipients.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map(async (recipient) => {
          const html = curatedMessageEmailTemplate({
            recipientName: recipient.firstname,
            title: message.title,
            body: message.body,
            imageUrl: message.imageUrl,
            imagePosition: message.imagePosition,
          });
          return this.emailService.sendEmail(recipient.email, message.title, html);
        }),
      );
      emailSentCount += results.filter((result) => result.success).length;
      emailFailedCount += results.filter((result) => !result.success).length;
    }

    return { emailSentCount, emailFailedCount };
  }

  private ensureInteraction(
    curatedMessage: CuratedMessageDocument,
    userId: string,
    role: 'user' | 'agent',
  ) {
    const uid = String(userId);
    const existing = curatedMessage.interactions.find((item) => String(item.userId) === uid);
    if (existing) return existing;

    const created = {
      userId: new Types.ObjectId(userId),
      role,
      viewedAt: undefined,
      readAt: undefined,
      reaction: undefined,
      reactedAt: undefined,
    };
    curatedMessage.interactions.push(created as any);
    return curatedMessage.interactions[curatedMessage.interactions.length - 1];
  }

  private enrichForViewer(
    message: any,
    userId: string,
  ) {
    const interactions = Array.isArray(message.interactions) ? message.interactions : [];
    const own = interactions.find((item: any) => String(item.userId) === String(userId));
    const viewedCount = interactions.filter((item: any) => !!item.viewedAt).length;
    const readCount = interactions.filter((item: any) => !!item.readAt).length;
    const likeCount = interactions.filter((item: any) => item.reaction === 'like').length;
    const dislikeCount = interactions.filter((item: any) => item.reaction === 'dislike').length;

    return {
      ...message,
      metrics: {
        viewedCount,
        readCount,
        likeCount,
        dislikeCount,
      },
      viewerState: {
        viewed: !!own?.viewedAt,
        read: !!own?.readAt,
        reaction: own?.reaction ?? null,
      },
    };
  }

  private enrichForAdmin(message: any) {
    const interactions = Array.isArray(message.interactions) ? message.interactions : [];
    return {
      ...message,
      metrics: {
        viewedCount: interactions.filter((item: any) => !!item.viewedAt).length,
        readCount: interactions.filter((item: any) => !!item.readAt).length,
        likeCount: interactions.filter((item: any) => item.reaction === 'like').length,
        dislikeCount: interactions.filter((item: any) => item.reaction === 'dislike').length,
        pushSentCount: message.pushSentCount ?? 0,
        pushFailedCount: message.pushFailedCount ?? 0,
        emailSentCount: message.emailSentCount ?? 0,
        emailFailedCount: message.emailFailedCount ?? 0,
        emailEligibleCount: message.emailEligibleCount ?? 0,
      },
    };
  }

  private async dispatchCuratedMessage(curatedMessage: CuratedMessageDocument) {
    const targetRoles = this.targetRoles(curatedMessage.audience);
    const recipients = await this.userModel
      .find({ role: { $in: targetRoles }, isDeleted: { $ne: true } })
      .select('_id email firstname role +deviceToken notificationsEnabled')
      .lean();

    let pushSentCount = 0;
    let pushEligibleCount = 0;

    for (const recipient of recipients) {
      const canPush = !!recipient.notificationsEnabled && !!recipient.deviceToken;
      if (!canPush) continue;

      pushEligibleCount += 1;
      const pushSent = await this.sendToUser({
        token: recipient.deviceToken as string,
        title: curatedMessage.title,
        body: curatedMessage.body,
        extras: {
          ...(curatedMessage.extras || {}),
          type: 'curated_message',
          messageId: String(curatedMessage._id),
          audience: curatedMessage.audience,
          recipientRole: String(recipient.role),
          imageUrl: curatedMessage.imageUrl || '',
          imagePosition: curatedMessage.imagePosition || 'after',
        },
      });
      if (pushSent) pushSentCount += 1;
    }

    const emailRecipients = recipients
      .map((recipient) => ({
        email: String(recipient.email || '').trim().toLowerCase(),
        firstname: recipient.firstname ? String(recipient.firstname) : undefined,
      }))
      .filter((recipient) => this.isValidEmail(recipient.email));

    const emailEligibleCount = emailRecipients.length;
    const { emailSentCount, emailFailedCount } = await this.sendCuratedEmails(
      emailRecipients,
      {
        title: curatedMessage.title,
        body: curatedMessage.body,
        imageUrl: curatedMessage.imageUrl,
        imagePosition: curatedMessage.imagePosition,
      },
    );

    curatedMessage.status = 'sent';
    curatedMessage.deliveredAt = new Date();
    curatedMessage.pushSentCount = pushSentCount;
    curatedMessage.pushFailedCount = Math.max(0, pushEligibleCount - pushSentCount);
    curatedMessage.emailSentCount = emailSentCount;
    curatedMessage.emailFailedCount = emailFailedCount;
    curatedMessage.emailEligibleCount = emailEligibleCount;
    await curatedMessage.save();

    this.logger.log(
      `Curated message ${String(curatedMessage._id)} dispatched: push=${pushSentCount}/${pushEligibleCount}, email=${emailSentCount}/${emailEligibleCount}`,
    );

    return {
      messageId: String(curatedMessage._id),
      audience: curatedMessage.audience,
      totalEligible: recipients.length,
      sentCount: pushSentCount,
      failedCount: Math.max(0, pushEligibleCount - pushSentCount),
      emailSentCount,
      emailFailedCount,
      emailEligibleCount,
      scheduled: curatedMessage.sendMode === 'scheduled',
      status: curatedMessage.status,
    };
  }

  async broadcastCuratedMessage(payload: BroadcastMessageDto, createdBy?: string) {
    const sendMode = payload.sendMode ?? 'now';
    const imagePosition = payload.imagePosition ?? 'after';
    const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : undefined;
    if (sendMode === 'scheduled') {
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
        throw new BadRequestException('scheduledAt is required for scheduled messages');
      }
      if (scheduledAt.getTime() <= Date.now()) {
        throw new BadRequestException('scheduledAt must be in the future');
      }
    }

    const curatedMessage = await this.curatedMessageModel.create({
      audience: payload.audience,
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl?.trim() || undefined,
      imagePosition,
      sendMode,
      scheduledAt: sendMode === 'scheduled' ? scheduledAt : undefined,
      status: sendMode === 'scheduled' ? 'pending' : 'sent',
      deliveredAt: sendMode === 'scheduled' ? undefined : new Date(),
      extras: payload.extras ?? {},
      createdBy: createdBy || undefined,
      interactions: [],
    });

    if (sendMode === 'scheduled') {
      return {
        messageId: String(curatedMessage._id),
        audience: payload.audience,
        totalEligible: 0,
        sentCount: 0,
        failedCount: 0,
        emailSentCount: 0,
        emailFailedCount: 0,
        scheduled: true,
        scheduledAt,
        status: 'pending',
      };
    }

    return this.dispatchCuratedMessage(curatedMessage);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCuratedMessages() {
    const pending = await this.curatedMessageModel
      .find({
        sendMode: 'scheduled',
        status: 'pending',
        scheduledAt: { $lte: new Date() },
      })
      .sort({ scheduledAt: 1 })
      .limit(20);

    for (const message of pending) {
      try {
        await this.dispatchCuratedMessage(message);
      } catch (error) {
        this.logger.error(
          `Failed to dispatch scheduled curated message ${String(message._id)}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  async listCuratedMessagesForRole(role: Roles, page = 1, limit = 20, userId?: string) {
    const audienceFilter = this.buildAudienceFilter(role);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.curatedMessageModel
        .find(audienceFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.curatedMessageModel.countDocuments(audienceFilter),
    ]);

    if (userId) {
      for (const message of items) {
        const entry = this.ensureInteraction(message, userId, this.roleAsAudience(role));
        if (!entry.viewedAt) entry.viewedAt = new Date();
        await message.save();
      }
    }

    const enriched = items.map((item) =>
      userId ? this.enrichForViewer(item.toObject(), userId) : item.toObject(),
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + items.length < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async listCuratedMessagesForAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.curatedMessageModel
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.curatedMessageModel.countDocuments({}),
    ]);

    return {
      data: items.map((item) => this.enrichForAdmin(item)),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + items.length < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async markCuratedMessageRead(messageId: string, userId: string, role: Roles) {
    const message = await this.curatedMessageModel.findById(messageId);
    if (!message) throw new NotFoundException('Curated message not found');

    const entry = this.ensureInteraction(message, userId, this.roleAsAudience(role));
    const now = new Date();
    if (!entry.viewedAt) entry.viewedAt = now;
    entry.readAt = now;
    await message.save();

    return this.enrichForViewer(message.toObject(), userId);
  }

  async reactToCuratedMessage(messageId: string, userId: string, role: Roles, reaction: 'like' | 'dislike') {
    const message = await this.curatedMessageModel.findById(messageId);
    if (!message) throw new NotFoundException('Curated message not found');

    const entry = this.ensureInteraction(message, userId, this.roleAsAudience(role));
    const now = new Date();
    if (!entry.viewedAt) entry.viewedAt = now;
    if (!entry.readAt) entry.readAt = now;
    entry.reaction = reaction;
    entry.reactedAt = now;
    await message.save();

    return this.enrichForViewer(message.toObject(), userId);
  }
}
