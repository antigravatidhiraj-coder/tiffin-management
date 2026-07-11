import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TiffinLog, TiffinLogDocument } from '../schemas/tiffin-log.schema';

@Injectable()
export class TiffinService {
  constructor(
    @InjectModel(TiffinLog.name)
    private tiffinLogModel: Model<TiffinLogDocument>,
  ) {}

  async markTiffin(date: string, statuses: Record<string, boolean>) {
    const promises = Object.entries(statuses).map(
      async ([userId, isPresent]) => {
        return this.tiffinLogModel.findOneAndUpdate(
          { userId, date },
          { userId, date, isPresent, price: 70 },
          { upsert: true, new: true },
        );
      },
    );

    return Promise.all(promises);
  }

  async getMonthlySummary(month: string) {
    // month format: YYYY-MM
    const regex = new RegExp(`^${month}`);

    const logs = await this.tiffinLogModel.find({
      date: { $regex: regex },
      isPresent: true,
    });

    const summary = logs.reduce((acc, log) => {
      if (!acc[log.userId]) {
        acc[log.userId] = { count: 0, total: 0, dates: [] };
      }
      acc[log.userId].count += 1;
      acc[log.userId].total += log.price;
      acc[log.userId].dates.push(log.date);
      return acc;
    }, {} as Record<string, { count: number; total: number; dates: string[] }>);

    return summary;
  }
}
