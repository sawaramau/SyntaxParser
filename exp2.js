const Calc = require("./calculator.js");
const syntax = require("./syntax.js");
const fs = require("fs");

const global = new Calc.property(undefined, false);
const local = new Calc.property(global, false);
const config = new syntax.csvconfig();
const calc = new Calc.calculator(config.config);
fs.readFile("csvtest.csv", "utf-8", (err, data) => {
    const text = data.replace(/^\uFEFF/, ''); // bom remove
    calc.code = text;
    const ret = calc.result.dependency();
    console.log();
    console.log("-------------   csv   -------------");
    console.log(text);
    //console.log();
    console.log("-------------   parsed   -------------");
    calc.return(global).value
    //console.log("--------Parsed tree---------");
    //ret[0].printtree();
    console.log();
})
