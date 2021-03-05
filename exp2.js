const csv = require("./csvparser.js");
const definer = require('./datadefiner.js');
const fs = require("fs");

const datadefiner = definer.parser;
csv.delimiter = ','
csv.processor = (val, col, row) => {
    //if (col == 0) {
        //console.log('ここで名前空間を再定義してやれば重複もない予定');
    //}
    //console.log(row, col, val);
    //datadefiner.code = val;
    //datadefiner.value;
    return val;
};
fs.readFile("csvtest.csv", "utf-8", (err, data) => {
    const text = data.replace(/^\uFEFF/, ''); // bom remove
    csv.code = text;
    //console.log(text);
    console.log("-------------   parsed   -------------");
    const r = csv.parser.result.dependency();
    console.log(csv.value);
    r[0].printtree();
    console.log();
    console.log("-------------   csv   -------------");
    //console.log(text);
    console.log();
})
