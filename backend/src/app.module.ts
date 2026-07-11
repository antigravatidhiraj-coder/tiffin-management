import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TiffinModule } from './tiffin/tiffin.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://antigravatidhiraj_db_user:dhirajtiffin@cluster0.roitows.mongodb.net/'),
    TiffinModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService], 
})
export class AppModule {}
