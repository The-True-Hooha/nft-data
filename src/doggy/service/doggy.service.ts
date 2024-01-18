import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { executablePath } from 'puppeteer-core';
import { runMeErrorHelper } from 'src/core/helpers/error.helpers';
import * as fs from 'fs';
import * as path from 'path';
import { QueueService } from './queue.service';
import { json1 } from '../../core/helpers/json1';
import { json2 } from '../../core/helpers/json2';

@Injectable()
export class DoggyService {
  url: string = 'https://doggy.market/inscription/';
  get_path = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  private readonly scrapedData: any[] = [];

  private readonly logger = new Logger(DoggyService.name);

  constructor(private queueService: QueueService) {}

  async processID(id: string) {
    try {
      this.logger.log('starting to scrape');
      const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true,
        ignoreHTTPSErrors: true,
        executablePath: this.get_path,
      });
      const addInscriptionId: string = `${this.url}${id}`;
      console.log(addInscriptionId);
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );
      // const delayDuration = 2 * 60 * 1000;

      // await new Promise((resolve) => setTimeout(resolve, delayDuration));
      page.setDefaultNavigationTimeout(2 * 60 * 1000);

      await Promise.all([
        page.waitForNavigation(),
        page.goto(addInscriptionId),
      ]);
      const titles = await page.$eval(
        '.dogescription-title',
        (elements: any) => {
          return elements.textContent.trim();
        },
      );
      const spanText = await page.evaluate(() => {
        const span: any = document.querySelector('span[data-v-fb227131]');
        return span ? span.textContent.trim() : null;
      });
      const imageUrl = await page.$eval(
        'img.dogescription-picture',
        (img: any) => img.getAttribute('src'),
      );
      if (titles && imageUrl) {
        const imageBuffer = await page.goto(imageUrl);
        const scriptDirectory = __dirname;
        const imageFolderPath = path.join(
          scriptDirectory,
          '..',
          '..',
          '..',
          'images',
        );
        await fs.promises.mkdir(imageFolderPath, { recursive: true });
        const filename = path.join(
          imageFolderPath,
          `${titles.replace(/\s+/g, '_')}.png`,
        );
        if (imageBuffer) {
          fs.writeFileSync(filename, await imageBuffer.buffer(), 'base64');
          console.log(`Image for ${id} saved as ${filename}`);
        } else {
          console.error(`Failed to download image for ${id}.`);
        }
      } else {
        console.error(`Title or image URL not found for ${id}.`);
      }
      await browser.close();

      const save2Json = {
        inscriptionId: id,
        name: titles,
        number: spanText,
        imageUrl: imageUrl,
        collectionSymbol: 'dogepunk',
        attributes: [
          {
            Hat: 'string',
            Eye: 'string',
            Mouth: 'string',
            Necklace: 'string',
            Shoes: 'string',
          },
        ],
      };
      this.scrapedData.push(save2Json);
      return save2Json;
    } catch (err) {
      return runMeErrorHelper(err);
    }
  }

  async processArrays(ids: string[]): Promise<void> {
    const totalId = ids.length;
    let value = 1;
    try {
      for (const id of ids) {
        this.logger.log(
          `added new id to queue for processing ${value++} of ${totalId}`,
        );
        this.queueService.enqueue(id);
      }
      while (!this.queueService.isEmpty()) {
        const id = this.queueService.dequeue();
        if (id) {
          // const delayDuration = 2 * 60 * 1000;
          // await new Promise((resolve) => setTimeout(resolve, delayDuration));
          await this.processID(id);
          this.logger.log(
            `processed ${id} left with ${this.queueService.getSize()} or in the array data ${totalId}`,
          );
        } else {
          this.logger.log(
            'the ids have finished processing, you can add more for processing',
          );
        }
      }
      const jsonFilePath = path.join(
        __dirname,
        '..',
        '..',
        'scraped_data.json',
      );
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(this.scrapedData, null, 2),
        'utf-8',
      );
    } catch (err) {
      console.log('we found an error here :error');
      return runMeErrorHelper(err);
    }
  }

  async processArrayIds(ids: string[]): Promise<void> {
    const totalId = ids.length;
    let processedCount = 0;
    try {
      for (const id of ids) {
        this.logger.log(
          `added new id to queue for processing ${id} of ${totalId}`,
        );
        this.queueService.enqueue(id);
      }

      while (!this.queueService.isEmpty()) {
        const id = this.queueService.dequeue();
        if (id) {
          // const delayDuration = 2 * 60 * 1000;
          // await new Promise((resolve) => setTimeout(resolve, delayDuration));
          try {
            await this.processID(id);
            processedCount++;
            this.logger.log(
              `processed ${processedCount} of ${totalId}, ${this.queueService.getSize()} left`,
            );
          } catch (err) {
            console.error(`Error processing ID ${id}:`, err);
            await this.saveScrapedDataToJson();
          }
        } else {
          this.logger.log(
            'the ids have finished processing, you can add more for processing',
          );
        }
      }
      await this.saveScrapedDataToJson();
    } catch (err) {
      console.log('we found an error here :error');
      return runMeErrorHelper(err);
    }
  }

  async saveScrapedDataToJson(): Promise<void> {
    const jsonFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'scraped_data2.json',
    );
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(this.scrapedData, null, 2),
      'utf-8',
    );
  }

  mergeAttributes(json1: any[], json2: any[]): any {
    try {
      json1.forEach((item1) => {
        const matchingNumber = item1['Number']?.replace('Shibescription ', '#');

        const matchingObject = json2.find(
          (item2) => item2.number === matchingNumber,
        );

        if (matchingObject) {
          matchingObject.attributes = {
            Hat: item1.Hat,
            Eye: item1.Eye,
            Mouth: item1.Mouth,
            Necklace: item1.Necklace,
            Shoes: item1.Shoes,
          };
        }
      });

      const jsonFilePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'nft-data.json',
      );
      fs.writeFileSync(jsonFilePath, JSON.stringify(json2, null, 2), 'utf-8');
      return {
        message: 'success'
      };
    } catch (err) {
      return runMeErrorHelper(err);
    }
  }
}
