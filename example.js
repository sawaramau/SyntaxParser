const Calc = require("./calculator.js");
//const text = "return ((1)=>{ if(2){return 3;}})(1)"; // if true
const text = 'if (1){return 1} \n return 3'; // if true
const text2 = 'return ((1)=>{1; if (0) {return 5;};  return 2;})(1)'; // if false
const text3 = 'return ((1)=>{34; if(1){ return 5;}; return 3;})(1)'; // no return
const text4 = 'return ((1)=>{ if (1) {1; if (1) { if (1) {return  3; }; return 1; }; return 5; }; return 2; }) (1);'; // if -> if -> if
//const text4 = '1?2:3'; // if -> if -> if
const calc = new Calc.calculator(text);
const calc2 = new Calc.calculator(text2);
const calc3 = new Calc.calculator(text3);
const calc4 = new Calc.calculator(text4);

const strslice = (str, pos, insert, len = 5) => {
    const a = str.slice(0, pos);
    const b = str.slice(pos + len);
    return a + insert + b;
};
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

//const roots = calc.result.dependency();

console.log("-------------   calc1   -------------");
console.log(text);
console.log(calc.return().value);
console.log("-------------   calc2   -------------");
console.log(text2);
console.log(calc2.return().value);
console.log("-------------   calc3   -------------");
console.log(text3);
console.log(calc3.return().value);
console.log("-------------   calc4   -------------");
console.log(text4);
console.log(calc4.return().value);
return;
