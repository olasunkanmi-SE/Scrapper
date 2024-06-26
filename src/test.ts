import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import fs from 'fs';
import { ExtractProfilesDTO, IContributorDTO } from './app.controller';
import { Page } from 'puppeteer';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class AppService {
  //Bright data proxy
  async initialize(): Promise<Page> {
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      userDataDir:
        'Users/olasunkanmioyinlola/Library/Application Support/Google/Chrome/Default',
    });
    try {
      return await browser.newPage();
    } catch (error) {
      console.log(error);
    }
  }

  async screenShot(props: ExtractProfilesDTO): Promise<any> {
    const page = await this.initialize();
    try {
      page.setDefaultNavigationTimeout(10 * 60 * 1000);
      await Promise.all([page.waitForNavigation(), page.goto(props.url)]);
      await page.waitForTimeout(6000);
      await page.pdf({ path: 'y.pdf' });
      // await page.screenshot({ path: 'contributors.png' });
    } catch (error) {
      console.error('an error coccured', error);
    } finally {
      await page.close();
    }
  }

  async extractInformation(contributorList: IContributorDTO) {
    const page = await this.initialize();
    let profile;
    const profiles = [];
    for (const contributor of contributorList.contributors) {
      if (!contributor) {
        break;
      }
      // const contributorIndex = contributorList.indexOf(contributor);
      await Promise.all([
        page.waitForNavigation(),
        page.goto(
          `https://www.linkedin.com/in/oyinlola-olasunkanmi-raymond-71b6b8aa/`,
        ),
      ]);

      try {
        await page.waitForSelector('.ph5', {
          timeout: 5000,
        });
      } catch (error) {
        console.error(`Could not find selector within timeout for URL`);
        continue;
      }
      // const x = await page.waitForSelector('.js-profile-editable-replace');
      // console.log('x', x);
      // if (!x) {
      //   continue;
      // }
      const profileInfo = await page.$('.ph5');

      let name;
      const nameElement = await profileInfo.$(
        '.text-heading-xlarge inline t-24 v-align-middle break-words',
      );
      if (nameElement) {
        name = await profileInfo.$eval(
          '.text-heading-xlarge inline t-24 v-align-middle break-wordse',
          (nameElement) => nameElement.textContent.trim(),
        );
      } else {
        undefined;
      }

      let userName;
      const userNameElement = await profileInfo.$('.vcard-username');
      if (userNameElement) {
        userName = await profileInfo.$eval(
          '.vcard-username',
          (usernameElement) => usernameElement.textContent.trim(),
        );
      } else {
        userName = undefined;
      }

      let bio;
      const bioElement = await profileInfo.$('.js-user-profile-bio');
      if (bioElement) {
        bio = await profileInfo.$eval('.js-user-profile-bio', (bioElement) =>
          bioElement.textContent.trim(),
        );
      } else {
        bio = undefined;
      }

      let followerCount;
      const followerCountElement = await profileInfo.$(
        'a[href$="?tab=followers"] span.text-bold',
      );
      if (followerCountElement) {
        followerCount = await profileInfo.$eval(
          'a[href$="?tab=followers"] span.text-bold',
          (countElement) => countElement.textContent.trim(),
        );
      } else {
        followerCount = undefined;
      }

      let followingCount;
      const followingCountElement = await profileInfo.$(
        'a[href$="?tab=following"] span.text-bold',
      );
      if (followingCountElement) {
        followingCount = await profileInfo.$eval(
          'a[href$="?tab=following"] span.text-bold',
          (countElement) => countElement.textContent.trim(),
        );
      } else {
        followingCount = undefined;
      }

      let personalWebsite;
      const websiteElement = await profileInfo.$(
        'a[rel="nofollow me"].Link--primary',
      );
      if (websiteElement) {
        personalWebsite = await profileInfo.$eval(
          'a[rel="nofollow me"].Link--primary',
          (websiteElement) => (websiteElement as HTMLAnchorElement).href,
        );
      } else {
        personalWebsite = undefined;
      }

      let organizations;
      const orgElement = await profileInfo.$(
        '.mb-1 mr-1 a[data-hovercard-type="organization"]',
      );
      if (orgElement) {
        organizations = await page.$$eval(
          '.mb-1 mr-1 a[data-hovercard-type="organization"]',
          (orgLinks) => orgLinks.map((link) => link.href),
        );
      } else {
        organizations = undefined;
      }

      profile = {
        name,
        userName,
        bio,
        followerCount,
        followingCount,
        personalWebsite,
        organizations,
      };
      console.log(profile);
      profiles.push(profile);
    }
    console.log(profiles);
    console.log('...writing profiles to file');
    this.writeObjectToFile(profiles, 'output.json');
    return profiles;
  }

  /**
   * Writes a JavaScript object to a file. *
   * Note: The JSON.stringify method is used to convert the object to a JSON string.
   * This string is then written to the specified file using fs.writeFileSync.
   * @param {Record} data - The object to write to the file
   * @param {string} filePath - The path to the file where the object will be written
   * */
  writeObjectToFile(data: Record<string, any>, filePath: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString);
    console.log(`Object has been written to ${filePath}`);
  }

  async readTextFromImage(): Promise<string[]> {
    const recognise = await Tesseract.recognize('0.png', 'eng', {
      // logger: (info) => console.log(info),
    });
    const x = JSON.stringify(recognise.data.text);
    return this.extractData(x);
  }

  extractData(text) {
    const pattern = /(\w+) #(\d+)/g; // Regular expression to match the pattern
    const matches = text.matchAll(pattern);

    const extractedData = [];
    for (const match of matches) {
      const name = match[1];
      const number = parseInt(match[2]);
      extractedData.push({ name, number });
    }

    return extractedData;
  }
}
