const Calc = require("./calculator.js");
const text = 'return ((1)=>{1+1; if (1) {return 5}; return 2;})(1);'; // if true
const text2 = 'return ((1)=>{1+1; if (0) {return 5}; return 2;})(1);'; // if false
const text3 = '((1)=>{1+1; if (0) {return 5}; return 2;})(1);'; // no return
const text4 = 'return ((1)=>{1+1; if (1) { if (1) { if (1) {return 3}; return 2}; return 5 }; return 2;})(1);'; // if -> if -> if
const calc = new Calc.calculator(text);
const calc2 = new Calc.calculator(text2);
const calc3 = new Calc.calculator(text3);
const calc4 = new Calc.calculator(text4);

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
