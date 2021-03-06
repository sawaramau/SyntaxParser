const Calc = require("./calculator.js");
const text = "return {x:1}?x"; // object
const text2 = 'return {x:1}?x ? 2 : 3';
const text3 = 'return {x:1}?y';
const text4 = 'return ((1) => {return {abc: 123}?abc})(1)';
const calc = new Calc.calculator(undefined);

const strslice = (str, pos, insert, len = 5) => {
    const a = str.slice(0, pos);
    const b = str.slice(pos + len);
    return a + insert + b;
};
const res = [];
const view = (node, view, results, depth = 0) => {
    if (results[depth] === undefined) {
        results[depth] = "";
        for (let i = 0; i < text.length; i++) {
            results[depth] += "   ";
        }
    }
    if (node.type == Calc.itemtype.types().punctuation) {
        results[depth] = strslice(results[depth], node.horizonal * 3, " ; ", 3);
    } else if (node.first != "dec") {
        results[depth] = strslice(results[depth], node.horizonal * 3, "'" + node.first + "'", 3);
    } else {
        let v = String(node.value);
        while (v.length < 3) {
            v = " " + v;
        }

        results[depth] = strslice(results[depth], node.horizonal * 3, v, 3);
    }
    for (let n of node.args) {
        if (n != node) {
            view(n, view, results, depth + 1);
        }
    }
}

console.log("");
console.log("-------------   calc1   -------------");
console.log(text);
calc.code = text;
console.log(calc.value);
console.log("-------------   calc2   -------------");
console.log(text2);
calc.code = text2;
console.log(calc.value);
console.log("-------------   calc3   -------------");
console.log(text3);
calc.code = text3;
console.log(calc.value);
console.log("-------------   calc4   -------------");
console.log(text4);
calc.code = text4;
console.log(calc.value);
console.log("");
return;
