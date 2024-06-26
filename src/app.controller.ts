import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, Length, IsString } from 'class-validator';

export class ExtractProfilesDTO {
  @IsString()
  @IsNotEmpty()
  @Length(2, 256)
  url: string;
}

export class IContributorDTO {
  contributors: IExtractData[];
}

interface IExtractData {
  name: string;
  number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async getHello(
    @Body() extractProfilesDTO: ExtractProfilesDTO,
  ): Promise<void> {
    return await this.appService.screenShot(extractProfilesDTO);
  }

  @Post('extract')
  async extract(@Body() extractProfilesDTO: IContributorDTO): Promise<any[]> {
    return await this.appService.extractInformation(extractProfilesDTO);
  }

  @Get('profiles')
  async getText(): Promise<string[]> {
    return await this.appService.readTextFromImage();
  }
}
