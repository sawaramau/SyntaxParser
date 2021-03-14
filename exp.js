const Calc = require("./calculator.js");
const fs = require("fs");
const performance = require('perf_hooks').performance;

const { internalArray } = require("./calculator.js");
const { drawer } = require('./parsetreedrawer.js');


//const global = new Calc.property(undefined, false);
//const local = new Calc.property(global, false);
const calc = new Calc.calculator();
calc.namespace = global;

fs.readFile("test.code", "utf-8", (err, data) => {
    const start = performance.now();
    const text = data;
    console.log();
    console.log("-------------   global namespace   -------------");
    console.log(text);
    calc.code = text;
    const draw = new drawer(calc);
    draw.output('tree.svg');
    //const r = calc.result.dependency();
    //r[0].printtree();
    console.log(calc.value);
    return;

    //const value = calc.value;
    console.log(calc.value);
    const end = performance.now();
    console.log(end - start);
    //console.log("--------Parsed tree---------");
    
    //r[0].printtree();
    return;
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

