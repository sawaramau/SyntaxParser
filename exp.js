const Calc = require("./calculator.js");
const fs = require("fs")


fs.readFile("test.code", "utf-8", (err, data) => {
    const text = data;
    const calc = new Calc.calculator(text);

    const ret = calc.result.dependency();
    console.log();
    console.log("-------------   calc1   -------------");
    console.log(text);
    console.log(calc.return().value);
    console.log("--------Parsed tree---------");
    ret[0].printtree();
    console.log();
})
