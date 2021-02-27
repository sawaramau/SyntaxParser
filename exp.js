const Calc = require("./calculator.js");
const fs = require("fs");

const global = new Calc.property(undefined, false);
const local = new Calc.property(global, false);

const calc = new Calc.calculator();
fs.readFile("test.code", "utf-8", (err, data) => {
    const text = data;
    calc.code = text;
    const ret = calc.result.dependency();
    console.log();
    console.log("-------------   global namespace   -------------");
    console.log(text);
    console.log(calc.return(global).value);
    //console.log("--------Parsed tree---------");
    //ret[0].printtree();

    console.log();
    fs.readFile("test.2.code", "utf-8", (err, data) => {
        const text = data;
        calc.code = text;
        const ret = calc.result.dependency();
        console.log();
        console.log("-------------   global -> local namespace  -------------");
        console.log(text);
        console.log(calc.return(local).value);
        //console.log("--------Parsed tree---------");
        //ret[0].printtree();
        fs.readFile("test.4.code", "utf-8", (err, data) => {
            const text = data;
            calc.code = text;
            const ret = calc.result.dependency();
            console.log();
            console.log("-------------   global -> local namespace   -------------");
            console.log(text);
            console.log(calc.return(local).value);
            //console.log("--------Parsed tree---------");
            //ret[0].printtree();
            console.log();
        })
        fs.readFile("test.4.code", "utf-8", (err, data) => {
            const text = data;
            calc.code = text;
            const ret = calc.result.dependency();
            console.log();
            console.log("-------------   global namespace   -------------");
            console.log(text);
            console.log(calc.return(global).value);
            //console.log("--------Parsed tree---------");
            //ret[0].printtree();
            console.log();
        })
        console.log();
    })

})

