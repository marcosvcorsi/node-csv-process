import { createReadStream } from 'fs';
import { resolve } from 'path';
import csvtojson from 'csvtojson';

type BitcoinRow = {
  Date: string;
  Close: string;
}

type Bitcoin = {
  value: number;
  date?: Date;
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

  console.table([highest, lowest])
})();