const Calc = require("./calculator.js");
const syntax = require("./syntax.js");
const fs = require("fs");

const config = new syntax.csvconfig();
const calc = new Calc.calculator(config.config);
fs.readFile("csvtest.csv", "utf-8", (err, data) => {
    const text = data.replace(/^\uFEFF/, ''); // bom remove
    calc.code = text;
    console.log();
    console.log("-------------   csv   -------------");
    console.log(text);
    console.log("-------------   parsed   -------------");
    calc.value;
    console.log();
})

