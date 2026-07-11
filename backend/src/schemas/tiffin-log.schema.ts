import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TiffinLogDocument = TiffinLog & Document;

@Schema({ timestamps: true })
export class TiffinLog {
  @Prop({ required: true })
  userId: string; // 1, 2, or 3

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ required: true })
  isPresent: boolean;

  @Prop({ required: true, default: 70 })
  price: number;
}

export const TiffinLogSchema = SchemaFactory.createForClass(TiffinLog);
