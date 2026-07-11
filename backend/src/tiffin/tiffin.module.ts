import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TiffinController } from './tiffin.controller';
import { TiffinService } from './tiffin.service';
import { TiffinLog, TiffinLogSchema } from '../schemas/tiffin-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TiffinLog.name, schema: TiffinLogSchema },
    ]),
  ],
  controllers: [TiffinController],
  providers: [TiffinService],
})
export class TiffinModule {}
