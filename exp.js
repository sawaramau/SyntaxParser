const Calc = require("./calculator.js");
const fs = require("fs");

const global = new Calc.property(undefined, false);
const local = new Calc.property(global, false);

const calc = new Calc.calculator();
fs.readFile("test.code", "utf-8", (err, data) => {
    const text = data;
    calc.code = text;
    calc.namespace = global;
    console.log();
    console.log("-------------   global namespace   -------------");
    console.log(text);
    console.log(calc.value);
    //console.log("--------Parsed tree---------");
    //ret[0].printtree();

    console.log();
    fs.readFile("test.2.code", "utf-8", (err, data) => {
        const text = data;
        calc.code = text;
        calc.namespace = local;
        console.log();
        console.log("-------------   global -> local namespace  -------------");
        console.log(text);
        console.log(calc.value);
        //console.log("--------Parsed tree---------");
        //ret[0].printtree();
        fs.readFile("test.4.code", "utf-8", (err, data) => {
            const text = data;
            calc.code = text;
            console.log();
            console.log("-------------   global -> local namespace   -------------");
            console.log(text);
            console.log(calc.value);
            calc.namespace = global;
            console.log("-------------   global namespace   -------------");
            console.log(text);
            console.log(calc.value);
            console.log();
        })
        console.log();
    })

})

