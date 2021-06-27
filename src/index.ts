import { createReadStream, createWriteStream } from 'fs';
import { resolve } from 'path';
import { Transform, pipeline, Writable } from 'stream';
import { promisify } from 'util';
import csvtojson from 'csvtojson';
import loki from 'lokijs';
import { v4 } from 'uuid';

const db = new loki('bitcoins');

var prices = db.addCollection('prices', { indices: ['id'] });

type BitcoinRow = {
  Date: string;
  Close: string;
}

type Bitcoin = {
  value: number;
  date?: Date;
}

const pipelineAsync = promisify(pipeline);

const writeData = () => {
  return new Writable({
    write: async (chunk, _, cb) => {
      const json = chunk.toString();
      const item = JSON.parse(json);

      prices.insert({
        id: v4(),
        ...item,
      });

      cb();
    }
  })
}

const mapStream = () => {
  return new Transform({
    objectMode: true,
    transform: async (chunk, _, cb) => {
      const item = chunk.toString();

      cb(null, item);
    },
  })
} 

(async () => {
  const stream = createReadStream(resolve(__dirname, '..', 'data', 'bitcoins.csv'));

  const lowest: Bitcoin = {
    value: Number.MAX_VALUE
  };

  const highest: Bitcoin = {
    value: 0
  };

  await csvtojson().fromStream(stream).subscribe((data: BitcoinRow) => {
    const { Close, Date: DateValue } = data;

    const value = Number(Close);

    if(value < lowest.value) {
      lowest.value = value;
      lowest.date = new Date(DateValue);
    }

    if(value > highest.value) {
      highest.value = value;
      highest.date = new Date(DateValue);
    }
  });

  console.table([highest, lowest]);

  const readStream = createReadStream(resolve(__dirname, '..', 'data', 'bitcoins.csv'));

  await pipelineAsync(
    readStream,
    csvtojson(),
    mapStream(),
    writeData()
  );

  const priceList = prices
    .chain()
    .find()
    .data();

  console.log('prices', priceList);
})();