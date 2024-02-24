/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { executablePath } from 'puppeteer-core';
import { runMeErrorHelper } from 'src/core/helpers/error.helpers';
import * as fs from 'fs';
import * as path from 'path';
import { QueueService } from './queue.service';
import * as ExcelJS from 'exceljs';
// import { json1 } from '../../core/helpers/json1';
// import { json2 } from '../../core/helpers/json2';
// import * as tf from '@tensorflow/tfjs-node';
// import * as mobilenet from '@tensorflow-models/mobilenet';

@Injectable()
export class DoggyService {
  url: string = 'https://doggy.market/inscription/';
  get_path = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  // private model: tf.GraphModel;
  private readonly scrapedData: any[] = [];

  private readonly logger = new Logger(DoggyService.name);

  constructor(private queueService: QueueService) {
    this.loadModel();
  }

  private async loadModel() {
    // Assuming you have your model loading logic here
    // this.model = await tf.loadGraphModel(
    //   'C:/Basty/CodeGen/nft-scrapper/model.json',
    // );
  }

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
        const span: any = document.querySelector('span[data-v-5edf691f]');
        return span ? span.textContent.trim() : null;
      });
      const imageUrl = await page.$eval(
        'img.dogescription-picture',
        (img: any) => img.getAttribute('src'),
      );
      
      //TODO: I am not saving images
      if (titles && imageUrl) {
        const imageBuffer = await page.goto(imageUrl);
        const scriptDirectory = __dirname;
        const imageFolderPath = path.join(
          scriptDirectory,
          '..',
          '..',
          '..',
          'doginals-images',
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
        collectionSymbol: 'doginalsdragon',
        attributes: {
          rank: 'string',
          wings: 'string',
          neck: 'string',
          mouth: 'string',
          shirt: 'string',
          eye: 'string',
        },
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
        'doginals.json',
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
          const startTime = performance.now(); // Record start time

          try {
            await this.processID(id);
            processedCount++;

            const endTime = performance.now(); // Record end time
            const elapsedTime = endTime - startTime; // Calculate elapsed time in milliseconds

            this.logger.log(
              `processed ${processedCount} of ${totalId}, ${this.queueService.getSize()} left. Time taken: ${elapsedTime.toFixed(2)} ms for ID ${id}`,
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
      console.log('we found an error here: ', err);
      return runMeErrorHelper(err);
    }
  }

  async saveScrapedDataToJson(): Promise<void> {
    const jsonFilePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'doginals.json',
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
        message: 'success',
      };
    } catch (err) {
      return runMeErrorHelper(err);
    }
  }

  async classifyImage(imagePath: string): Promise<any> {
    // Ensure the model is loaded before performing inference
    // if (!this.model) {
    //   // If the model is not loaded, attempt to load it
    //   await this.loadModel();
    // }

    // Load the image as a tensor
    fs.readFileSync(imagePath);
    // const imageTensor = tf.node.decodeImage(imageBuffer);

    // Preprocess the image
    // const processedImage = tf.div(imageTensor, 255.0);
    // const batchedImage = processedImage.expandDims(0);

    // Perform inference
    // const predictions = (await this.model.predict(batchedImage)) as tf.Tensor;
    // const topPredictions = Array.from(predictions.dataSync());

    // Postprocess the predictions (you may need to adjust this based on your model)
    // const result = topPredictions.map((confidence, index) => ({
    //   classIndex: index,
    //   confidence,
    // }));

    // // Return the result (you may want to return meaningful class labels)
    // return result;
  }

  async moveJsonToExcel() {
    console.log('hello');
    try {
      const jsonFilePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'dogePunk_data.json',
      );

      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
      console.log(jsonData);

      const workbook = new ExcelJS.Workbook();
      const excel = workbook.addWorksheet('DogePunk Rarity Checker Excel');

      excel.columns = [
        { header: 'InscriptionId', key: 'inscriptionId' },
        { header: 'ImageUrl', key: 'imageUrl' },
        { header: 'Name', key: 'name' },
        { header: 'Number', key: 'number' },
        { header: 'Hat', key: 'hat' },
        { header: 'Eye', key: 'eye' },
        { header: 'Mouth', key: 'mouth' },
        { header: 'Necklace', key: 'necklace' },
        { header: 'Shoes', key: 'shoes' },
      ];

      jsonData.forEach((item: any) => {
        let attributes: any = {};

        if (item.attributes && item.attributes.length > 0) {
          attributes = item.attributes[0];
        } else if (item.attributes) {
          attributes = item.attributes;
        }

        excel.addRow({
          inscriptionId: item.inscriptionId,
          imageUrl: item.imageUrl,
          name: item.name,
          number: item.number,
          hat: attributes?.Hat,
          eye: attributes?.Eye,
          mouth: attributes?.Mouth,
          necklace: attributes?.Necklace,
          shoes: attributes?.Shoes,
        });
      });

      const filePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'dogePunk_data.xlsx',
      );
      await workbook.xlsx.writeFile(filePath);
    } catch (err) {
      console.error('Error:', err);
      return runMeErrorHelper(err);
    }
  }

  async replaceHat(purpleHat: string[]): Promise<any> {
    try {
      const jsonFilePath = path.join(__dirname, '..', '..', '..', '_data.json');

      // Read the JSON file
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

      // Iterate through the purpleHat array
      purpleHat.forEach((number: string) => {
        // "name": "DogePunk #594",
        const matchNumber = `DogePunk #${number}`;
        // const matchNumber = `#${number}`;
        const matchingObject = jsonData.find((item: any) =>
          item.name.includes(matchNumber),
        );

        // // Find the object with the matching number
        // const matchingObject = jsonData.find(
        //   (item: any) => item.number === matchNumber,
        // );

        if (matchingObject) {
          // Update the attributes.Eye property
          matchingObject.attributes[0].Eye = 'black glasses 3';
        }
      });

      // Write the updated JSON data to a new file
      const newPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'dogePunk_data.json',
      );
      fs.writeFileSync(newPath, JSON.stringify(jsonData, null, 2), 'utf-8');

      return {
        message: 'success',
      };
    } catch (err) {
      // Handle errors
      console.error('Error:', err);
      return {
        error: 'An error occurred while processing the data.',
      };
    }
  }
}
