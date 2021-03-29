const Calc = require("./calculator.js");

class xmlconfig {
    constructor(){
        this.join = Calc.join.orders.order;
        this.opdefine = (grammer, order, formula, groupid) => {
            return new Calc.opdefine(grammer, order, formula, groupid);
        };
        this.ctrldefine = (grammer, formula, groupid) => {
            return new Calc.ctrldefine(grammer, formula, groupid);
        };
        this.controls = [
            this.ctrldefine(
                [
                    (val, ptr, self) => {
                        if (val[0] !== '<') {
                            return false;
                        }
                        if (val.length === 1) {
                            return true;
                        }
                        // 真面目にするならば、属性値などの文字列内の>は無視するようにしないといけない。
                        if (val[val.length - 2] === '>') {
                            return false;
                        }
                        return true;
                    },
                    0.5,
                    (val, ptr, self) => {
                        if (self) {
                            // （属性とか空白を考慮していないけれども）開始タグとの比較
                            return val.slice(2) === self.starter.first.slice(1);
                        }
                        if (val[0] !== '<') {
                            return false;
                        }
                        if (val.length === 1) {
                            return ptr.slice(0, 1) === '/';
                        }
                        if (val[val.length - 2] === '>') {
                            return false;
                        }
                        return true;
                    }
                ]
                ,(args, meta, self) => { 
                }, 
                'tag'
            )
        ];
        this.hooks = [];
        this.ops = [
            [
                this.opdefine((val) => {
                    if (val[val.length - 1] == '<') {
                        return false;
                    }
                    return true;
                }, this.join.left,
                () => {

                }),
            ]
        ];

        this.config = new Calc.config(this.opdefs, [], [], this.hooks, [], this.controls);
    }
    set code(val) {
        this.parser.code = val;
    }

    get value() {
        return undefined;
    }

    get parser() {
        if (this._parser === undefined) {
            this._parser = new Calc.calculator(this.config)
        }
        return this._parser;
    }
}

module.exports = new xmlconfig()

