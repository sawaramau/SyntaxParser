const Calc = require("./calculator.js");

class defineparser {
    constructor() {
        this.opdefine = (grammer, order, formula, groupid, meta, root = 0, inouts = null) => {
            return new Calc.opdefine(grammer, order, formula, groupid, meta, root, inouts);
        }
        this.typeset = (inputs, outputs, unavailables, delegates) => {
            return new Calc.typeset(inputs, outputs, unavailables, delegates);
        }
        this.join = Calc.join.orders;
        this.types = Calc.types;
        
        this.hooks = {};
        this.opdefs = [
            // 宣言
            [
                new Calc.opdefine(
                    ["drop", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
                            Calc.console.green(name, 'is declared as drop');
                            self.rootnamespace.declare(name, value, false, 'drop',
                                // setter
                                (self, newValue) => {
                                    const str2num = {
                                        '火': 0,
                                        '水': 1,
                                        '木': 2,
                                        '光': 3,
                                        '闇': 4,
                                        '回復': 5,
                                        '回': 5,
                                        'お邪魔': 6,
                                        '邪': 6,
                                        '毒': 7,
                                        '猛毒': 8,
                                        '猛': 8,
                                        '爆弾': 9,
                                        '爆': 9,
                                    };
                                    if (newValue.value in str2num) {
                                        self.newValue = str2num[newValue.value];
                                    } else if (0 <= newValue.value && newValue.value < 10) {
                                        self.newValue = newValue.value;
                                    } else {
                                        self.newValue = 0;
                                        return {
                                            error: 1,
                                            msg: 'drop is out of range.(variable:' + name + ')'
                                        };
                                    }
                                    return { error: 0 };
                                })
                        };
                        argv[0].meta.deftypename = 'drop';
                        argv[0].value;
                        return undefined;
                    },
                    "{}", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [this.types.object],
                        [
                            [this.types.control],
                        ],
                        [
                        ],
                    )
                ),
                new Calc.opdefine(
                    ["drops", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
                            Calc.console.green(name, 'is declared as drops');
                            self.rootnamespace.declare(name, value, false, 'drops',
                                // setter
                                (self, newValue) => {
                                    if (newValue.typename == 'drop') {
                                        self.newValue = Math.pow(2, newValue.value);
                                    } else {
                                        self.newValue = newValue.value;
                                    }
                                })
                        };
                        argv[0].meta.deftypename = 'drops';
                        argv[0].value;
                        return undefined;
                    },
                    "{}", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [this.types.object],
                        [
                            [this.types.control],
                        ],
                        [
                        ],
                    )
                ),

                new Calc.opdefine(
                    ["attribute", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
                            Calc.console.green(name, 'is declared as attribute');
                            self.rootnamespace.declare(name, value, false, 'attribute')
                        };
                        argv[0].meta.deftypename = 'attribute';
                        argv[0].value;
                        return undefined;
                    },
                    "{}", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [this.types.object],
                        [
                            [this.types.control],
                        ],
                        [
                        ],
                    )
                ),
            ],
            // 変数
            [
                new Calc.opdefine(
                    ["undefined"],
                    null,
                    () => {
                        return undefined;
                    },
                    "undefined", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [
                            this.types.undef
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                this.opdefine(
                    (val, ptr) => {
                        const varreg = /^[a-zA-Z_][\w]*$/;
                        return val.match(varreg);
                    },
                    null,
                    (val, meta, self) => {
                        const property = meta.property || self.rootnamespace;
                        const name = self.operator;
                        if (meta.declare) {
                            meta.declare(name);
                        }
                        if (meta.set) {
                            const setresult = meta.set(name);
                            if (setresult && setresult.error) {
                                meta.type = this.types.ret;
                                return setresult.msg;
                            }
                        }
                        meta.name = name;
                        meta.ref = property.resolve(name);
                        if (meta.ref) {
                            return meta.ref.value;
                        }
                        return undefined;
                    },
                    "variable", null, 0,
                    this.typeset(
                        [
                        ],
                        [
                            this.types.ref
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
            ],

            // 空白文字等
            [
                this.opdefine(
                    (val) => {
                        const varreg = /^[\t ]+$/;
                        if (val.match(varreg)) {
                            return true;
                        }
                        return false;
                    },
                    this.join.order.right,
                    null,
                    "space", null, 0,
                    this.typeset(
                        [
                        ],
                        [
                            this.types.blank
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                this.opdefine(
                    (val, ptr) => {
                        const len = val.length - 1;
                        if (val == "/") {
                            return true;
                        } else if (len < 2) {
                            return val == '/*';
                        }
                        const first = (val[0] + val[1]) == '/*';
                        const last = ((val[len - 2] + val[len - 1]) == '*/');
                        if (first) {
                            return !last;
                        }
                        return false;
                    },
                    this.join.order.right,
                    null,
                    "space", null, 0,
                    this.typeset(
                        [
                        ],
                        [
                            this.types.blank
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                this.opdefine(
                    (val, ptr) => {
                        if (ptr === undefined) {
                            return val.slice(0, 2) == '//';
                        }
                        const len = val.length - 1;
                        if (len == 0) {
                            return val == "/";
                        }
                        const first = (val[0] + val[1]) == '//';
                        if (!first) {
                            return false;
                        }
                        if (ptr.start >= ptr.last) {
                            return false;
                        }

                        const last = (() => {
                            if (ptr.slice(0, 1) == '\n') {
                                return true;
                            }
                            if (ptr.last - ptr.start > 1) {
                                return ptr.slice(0, 2) == '\r\n';
                            }
                            return false;
                        })();
                        if (first) {
                            return !last;
                        }
                        return false;
                    },
                    this.join.order.right,
                    null,
                    "space", null, 0,
                    this.typeset(
                        [
                        ],
                        [
                            this.types.blank
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
            ],
        ]

        this.config = new Calc.config(this.opdefs, [], [], this.hooks, []);
    }

    get parser() {
        if (this._parser === undefined) {
            this._parser = new Calc.calculator(this.config)
        }
        return this._parser;
    }
}


module.exports = new defineparser();
