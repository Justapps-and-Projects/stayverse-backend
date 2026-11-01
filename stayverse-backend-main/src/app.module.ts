import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import appConfig from './config/app.config';
import { AuthGuard } from './common/guards/auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UserModule } from './modules/user/user.module';
import { LoggerModule } from './common/utils/logger.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { ApartmentModule } from './modules/apartment/apartment.module';
// import { ChatModule } from './modules/chat/chat.module';
import { AgentModule } from './modules/agent/agent.module';
import { AppLoggerMiddleware } from './common/middlewares/app-logger.mw';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RidesModule } from './modules/rides/rides.module';
import { ChefModule } from './modules/chef/chef.module';
import { ProviderModule } from './common/providers/provider.module';
import { BookingModule } from './modules/booking/booking.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MetricModule } from './modules/metric/metric.module';
import { TestimonialModule } from './modules/testimonial/testimonial.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.url'),
      }),
      inject: [ConfigService]
    }),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
      inject: [ConfigService]
    }),
    ScheduleModule.forRoot({ cronJobs: process.env.ENABLE_SCHEDULED_JOBS !== 'false' }),
    ProviderModule,
    UserModule,
    FavoriteModule,
    ApartmentModule,
    // ChatModule,
    AgentModule,
    RidesModule,
    ChefModule,
    BookingModule,
    PaymentsModule,
    NotificationModule,
    MetricModule,
    TestimonialModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
