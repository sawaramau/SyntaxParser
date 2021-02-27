const csv = require("./csvparser.js");
const fs = require("fs");

const parser = csv.parser;
csv.delimiter = ','
csv.processor = (val, col, row) => {
    console.log(row, col, val);
};
fs.readFile("csvtest.csv", "utf-8", (err, data) => {
    const text = data.replace(/^\uFEFF/, ''); // bom remove
    parser.code = text;
    console.log();
    console.log("-------------   csv   -------------");
    console.log(text);
    console.log("-------------   parsed   -------------");
    parser.value;
    console.log();
})
