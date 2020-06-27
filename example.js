const Calc = require("./calculator.js");
const text = '(a) => {1+1} ((a) => {1+1})(1)';
const calc = new Calc.calculator(text);

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
        results[depth] = strslice(results[depth], node.horizonal * 3, " " + node.first + " ", 3);
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
console.log("-------------   formula   -------------");
console.log(text);
const roots = calc.result.dependency();
for (let root of roots) {
    console.log("------------- parsed tree -------------");
    const results = [];
    view(root, view, results, 0);
    for (let r of results) {
        console.log(r);
    }
    console.log("------------- calc result -------------");
    if (root.type == Calc.itemtype.types().punctuation) {
        console.log(root.value.map(v => v.value));
    } else {
        console.log(root.value);
    }
}
return;
