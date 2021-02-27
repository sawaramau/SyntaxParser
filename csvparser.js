const Calc = require("./calculator.js");

class csvconfig {
    constructor() {
        this.join = Calc.join.orders;
        this.types = Calc.types;
        this.hooks = {};
        let col = 0;
        let row = 0;
        this.hooks.alternative = (argv, meta, self, types) => {
            const first = self.first;
            if (argv.length > 0) {
                const val1 = argv[0].value;
                if (argv[0].type == 'element') {
                    console.log(row, col, val1);
                }
            }
            if (first == ',') {
                col++;
            } else {
                row++;
                col = 0;
            }
            if (argv.length == 2) {
                const val2 = argv[1].value;
                if (argv[1].type == 'element') {
                    console.log(row, col, val2);
                }
            }
        };

        this.punctuations = [',', '\r\n', '\n'];
        this.opdefs = [
            // values
            // brackets
            [
                new Calc.opdefine(
                    (val) => {
                        // 文字列
                        const isEscape = (text, index) => {
                            let result = 0;
                            for (let i = index; i > 0; i--) {
                                if (text[i] == '"') {
                                    result++;
                                } else {
                                    break;
                                }
                            }
                            if (result % 2 == 0) {
                                return false;
                            }
                            return true;
                        };
                        const open = val[0];
                        const length = val.length;
                        const first = 1;            // 文字列としての最初のindex
                        const last = length - 3;    // 文字列としての最後のindex
                        const close = length - 2;   // 閉じ文字を期待している位置
                        const current = length - 1; // 新しく読み込んだ文字
                        // クオーテーションで始まる
                        if (open == '"') {
                            if (length < 3) {
                                return true;
                            }
                            // 末尾が明らかに閉じ文字ではない
                            if (!(val[close] == '"' && (val[current] == ',' || val[current] == '\r' || val[current] == '\n' ))) {
                                return true;
                            } else if (isEscape(val, last)) {
                                // エスケープ処理された閉じ文字であったので継続
                                return true;
                            }
                        }
                        return false;
                    },
                    null,
                    (val) => {
                        return val.slice(1, -1).replace(/\"\"/g,'"');
                    },
                    "string", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [
                            'element'
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
            ],
            [
                new Calc.opdefine(
                    (val) => {
                        // 文字列
                        if (
                            val[0] == ',' || val[0] == '\r' || val[0] == '\n' || val[0] == '"'
                            || val.slice(-1) == ',' || val.slice(-1) == '\r' || val.slice(-1) == '\n'
                            ) {
                            return false;
                        }
                        return true;
                    },
                    null,
                    (val) => {
                        return val;
                    },
                    "string", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [
                            'element'
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
            ],
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
            ],
        ];
        this.config = new Calc.config(this.opdefs, this.punctuations, [], this.hooks);
    }
}

module.exports = {
    config : (new csvconfig()).config
};
