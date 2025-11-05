import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

const envFiles = process.env.NODE_ENV
  ? [`.env.${process.env.NODE_ENV}`, '.env']
  : ['.env'];

const envFilePath = Array.from(
  new Set(envFiles.flatMap((file) => [`../../${file}`, file]))
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath
    })
  ],
  providers: [AppConfigService],
  exports: [AppConfigService]
})
export class AppConfigModule {}
