import { Controller, Get } from '@nestjs/common';
import { DoggyService } from '../service/doggy.service';
import { QueueService } from '../service/queue.service';
import { IdArray, blackGlasses } from 'src/core/array.helper';
import { json1 } from 'src/core/helpers/json1';
import { json2 } from 'src/core/helpers/json2';

@Controller('doggy')
export class DoggyController {
  url: string = 'https://doggy.market/inscription/';
  constructor(
    private readonly doggyService: DoggyService,
    private readonly queueService: QueueService,
  ) {}

  // @Get('/:id')
  // getTitle(@Param('id') id: string) {
  //   return this.doggyService.processID(id);
  // }

  @Get('/process')
  processAllIds() {
    const getArrayId = IdArray.map((id) => id.trim());
    const fullUrl = `${this.url}${getArrayId[0]}`;
    console.log(fullUrl);
    console.log(getArrayId[0]);
    return this.doggyService.processArrayIds(getArrayId);
  }

  @Get('/json')
  getPath() {
    const first = json1;
    const second = json2;
    return this.doggyService.mergeAttributes(first, second);
  }

  @Get('classify')
  getImageClassification() {}

  @Get('/excel')
  runToExcel() {
    return this.doggyService.moveJsonToExcel();
  }

  @Get('/edit')
  runEditHat() {
    const data = blackGlasses.map((v) => v.trim());
    // const g = purpleGlasses.map((id) => id.trim());
    return this.doggyService.replaceHat(data);
  }
}
