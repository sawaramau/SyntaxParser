const Calc = require("./calculator.js");

class csvconfig {
    constructor() {

        this.join = new Calc.order();
        this.types = Calc.itemtype.types();

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
                        let org = val.slice(1, val.length - 1);
                        const escapes = [
                            ["r", "\r"],
                            ["\\", "\\"],
                            ["n", "\n"],
                            ["b", "\b"],
                            ["t", "\t"],
                            ["v", "\v"],
                            ["'", "\'"],
                            ['"', "\""],
                            ["0", "\0"],
                        ];
                        let str = "";
                        let cnt = 0;
                        for (let i = 0; i + cnt < org.length; i++) {
                            const c = org[i + cnt];
                            if (c == "\\") {
                                const e = escapes.find(v => v[0] == org[i + cnt + 1]);
                                if (e) {
                                    cnt++;
                                    str += e[1];
                                } else {
                                    str += c;
                                }
                            } else {
                                str += c;
                            }
                        }
                        return str;
                    },
                    "string", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [
                            this.types.string
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
                        let org = val.slice(1, val.length - 1);
                        const escapes = [
                            ["r", "\r"],
                            ["\\", "\\"],
                            ["n", "\n"],
                            ["b", "\b"],
                            ["t", "\t"],
                            ["v", "\v"],
                            ["'", "\'"],
                            ['"', "\""],
                            ["0", "\0"],
                        ];
                        let str = "";
                        let cnt = 0;
                        for (let i = 0; i + cnt < org.length; i++) {
                            const c = org[i + cnt];
                            if (c == "\\") {
                                const e = escapes.find(v => v[0] == org[i + cnt + 1]);
                                if (e) {
                                    cnt++;
                                    str += e[1];
                                } else {
                                    str += c;
                                }
                            } else {
                                str += c;
                            }
                        }
                        return str;
                    },
                    "string", null, 0,
                    new Calc.typeset(
                        [
                        ],
                        [
                            this.types.string
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
    }
}


module.exports = {
    csvconfig
};
