import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { TiffinService } from './tiffin.service';

@Controller('tiffin')
export class TiffinController {
  constructor(private readonly tiffinService: TiffinService) {}

  @Post('mark')
  async markTiffin(
    @Body() body: { date: string; statuses: Record<string, boolean> },
  ) {
    return this.tiffinService.markTiffin(body.date, body.statuses);
  }

  @Get('summary/:month')
  async getSummary(@Param('month') month: string) {
    return this.tiffinService.getMonthlySummary(month);
  }
}
