const Calc = require("./calculator.js");
const syntax = require("./syntax.js");
const fs = require("fs");

const global = new Calc.property(undefined, false);
const local = new Calc.property(global, false);
const config = new syntax.csvconfig();

fs.readFile("csvtest.csv", "utf-8", (err, data) => {
    const text = data.replace(/^\uFEFF/, ''); // bom remove
    const calc = new Calc.calculator(text, config.opdefs, config.punctuations, []);
    const ret = calc.result.dependency();
    console.log();
    console.log("-------------   global namespace   -------------");
    console.log(text);
    console.log(calc.return(global).value);
    //console.log("--------Parsed tree---------");
    ret[0].printtree();
    console.log();
})

