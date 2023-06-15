import puppeteer from 'puppeteer';
import fs from "fs"

const url =
  'https://test-api.gen.art/private/render?key=Gk37dh3yut2ds39f5djgOND97d&tokenId=3000600002&isRenderer=true';

export const run = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    dumpio: true,
    devtools: false,
    // executablePath: env.IS_DEVELOPMENT ? env.CHROMIUM_PATH : undefined,
    timeout: 1000 * 60,
    args: [
      '--no-sandbox',
      '--lang=en',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // '--use-gl=egl',
      // '--enable-webgl',
      // '--disable-gpu',
    ],
  });
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);
  await page.setViewport({ width: 1000, height: 1500 });
  await page.goto(url, {
    waitUntil: ['domcontentloaded'],
    timeout: 1000 * 60 * 1,
  });
  await page.waitForSelector('html', {
    timeout: 1000 * 60 * 1,
  });

  await page.waitForSelector('canvas', {
    timeout: 1000 * 60 * 10,
  });

  await page!.evaluate(() => {
    return new Promise((rs: (v: void) => void, rj) => {
      //@ts-ignore
      (window as any).onImageRendered = () => {
        rs();
      };
    });
  });
  page && (await page.close());
  browser && (await browser.close());

  const {image, metadata} = await new Promise(
    async (rs: (v: { image: Buffer; metadata: any }) => void, rj) => {
      const elements = await page!.$$('canvas');
      const { metadata } = await page!.evaluate(() => {
        return {
          //@ts-ignore
          metadata: (window as any).METADATA,
        };
      });
      try {
        rs({
          image: (await elements?.[0].screenshot()) as Buffer,
          metadata,
        });
      } catch (err) {
        rj(err);
      }
    }
  );

  fs.writeFileSync(`./test.png`, image)
  console.log('metadata', metadata)
};

run().then(() => console.log('done')).catch(console.error);
