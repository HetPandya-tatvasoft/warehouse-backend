import { Module } from '@nestjs/common';
import { ProductSettingsModule } from './product-settings/product-settings.module';

@Module({
  imports: [ProductSettingsModule],
  exports: [ProductSettingsModule],
})
export class SettingsModule {}
