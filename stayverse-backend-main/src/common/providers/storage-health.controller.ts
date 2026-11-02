import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../guards/auth.guard';
import { DOUploadService } from './digiital-ocean.service';

@Controller('health/storage')
export class StorageHealthController {
  constructor(private readonly storage: DOUploadService) {}

  @Public()
  @Get()
  check() {
    const result = this.storage.getStorageCheck();
    if (result.status === 'failed' || result.status === 'pending') throw new ServiceUnavailableException(result);
    return result;
  }
}
