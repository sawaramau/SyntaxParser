const Calc = require("./calculator.js");

class csvconfig {
    constructor(delimiter = ',') {
        this.delimiter = delimiter;
        this.join = Calc.join.orders;
        this.types = Calc.types;
        this.hooks = {};
        let col = 0;
        let row = 0;
        this.hooks.alternative = (argv, meta, self, types) => {
            const first = self.first;
            if (argv.length > 0) {
                const val = argv[0].value;
                if (this.processor && argv[0].type == 'element') {
                    this.processor(val, col, row);
                }
            }
            if (first == this.delimiter) {
                col++;
            } else {
                row++;
                col = 0;
            }
            if (argv.length == 2) {
                const val = argv[1].value;
                if (this.processor && argv[1].type == 'element') {
                    this.processor(val, col, row);
                }
            }
        };

        this.opdefs = [
            // values
            // brackets
            [
                new Calc.opdefine(
                    (val, ptr) => {
                        // 文字列
                        const isEscape = (text, index) => {
                            let result = 0;
                            for (let i = index; i > 0; i--) {
                                if (text[i] == this.esc) {
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
                        // 開始子で始まる
                        if (open == this.open) {
                            if (length < 3) {
                                return true;
                            }
                            // 末尾が明らかに閉じ文字ではない
                            if (!(val[close] == this.close && (val[current] == this.delimiter || this.isNewline(val, ptr)))) {
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
                        return val.slice(1, -1).replace(new RegExp(this.esc + this.close, 'g'), this.close);
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
                    (val, ptr) => {
                        // 文字列
                        if (
                            val[0] == this.delimiter || this.isNewline(val, ptr) || val[0] == this.open
                            || val.slice(-1) == this.delimiter
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

    isNewline(text, ptr) {
        const last = text.slice(-1);
        return this.newlines.filter(v => {
            if (v[0] == last) {
                const v1 = v.slice(1);
                for (let i = 0; i < v1.length; i++) {
                    const p = ptr.index(i + 1);
                    if (p != v1[i]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }).length > 0;
    }
    get punctuations() {
        return [(word, ptr) => {
            const key = this.delimiter.slice(0, word.length);
            return (word == key);
        }].concat(this.newlines);
    }
    get delimiter() {
        return this._delimiter;
    }
    set delimiter(val) {
        this._delimiter = val;
    }

    get newlines() {
        if (this._newlines === undefined) {
            this.newlines = ['\n', '\r\n'];
        }
        return this._newlines;
    }
    set newlines(val) {
        this._newlines = val;
    }
    get esc() {
        if (this._esc === undefined) {
            this.esc = '"'
        }
        return this._esc;
    }
    set esc(val) {
        this._esc = val;
    }
    get open() {
        if (this._open === undefined) {
            this._open = '"';
        }
        return this._open;
    }
    set open(val) {
        this._open = val;
    }
    get close() {
        if (this._close === undefined) {
            this._close = '"';
        }
        return this._close;
    }
    set close(val) {
        this._close = val;
    }
    set bracket(val) {
        this.open = val[0];
        this.close = val[1];
    }
    get bracket() {
        return [this.open, this.close];
    }

    set processor (val) {
        this._processor = val;
    }
    get processor() {
        return this._processor;
    }

    get parser() {
        if (this._parser === undefined) {
            this._parser = new Calc.calculator(this.config)
        }
        return this._parser;
    }
}

module.exports = new csvconfig()
