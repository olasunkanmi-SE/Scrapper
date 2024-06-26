import * as Tesseract from 'tesseract.js';
export class ReadFromImage {
  async readTextFromImage(): Promise<string> {
    const recognise = await Tesseract.recognize('./src/0.png', 'eng', {
      logger: (info) => console.log(info),
    });
    return recognise.data.text;
  }
}
