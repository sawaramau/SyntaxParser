// 演算子の定義など、解析器が必要とする基礎情報をまとめて保持するクラス
class config {
    constructor(calculator, opdefs) {
        this.join = new order();
        this.types = itemtype.types();
        this.calculator = calculator;
        this.punctuation = (argv) => {
            for (let arg of argv) {
                if (arg.type == this.types.ret) {
                    return arg.value;
                }
                arg.value;
            }
            return undefined;
        };

        // *****同一の演算子の場合、項数の少ない演算子ほど優先度を高くすること*****
        // 例えば + 1 と 1 + 1 の場合、単項の方が優先度が高い
        // x ? y : z と a ? b の場合 a ? b の方が優先度が高い
        // 現状ではインタプリタなどはないので、名前解決が必要な演算子や制御構文は解析のみで実行できない。
        // リテラルもここで定義する。詳しくはdecやstringの要素を確認
        // リテラルにせよ演算子にせよ、基本的な読み込みは『演算子として解釈可能な最長の単語』単位で行われる。
        this.opdefs = [
            // priority order
            [
                // 句読点
                new opdefine(
                    [1, "\n", 1],
                    this.join.order.left,
                    (argv) => {
                        this.punctuation(argv);
                    },
                    "punctuation", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.punctuation
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                new opdefine(
                    [1, "\r\n", 1],
                    this.join.order.left,
                    (argv) => {
                        this.punctuation(argv);
                    },
                    "punctuation", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.punctuation
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),

                new opdefine(
                    [1, ";", 1],
                    this.join.order.left,
                    (argv) => {
                        this.punctuation(argv);
                    },
                    "punctuation", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.punctuation
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
            ],
            [
                new opdefine(
                    [1, ";"],
                    this.join.order.left,
                    (argv) => {
                        this.punctuation(argv);
                    },
                    "punctuation", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.punctuation
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),

            ],
            [
                // same priority group
                new opdefine(
                    ["if", "(", 1, ")", "{", 1, "}"],
                    this.join.order.right,
                    (argv) => {
                        () => {
                            if (argv[0].value) {
                                argv[1].value;
                            }
                        }
                    },
                    "if", null, 0,
                    new typeset(
                        [],
                        [this.types.control],
                        [
                            [this.types.control, this.types.punctuation],
                            []
                        ]
                    )
                ),
                new opdefine(
                    ["for", "(", 1, ";", 1, ";", 1, ")", "{", 1, "}"],
                    this.join.order.right,
                    (argv) => {
                        () => {
                            for (argv[0].value; argv[1].value; argv[2].value) {
                                const r = argv[3].value;
                                if (argv[3].break) {
                                    break;
                                } else if (argv[3].return) {
                                    return r;
                                }
                            }
                        }
                    },
                    "for", null, 0,
                    new typeset(
                        [],
                        [this.types.control],
                        [
                            [this.types.control, this.types.punctuation],
                            [this.types.control, this.types.punctuation],
                            [this.types.control, this.types.punctuation],
                            [],
                        ]
                    )
                ),
            ],
            // next priority group
            [
                // 返り値系
                new opdefine(
                    ["return"],
                    this.join.order.right,
                    (argv) => {
                        () => {
                            return undefined;
                        }
                    },
                    "return", null, 0,
                    new typeset(
                        [],
                        [this.types.ret],
                        [
                            [this.types.control],
                        ]
                    )
                ),
                new opdefine(
                    ["return", 1],
                    this.join.order.right,
                    (argv) => {
                        () => {
                            return argv[0];
                        }
                    },
                    "return", null, 0,
                    new typeset(
                        [],
                        [this.types.ret],
                        [
                            [this.types.control],
                        ]
                    )
                ),
            ],
            [
                // 区切り文字
                new opdefine(
                    [1, ",", 1],
                    this.join.order.left,
                    (argv) => {
                        if (argv[0].type == this.types.parallel) {
                            const v = argv[0].value;
                            v.push(argv[1].value);
                            return v;
                        }
                        return [argv[0].value, argv[1].value];
                    },
                    ",", null, 0,
                    new typeset(
                        [],
                        [this.types.parallel],
                        [
                            [this.types.control],
                        ]
                    )
                ),
                // 区切り文字
                new opdefine(
                    [1, ","],
                    this.join.order.left,
                    (argv) => {
                        if (argv[0].type == this.types.parallel) {
                            return argv[0].value;
                        }
                        return [argv[0].value];
                    },
                    ",", null, 0,
                    new typeset(
                        [],
                        [this.types.parallel],
                        [
                            [this.types.control],
                        ]
                    )
                ),
            ],

            [
                // 条件演算
                new opdefine(
                    [1, "?", 1, ":", 1, ":", 1, ":", 1],
                    this.join.order.right,
                    (argv) => {
                        return argv[0].value ? argv[1].value : argv[2].value;
                    },
                    "?", null, 0,
                    new typeset(
                        [],
                        [this.types.delegate],
                        [
                            [this.types.control],
                            [this.types.control, this.types.punctuation],
                        ],
                        [(args) => {
                            args[0].value ? args[1].type : args[2].type;
                        }]
                    )
                ),
            ],
            [
                // 条件演算
                new opdefine(
                    [1, "?", 1, ":", 1],
                    this.join.order.right,
                    (argv) => {
                        return argv[0].value ? argv[1].value : argv[2].value;
                    },
                    "?", null, 0,
                    new typeset(
                        [],
                        [this.types.delegate],
                        [
                            [this.types.control],
                            [this.types.control, this.types.punctuation],
                        ],
                        [(args) => {
                            args[0].value ? args[1].type : args[2].type;
                        }]
                    )
                ),
            ],

            [
                // アクセサ
                new opdefine(
                    [1, "?", 1],
                    this.join.order.right,
                    (argv) => {
                        return null;
                    },
                    "?", null, 0,
                    new typeset(
                        [[this.types.ref, this.types.ref]],
                        [this.types.ref],
                        [
                            [this.types.control],
                        ]
                    )
                ),
            ],

            [
                // 
                new opdefine(
                    [1, ":", 1],
                    this.join.order.right,
                    (argv) => {
                        return undefined;
                    },
                    ":", null, 0,
                    new typeset(
                        [],
                        [],
                        [
                            [this.types.control],
                        ]
                    )
                ),
            ],
            [
                // 論理演算3
                new opdefine(
                    ["!", 1],
                    this.join.order.right,
                    (argv) => {
                        return !argv[0].value;
                    },
                    "!", null, 0,
                    new typeset(
                        [],
                        [this.types.bool],
                        [
                            [this.types.control],
                        ]
                    )
                ),
                // 論理演算3
                new opdefine(
                    ["not", 1],
                    this.join.order.right,
                    (argv) => {
                        return !argv[0].value;
                    },
                    "not", null, 0,
                    new typeset(
                        [],
                        [this.types.bool],
                        [
                            [this.types.control],
                        ]
                    )
                ),
            ],
            [
                // 論理演算2
                new opdefine(
                    [1, "||", 1],
                    this.join.order.left,
                    (argv) => {
                        // 短絡処理
                        if (argv[0].value) {
                            return argv[0].value;
                        }
                        return argv[1].value;
                    },
                    "||", null, 0,
                    new typeset(
                        [],
                        [this.types.delegate],
                        [
                            [this.types.control],
                        ],
                        [
                            (argv) => {
                                if (argv[0].value) {
                                    return argv[0].type;
                                }
                                return argv[1].type;
                            }
                        ]
                    )
                ),
            ],
            [
                // 論理演算2
                new opdefine(
                    [1, "&&", 1],
                    this.join.order.left,
                    (argv) => {
                        // 短絡処理
                        if (!argv[0].value) {
                            return argv[0].value;
                        }
                        return argv[1].value;
                    },
                    "&&", null, 0,
                    new typeset(
                        [],
                        [this.types.delegate],
                        [
                            [this.types.control],
                        ],
                        [
                            (argv) => {
                                if (!argv[0].value) {
                                    return argv[0].type;
                                }
                                return argv[1].type;
                            }
                        ]
                    )
                ),
            ],
            [
                // bit演算
                new opdefine(
                    ["~", 1],
                    this.join.order.left,
                    (argv) => {
                        return ~argv[0].value;
                    },
                    "~", null, 0,
                    new typeset(
                        [[this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
            ],
            [
                // bit演算
                new opdefine(
                    [1, "|", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value | argv[1].value;
                    },
                    "|", null, 0,
                    new typeset(
                        [[this.types.number, this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
            ],
            [
                // bit演算
                new opdefine(
                    [1, "&", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value & argv[1].value;
                    },
                    "&", null, 0,
                    new typeset(
                        [[this.types.number, this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
            ],
            [
                // 四則演算1
                new opdefine(
                    [1, "+", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value + argv[1].value;
                    },
                    "+", null, 0,
                    new typeset(
                        [],
                        [this.types.through],
                        [
                            [this.types.control],
                        ],
                    )
                ),
                new opdefine(
                    [1, "-", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value - argv[1].value;
                    },
                    "-", null, 0,
                    new typeset(
                        [[this.types.number, this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
            ],

            [
                // 四則演算2
                new opdefine(
                    [1, "*", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value * argv[1].value;
                    },
                    "*", null, 0,
                    new typeset(
                        [[this.types.number, this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
                new opdefine(
                    [1, "/", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value / argv[1].value;
                    },
                    "/", null, 0,
                    new typeset(
                        [[this.types.number, this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
                new opdefine(
                    [1, "%", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value % argv[1].value;
                    },
                    "%", null, 0,
                    new typeset(
                        [[this.types.number, this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
            ],


            [
                // 四則演算1+(単項)
                new opdefine(
                    ["+", 1],
                    this.join.order.right,
                    (argv) => {
                        return argv[0].value;
                    },
                    "+", null, 0,
                    new typeset(
                        [[this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
                new opdefine(
                    ["-", 1],
                    this.join.order.right,
                    (argv) => {
                        return -argv[0].value;
                    },
                    "-", null, 0,
                    new typeset(
                        [[this.types.number]],
                        [this.types.number],
                        [
                            [this.types.control],
                        ],
                    )
                ),
            ],

            [
                new opdefine(
                    ["(", 1, ")", "=>", "{", 1, "}"],
                    this.join.order.right,
                    (argv) => {
                        return (args) => {
                            return argv[1];
                        };
                    },
                    "{}", null, 0,
                    new typeset(
                        [],
                        [this.types.func],
                        [
                            [this.types.control, this.types.punctuation],
                            [this.types.parallel],
                        ],
                    )
                ),


            ],


            [
                // operator
                // brackets
                new opdefine(
                    [1, "(", 1, ")"],
                    this.join.order.left,
                    (argv) => {
                        //if (argv[1].op != ",") {
                        //    return argv[0].value([argv[1]]);
                        //}
                        return argv[0].value(argv[1].value).value;
                    },
                    "()", null, 0,
                    new typeset(
                        [
                            [this.types.ref, this.types.notunavailable]
                        ],
                        [this.types.delegate],
                        [
                            [this.types.control, this.types.punctuation],
                            [this.types.control, this.types.punctuation],
                        ],
                        [
                            (argv) => {
                                return argv[0].value(argv[1].value).type;
                            }
                        ],
                    )
                ),
                new opdefine(
                    [1, "[", 1, "]"],
                    this.join.order.left,
                    (argv) => {
                        /*
                        if (argv[1].op == ",") {
                            return (() => {
                                let elm = argv[0].value;
                                for (let key in argv[1].value) {
                                    elm = elm[key].value;
                                }
                                return elm;
                            })();
                        }
                        */
                        return argv[0].value[argv[1].value].value;
                    },
                    "[]", null, 0,
                    new typeset(
                        [
                            [this.types.ref, this.types.notunavailable]
                        ],
                        [this.types.delegate],
                        [
                            [this.types.control, this.types.punctuation],
                            [this.types.control, this.types.punctuation],
                        ],
                        [
                            (argv) => {
                                return argv[0].value[argv[1].value].type;
                            }
                        ],
                    )
                ),
            ],

            [
                // values
                // brackets
                new opdefine(
                    ["(", 1, ")"],
                    this.join.order.left,
                    (argv) => {
                        //if (argv[0].op == ",") {
                        //return argv[0].value.slice(-1)[0].value;
                        //}
                        return argv[0].value;
                    },
                    "()", null, 0,
                    new typeset(
                        [
                        ],
                        [this.types.through],
                        [
                            [this.types.control, this.types.punctuation],
                        ]
                    )
                ),
                new opdefine(
                    ["[", 1, "]"],
                    this.join.order.left,
                    (argv) => {
                        if (argv[0].type == this.types.parallel) {
                            return argv[0].value;
                        }
                        return [argv[0].value];
                    },
                    "[]", null, 0,
                    new typeset(
                        [
                        ],
                        [this.types.array],
                        [
                            [this.types.control, this.types.punctuation],
                        ],
                        [
                        ],
                    )
                ),

                new opdefine(
                    ["{", 1, "}"],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value;
                    },
                    "{}", null, 0,
                    new typeset(
                        [
                        ],
                        [this.types.object],
                        [
                            [this.types.control, this.types.punctuation],
                        ],
                        [
                        ],
                    )
                ),
            ],
            // リテラルとか
            [
                new opdefine(
                    ["true"],
                    null,
                    () => {
                        return true;
                    },
                    "bool", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.bool
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                new opdefine(
                    ["false"],
                    null,
                    () => {
                        return false;
                    },
                    "bool", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.bool
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                new opdefine(
                    (val) => {
                        const hexreg = /^(0x[\d]+)$/;
                        if (val.match(hexreg)) {
                            return true;
                        }
                        return false;
                    },
                    null,
                    (val) => {
                        return parseInt(val, 16);
                    },
                    "hex", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.number
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                new opdefine(
                    (val) => {
                        const decreg = /^([\d]+(\.)?([\d]+)?)$/;
                        if (val.match(decreg)) {
                            return true;
                        }
                        return false;
                    }
                    ,
                    null,
                    (val) => {
                        return Number(val);
                    },
                    "dec", null, 0,
                    new typeset(
                        [
                        ],
                        [
                            this.types.number
                        ],
                        [
                        ],
                        [
                        ],
                    )
                ),
                new opdefine(
                    (val) => {
                        const varreg = /^[a-zA-Z_][\w]*$/;
                        if (val.match(varreg)) {
                            return true;
                        }
                        return false;
                    },
                    null,
                    (val) => {
                        return Number(val);
                    },
                    "variable", null, 0,
                    new typeset(
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

                new opdefine(
                    (val) => {
                        const isEscape = (text, index) => {
                            let result = 0;
                            for (let i = index; i > 0; i--) {
                                if (text[i] == "\\") {
                                    result++;
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
                        if (open == "'" || open == '"') {
                            // 実際の値の開始位置より手前に閉じ記号は来ない
                            if (close < first) {
                                return true;
                            }
                            // 閉じ文字ではない
                            if (val[close] != open) {
                                return true;
                            }
                            // 実際の値の開始位置より手前にエスケープ処理は来ない
                            if (last < first) {
                                return false;
                            }
                            // 閉じ文字の手前はエスケープ
                            if (isEscape(val, last)) {
                                // エスケープ処理された閉じ文字であったので継続
                                return true;
                            }
                            // 
                        }
                        return false;
                    },
                    null,
                    (val) => {
                        return val;
                    },
                    "string", null, 0,
                    new typeset(
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
                // 空白文字等
                new opdefine(
                    (val) => {
                        const varreg = /^[\t ]+$/;
                        if (val.match(varreg)) {
                            return true;
                        }
                        return false;
                    },
                    null,
                    null,
                    "space", null, 0,
                    new typeset(
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
                new opdefine(
                    ["\n"],
                    this.join.order.right,
                    null,
                    "newline", null, 0,
                    new typeset(
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
                new opdefine(
                    ["\r\n"],
                    this.join.order.right,
                    null,
                    "newline", null, 0,
                    new typeset(
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
        ];
        this.ops = new ops(opdefs || this.opdefs);
    }

    // text : mystrクラス
    // テキストを先頭から読み込んで、最長の解釈が可能な演算子を取得
    getword(text) {
        let word = text.index(0);
        let matched = this.ops.match(word);
        const result = {
            defines: [],
            keyword: "",
        };
        while (matched.length != 0) {
            result.keyword = word;
            result.defines = matched;
            text.shift();
            if (text.length == 0) {
                break;
            }
            word += text.index(0);
            matched = this.ops.match(word, matched);
        };
        return result;
    }
}

class myconsole {
    static red(args) {
        console.log('\u001b[31m', args, '\u001b[0m');
    }
    static green(args) {
        console.log('\u001b[32m', args, '\u001b[0m');
    }
}

// enumぽい振る舞いをする自作クラス
class myenum {
    constructor(vals = {}, step = 1) {
        this.enum = {};
        this.keys = [];
        this.step = step;
        let i = 0;
        const check = [];
        for (let key in vals) {
            const v = vals[key];
            if (typeof v == "function") {
                i = v(i, step);
            }
            this.enum[key] = i;
            this.keys.push(key);
            check.push(i);
            i++;
        }
        const acc = check.reduce((acc, cur, i, self) => {
            return acc || (self.indexOf(cur, i + 1) > i);
        }, false);
        if (acc) {
            myconsole.red("Duplication enum value");
        }
    }

    sorted(reverse = false) {
        // [[num1, key1], [num2, key2], ...]; <- sorted nums
        return this.keys.slice().sort((l, r) => {
            if (reverse) {
                return this.enum[r] - this.enum[l];
            }
            return this.enum[l] - this.enum[r];
        }).map((key) => {
            return [this.enum[key], key];
        });
    }

    static define(val) {
        return () => {
            return val;
        };
    }
    static skip() {
        return (i, step = 1) => {
            return i + step;
        };
    }
}

// 文字列操作用の自作クラス
class mystr {
    constructor(str) {
        this._value = str;
    }
    set value(val) {
        this._value = val;
    }
    get value() {
        return this._value;
    }
    get length() {
        return this._value.length;
    }

    array() {
        const array = [];
        for (let i = 0; i < this.length; i++) {
            array.push(this.value[i]);
        }
        return array;
    }

    index(i) {
        if (-1 < i && i < this.length) {
            return this.value[i];
        }
        return null;
    }
    pop(len = 1) {
        const tmp = this.value.slice(-len);
        this.value = this.value.slice(0, -len);
        return tmp;
    }
    push(w) {
        return this.value = this.value + w;
    }

    shift(len = 1) {
        let w = "";
        for (let i = 0; i < len; i++) {
            if (this.length == 0) {
                break;
            }
            const c = this.value[0];
            this.value = this.slice(1);
            w += c;
        }
        return w;
    }
    unshift(w) {
        return this.value = w + this.value;
    }
    slice(s, e) {
        return this.value.slice(s, e);
    }
    match(regexp) {
        return this.value.match(regexp);
    }
}

// 入力セットに対する出力を定義するクラス
class typeset {
    constructor(inputs, outputs, unavailables, delegates) {
        // inputs: [[input1 type, input2 type,...], [], [],...]
        // outpust: [input set1 output, input set2 output]
        // unavailables: [[input1 unavailable1, input1 unavailable2,...], [input2 unavailable1, input2 unavailable2,...]]
        // delegates: [delegate1 function, delegate2 function,...]
        this._inputs = inputs;
        this._outputs = outputs;
        const diff = inputs.length - outputs.length;
        const last = outputs.slice(-1)[0];
        for (let i = 0; i < diff; i++) {
            this._outputs.push(last);
        }
        this._unavailables = unavailables;
        this._delegates = delegates;
        this.types = itemtype.types();
    }

    shift(terms = 1) {
        const inputs = this.inputs.map(input => input.slice());
        const unavailables = this.unavailables.slice();
        while (terms) {
            for (let input of inputs) {
                input.shift();
            }
            unavailables.shift();
            terms--;
        }
        return new typeset(inputs, this._outputs, unavailables, this._delegates);
    }

    get inputs() {
        return this._inputs;
    }
    get unavailables() {
        return this._unavailables;
    }
    output(args) {
        // args : [interpretation, interpretation,...]
        for (let i of this.inputs) {
            let hit = true;
        }
    }

    gettype(node) {
        // node: interpretation
        if (!this._outputs || this._outputs.length == 0) {
            myconsole.red("Output type undefined");
            return undefined;
        } else if (this._outputs.length == 1) {
            if (
                this._outputs[0] != this.types.ref
                && this._outputs[0] != this.types.punctuation
                && this._outputs[0] != this.types.delegate
                && this._outputs[0] != this.types.through
            ) {
                return this._outputs[0];
            } else if (node && !node.left && !node.right && !node._parent) {
                if (this._outputs[0] == this.types.delegate) {
                    return this._delegates[0](node.args);
                } else if (this._outputs[0] == this.types.punctuation) {
                    if (node.value) {
                        return node.value.type;
                    } else {
                        return this.types.undef;
                    }
                } else if (this._outputs[0] == this.types.through) {
                    if (node.args.length) {
                        return node.args[0].type;
                    }
                    return this.types.unsettled;
                } else if (this._outputs[0] == this.types.ref) {
                    if (node.value) {
                        return node.value.type;
                    }
                    return this.types.unsettled;
                }
            }
        }
        if (node && !node.left && !node.right && !node._parent) {
            let dele = 0;
            for (let i = 0; i < this.inputs.length; i++) {
                if (this.checkinput(this.inputs[i], node.args)) {
                    if (this._outputs[i] == this.types.delegate) {
                        return this._delegates[dele](node.args);
                    } else if (this._outputs[i] == this.types.punctuation) {
                        if (node.value) {
                            return node.value.type;
                        } else {
                            return this.types.undef;
                        }
                    } else if (this._outputs[i] == this.types.through) {
                        if (node.args.length) {
                            return node.args[0].type;
                        }
                        return this.types.unsettled;
                    } else if (this._outputs[i] == this.types.ref) {
                        if (node.value) {
                            return node.value.type;
                        }
                        return this.types.unsettled;
                    }
                    return this._outputs[i];
                } else if (this._outputs[i] == this.types.delegate) {
                    dele++;
                }
            }
        }
        return this.types.unsettled;
    }
    checkinput(input, args) {
        for (let i = 0; i < input.length; i++) {
            if (input[i] != args[i].type) {
                return false;
            }
        }
        return true;
    }
}

class itemtype {
    static types() {
        let blank = myenum.define(0);
        let control, ret;
        let number, string, bool, func, ref, array, object, punctuation, through, delegate, parallel, notunavailable;
        let unsettled;
        let undef;

        const e = new myenum({
            blank,
            control,
            bool,
            number,
            string,
            func,
            ref,        // 参照を保持する型（変数）
            array,
            object,
            punctuation,    // 句読点
            ret,            // return
            through,        // 第1引数の型と同じ扱いとする特殊型
            delegate,       // 型決定論を解釈側に丸投げする
            parallel,       // カンマ区切りの並列表記
            notunavailable, // 利用不可指定されていない全ての要素
            unsettled,      // 実行時まで判別が付かない
            undef,          // 未定義
        });
        return e.enum;
    }

    constructor() {
        this.enum = itemtype.types();
    }
    get type() {
        this.enum;
    }
}

// 結合順序
class order {
    constructor() {
        let left = myenum.define(0);
        let right;

        this.enum = new myenum({
            left,
            right
        });
    }
    get order() {
        return this.enum.enum;
    }
}

// 命令定義用クラス
class opdefine {
    constructor(grammer, order, formula, groupid, meta, root = 0, inouts = null) {
        this._grammer = grammer;
        this.order = order;
        this.formula = formula;
        if (typeof this._grammer == "function") {
            if (formula) {
                this.formula = (argv) => {
                    return formula(argv);
                }
            }
        }
        this.groupid = groupid;
        this.meta = meta; // free space. meta data
        this.root = root;
        this._inouts = inouts;
    }

    gettype(node) {
        return this._inouts.gettype(node);
    }

    get grammer() {
        if (!(this._grammer instanceof Array)) {
            return this._grammer;
        }
        let grammer = [];
        let first, second = false;
        let f = 0;

        for (let elm of this._grammer) {
            grammer.push(elm);
            if (!first) {
                f++;
            }
            if ((typeof elm) != "number") {
                if (!first) {
                    first = true;

                } else if (!second) {
                    second = true;
                    break;
                }
            }
        }
        if (second) {
            grammer = grammer.slice(0, f);
        }

        return grammer;
    }

    match(text) {
        if (this._grammer instanceof Array) {
            for (let key of this._grammer) {
                if ((typeof key) == "number") {
                    continue;
                }
                if (key.slice(0, text.length) == text) {
                    return true;
                }
            }
        } else {
            return this._grammer(text);
        }
        return false;
    }

    set priority(val) {
        this._priority = val;
    }

    get priority() {
        return this._priority;
    }
    // 文法解釈用
    firstmatch(word) {
        if (this._grammer instanceof Array) {
            return this.first == word;
        }
        return this._grammer(word);
    }

    make(keyword) {
        if (this._grammer instanceof Array) {
            const int = new interpretation(this);
            return int;
        }
        if (this.formula) {
            const def = new opdefine([keyword], this.order, () => {
                return this.formula(keyword);
            }, this.groupid, this.meta, this.root, this._inouts);
            def.priority = this.priority;
            const int = new interpretation(def);
            return int;
        } else {
            const def = new opdefine([keyword], this.order, () => {
                return undefined;
            }, this.groupid, this.meta, this.root, this._inouts);
            def.priority = this.priority;
            const int = new interpretation(def);
            return int;
        }
    }

    get first() {
        if (this._first !== undefined) {
            return this._first;
        }
        if (this._grammer instanceof Array) {
            if (this._grammer.length == 1) {
                this._first = this.grammer[0];
            }
            for (let elm of this._grammer) {
                if ((typeof elm) != "number") {
                    this._first = elm;
                    return elm;
                }
            }
        }
        return this._first;
    }
    get terms() {
        if (this._terms !== undefined) {
            return this._terms;
        }
        let terms = 0;

        for (let elm of this.grammer) {
            if ((typeof elm) != "number") {
                continue;
            }
            terms += elm;
        }
        this._terms = terms;
        return terms;
    }

    get left() {
        if (this._left !== undefined) {
            return this._left;
        }
        let left = 0;
        for (let elm of this.grammer) {
            if ((typeof elm) != "number") {
                break;
            }
            left += elm;
        }

        this._left = left;
        return left;
    }

    get right() {
        if (this._right === undefined) {
            this._right = this.terms - this.left;
        }
        return this._right;
    }
    get offset() {
        if (this._offset === undefined) {
            this.connectors();
        }
        return this._offset;
    }

    // 囲み系の演算子のとき、このアクセサで次の定義を得る
    get nexter() {
        if (this._nexter !== undefined) {
            if (this._nexter == null) {
                return;
            }
            return this._nexter;
        }
        if (!(this.grammer instanceof Array)) {
            return undefined;
        }
        const grammer = this._grammer.slice();

        // [1, "+", 1] => nexter is undefined
        // [1, "(", 1, ")"], nexter is [1, ")"]
        // ["(", 1, ")"], nexter is [1, ")"]
        let cnt = 0;
        for (let elm of grammer) {
            cnt++;
            if ((typeof elm) != "number") {
                break;
            }
        }
        while (cnt) {
            grammer.shift();
            cnt--;
        }
        const first = grammer.find(elm => (typeof elm) != "number");
        if (first === undefined) {
            this._nexter = null;
            return;
        }

        this._nexter = new opdefine(grammer, this.order, () => {
            // interpretation側で解決
        }, this.groupid, { parent: this }, this.root + 1, this._inouts.shift(this.left));

        this._nexter.priority = this.priority;
        return this._nexter;
    }

}

// 定義に基づいて解釈を展開しつつ、式の上での親子関係を保持するクラス
class interpretation {
    // 定義クラスから実際の解釈を生成
    // 解釈の無効を管理
    // offsetは部分的な構文解析時に使用
    constructor(define, parent, offset = 0) {
        if (define === undefined) {
            myconsole.red("Unexpected define. This is undefined");
        }

        this._invalid = false;
        this._define = define; // opdefine
        if (parent) {
            // 親の生成直後は位置が確定していないが、その段階では子にとっても親の位置は重要ではないため、
            // 適宜もらう事にする。
            this._parent = parent;
        }
        this._left = [];   // left children
        this._childtrees = []; // 
        this._right = [];  // right children
        this._brothers;
        this._offset = offset;
        this._leftblank = [];
        this._rightblank = [];
        this._childblanktrees = []; // 
    }

    set brothers(val) {
        this._brothers = val;
    }
    get brothers() {
        return this._brothers;
    }


    get offset() {
        return this._offset;
    }

    set offset(val) {
        return this._offset = val;
    }

    // ここでセットされるrootは真実のrootではない
    // 自身と同じhorizonalに位置する有効な別の解釈が所属するツリーの根。
    set root(val) {
        if (!val || val == this || val.horizonal === undefined) {
            return;
        }
        this._root = val;
    }

    get starter() {
        let parent = this;
        while (1) {
            if (!parent._parent) {
                return parent;
            }
            parent = parent.parent;
        }

    }

    get root() {
        // 根を取得
        if (this._root) {
            return this._root;
        }
        let root = this;
        while (root) {
            if (!root.parent) {
                return root;
            }
            root = root.parent;
        }
    }

    // 自身の子要素以下についてhorizonalでアクセスする
    absolute(horizonal) {
        const allnodes = this.allnodes;
        for (let node of this.allnodes) {
            if (node.horizonal == horizonal) {
                return node;
            }
        }
        myconsole.red("undefined absolute horizonal access:")
        console.log(this.allnodes.map(v => v.horizonal));
        for (let node of this.allnodes) {
            if (node.horizonal == 10) {
                console.log(node._rightblank.length, node._leftblank.length, node._childblanktrees.length);
            }
        }
        console.log(horizonal, this.horizonal);
        return undefined;
    }

    set lefttree(val) {
        if (val) {
            this._lefttree = val;
            /*{
                horizonal: val.horizonal,
                vertical: val.vertical
            };
            */
        }
    }
    get lefttree() {
        return this._lefttree;
    }
    set righttree(val) {
        if (val) {
            this._righttree = val;
            /*
            {
                horizonal: val.horizonal,
                vertical: val.vertical
            };
            */
        }
    }
    get righttree() {
        return this._righttree;
    }

    get roots() {
        // ツリーの再構築のために、根に至る間に存在するparent群を取得
        const left = [];
        const right = [];
        let root = this.parent;
        while (root) {
            if (!(root instanceof interpretation)) {
                break;
            }
            if (root.horizonal > this.horizonal) {
                right.push(root);
            } else if (root.horizonal < this.horizonal) {
                left.push(root);
            } else {
                // 同じインデックスの要素が親にいるわけがない。
                myconsole.red("Double interpretation violation");
            }
            root = root.parent;
        }
        return {
            left,
            right,
        }
    }

    set childtrees(val) {
        this._childtrees = [];
        this._childblanktrees = [];
        for (let op of val) {
            //const op = def;
            //op.program.push([this]);
            op.parent = this;
            if (op.type == itemtype.types().blank) {
                this._childblanktrees.push(op);
            } else {
                this._childtrees.push(op);
            }
        }
    }
    get childtrees() {
        return this._childtrees;
    }

    get allchildtrees() {
        const all = [];
        for (let child of this._childtrees) {
            all.push(child);
        }
        for (let child of this._childblanktrees) {
            all.push(child);
        }
        all.sort((l, r) => l.horizonal - r.horizonal);
        return all;
    }

    get allchildren() {
        // 空白文字も含むすべての子供
        const left = this._left.map(child => {
            if (child instanceof interpretation) {
                return child;
            }
            //return this.program[child.horizonal - this.offset][child.vertical];
        });
        for (let child of this._leftblank) {
            if (child instanceof interpretation) {
                left.push(child);
            } else {
                //left.push(this.program[child.horizonal - this.offset][child.vertical]);
            }
        }
        const right = (() => {
            const right = [];
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                } else {
                    //right.push(this.program[child.horizonal - this.offset][child.vertical]);
                }
            }
            for (let child of this._rightblank) {
                if (child instanceof interpretation) {
                    right.push(child);
                } else {
                    //right.push(this.program[child.horizonal - this.offset][child.vertical]);
                }
            }
            return right;
        })();


        const children = [];
        for (let child of left) {
            children.push(child);
        }
        for (let child of right) {
            children.push(child);
        }
        children.sort((l, r) => {
            if (l.horizonal == r.horizonal) {
                myconsole.red("Violation!");
            }
            return l.horizonal - r.horizonal;
        });
        return children;

    }

    get children() {
        // 空白文字を含まない全ての子供
        const left = this._left.map(child => {
            if (child instanceof interpretation) {
                return child;
            }
            //return this.program[child.horizonal - this.offset][child.vertical];
        });
        const right = (() => {
            const right = [];
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                } else {
                    //right.push(this.program[child.horizonal - this.offset][child.vertical]);
                }
            }
            return right;
        })();
        const children = [];
        for (let child of left) {
            children.push(child);
        }
        for (let child of right) {
            children.push(child);
        }
        children.sort((l, r) => {
            if (l.horizonal == r.horizonal) {
                myconsole.red("Violation!");
            }
            return l.horizonal - r.horizonal;
        });
        return children;
    }

    get typeset() {
        return this.define._inouts;
    }

    get args() {
        // 引数として渡すときの左右の要素
        const left = this._left.map(child => {
            if (child instanceof interpretation) {
                return child;
            }
            //return this.program[child.horizonal - this.offset][child.vertical];
        });
        const right = (() => {
            const right = [];
            let nexter = this.nexter;
            while (nexter) {
                for (let node of nexter.childtrees) {
                    right.push(node);
                }
                for (let node of nexter._right) {
                    if (node instanceof interpretation) {
                        right.push(node);
                    } else {
                        //right.push(this.program[node.horizonal - this.offset][node.vertical]);
                    }
                }
                nexter = nexter.nexter;
            }
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                } else {
                    //right.push(this.program[child.horizonal - this.offset][child.vertical]);
                }
            }
            return right;
        })();
        const children = [];
        for (let child of left) {
            children.push(child);
        }
        for (let child of right) {
            children.push(child);
        }
        children.sort((l, r) => {
            return l.horizonal - r.horizonal;
        });
        return children;
    }

    get allnodes() {
        const nodes = []
        let rec = (node, rec) => {
            nodes.push(node);
            for (let child of node.allchildren) {
                rec(child, rec);
            }
            for (let child of node.allchildtrees) {
                rec(child, rec);
            }
            if (!node.nexter) {
                return;
            }
            rec(node.nexter, rec);
        };
        rec(this, rec);
        nodes.sort((l, r) => l.horizonal - r.horizonal);
        return nodes;
    }

    get nodes() {
        // 空白要素を除いたノード集合
        const nodes = []
        let rec = (node, rec) => {
            nodes.push(node);
            for (let child of node.children) {
                rec(child, rec);
            }
            for (let child of node.childtrees) {
                rec(child, rec);
            }
            if (!node.nexter) {
                return;
            }
            rec(node.nexter, rec);
        };
        rec(this, rec);
        return nodes;
    }

    get tree() {
        const tree = [this];
        let maketree = (children, tree, maketree) => {
            for (let child of children) {
                const double = tree.find(n => n.horizonal == child.horizonal);
                if (double) {
                    myconsole.red("Already recorded node!!");
                    break;
                }
                tree.push(child);
                maketree(child.allchildren, tree, maketree);
            }
        };
        const children = this.allchildren;

        maketree(children, tree, maketree);

        tree.sort((l, r) => {
            return l.horizonal - r.horizonal;
        });
        return tree;
    }

    get previnterpretation() {
        return this._previnterpretation;
    }

    set previnterpretation(val) {
        this._previnterpretation = val;
    }

    set context(val) {
        this._context = val;
    }

    get context() {
        if (!this._context) {
            this._context = [];
        }
        return this._context;
    }

    get others() {
        const others = [];
        const roots = this.roots;
        const blank = this.type == itemtype.types().blank;
        const bracket = {};
        const min = {};
        const max = {};
        // 左右にある（少なくともどちらか一方は）越え（下回ら）なければならない優先度の壁
        min.left = roots.left.sort((l, r) => {
            return l.priority - r.priority;
        }).find(() => { return true });
        min.right = roots.right.sort((l, r) => {
            return l.priority - r.priority;
        }).find(() => { return true });
        // 自身が左右どちらかに子要素を持たない場合、以下の要素を越える（下回る）優先度の解釈は不可能
        max.left = roots.left.sort((l, r) => r.priority - l.priority).find(() => { return true });
        max.right = roots.right.sort((l, r) => r.priority - l.priority).find(() => { return true });
        bracket.open = roots.left.sort((l, r) => l.horizonal - r.horizonal).find((op) => op.nexter);
        bracket.close = roots.right.sort((l, r) => r.horizonal - l.horizonal).find((op) => op._parent);


        for (let def of this.context) {
            if (!def) {
                others.push(undefined);
            } else if (def.priority >= this.priority) {
                // 自身以降の解釈は敢えて入れない。
                others.push(undefined);
            } else if (bracket.open !== undefined && bracket.close !== undefined &&
                bracket.open.horizonal < def.horizonal && def.horizonal < bracket.close.horizonal
            ) {
                // 囲み文字に囲まれた領域は考慮しない。
                others.push(undefined);
            } else if (def.invalid || !def.finished) {
                // 既に無効な命令、または終了していない命令は無視
                others.push(undefined);
            } else if (def.define.left < this.define.left || def.define.right < this.define.right) {
                // 左右の要素数が減るような解釈は使用不可
                others.push(undefined);
            } else if (blank && roots.left.length && roots.right.length && min.right.priority < this.priority && min.left.priority < this.priority) {
                // 空白要素は左右両方に親がいる時、親を超えられない。
                others.push(undefined);
            } else if (
                roots.left.length && roots.right.length
                && def.priority > min.left.priority && def.priority > min.right.priority
            ) {
                // 両サイドのルーツより高い優先度のとき、その解釈による拡張はできない <- 自身がルートならばできる
                others.push(undefined);
            } else if (roots.left.length && min.left.priority < def.priority && def.define.left > this.define.left) {
                // 左に祖先が残っている時に、左に手を伸ばすことは出来ない
                others.push(undefined);
            } else if (roots.right.length && min.right.priority < def.priority && def.define.right > this.define.right) {
                // 右に祖先が残っている時に、右に手を伸ばすことは出来ない
                others.push(undefined);
            } else if (!blank && roots.left.length && !this.define.left && def.priority < max.left.priority) {
                // 自身が空白要素でなければ、自身が左手側に子要素を持たない時、左手側の親要素を越える事は出来ない
                others.push(undefined);
            } else if (!blank && roots.right.length && !this.define.right && def.priority < max.right.priority) {
                // 自身が空白要素でなければ、自身が右手側に子要素を持たない時、右手側の親要素を越える事は出来ない
                others.push(undefined);
                // 以下の検討はfirst要素の探索時に実行している
                //} else if (def.define.left > this.index) {
                //    others.push(undefined);
                //} else if (def.define.right + this.index >= this.program.length) {
                //    others.push(undefined);
            } else {
                others.push(def);
            }
        }
        return others;
    }

    get grammer() {
        return this.define.grammer;
    }

    set program(val) {
        this._program = val;
    }
    get program() {
        if (this._parent) {
            //return this.parent.program;
        }
        //return this._program;
    }

    get clone() {
        const elm = new interpretation(this.define, this._parent, this.offset);
        elm._vertical = this._vertical;
        elm._horizonal = this._horizonal;
        elm._invalid = this._invalid;
        if (elm.invalid) {
            return elm;
        }
        elm._nexter = this._nexter;
        elm._context = this._context.slice();
        elm._childtrees = this._childtrees;

        elm._left = this._left.slice();
        elm._right = this._right.slice();
        elm._brothers = this._brothers;
        elm._tmpparent = this._tmpparent;
        elm._leftblank = this._leftblank.slice();
        elm._rightblank = this._rightblank.slice();
        elm._childblanktrees = this._childblanktrees;
        return elm;
    }
    get fullgrammer() {
        const full = [];
        let current = this;
        while (current) {
            for (let elm of current.grammer) {
                full.push(elm);
            }
            current = current.nexter;
        }
        return full;
    }
    get nexter() {
        if (!this.define.nexter) {
            return undefined;
        }
        if (!this._nexter) {
            const nexter = new interpretation(this.define.nexter, this, this.offset);
            nexter.program = this.program;
            this._nexter = nexter;
        }
        return this._nexter;
    }

    get value() {
        return this.define.formula(this.args);
    }
    get index() {
        return this.horizonal - this.offset;
    }

    get horizonal() {
        return this._horizonal;
    }
    get vertical() {
        return this._vertical;
    }

    set horizonal(val) {
        if (this._horizonal !== undefined) {
            myconsole.red("horizonal index is rewritten");
        }
        this._horizonal = val;
    }
    set vertical(val) {
        if (this._vertical !== undefined) {
            myconsole.red("vertical index is rewritten");
        }
        this._vertical = val;
    }

    set index(val) {
        // 使わないと思うけど
        this._offset = this.horizonal - val;
    }

    get first() {
        return this.define.first;
    }

    get priority() {
        return this.define.priority;
    }

    get finished() {
        if (!this.nexter) {
            return true;
        }
        if (this.nexter.horizonal === undefined) {
            return false;
        }
        return this.nexter.finished;
    }

    get invalid() {
        if (this._invalid) {
            return true;
        }
        
        if (this.nexter) {
            if (this.nexter.invalid) {
                this.invalid = true;
            }
        }
        if (this.brothers && this.brothers()) {
            this.invalid = true;
        }
        return this._invalid;
    }
    set invalid(val) {
        if (this._parent) {
            this.parent.invalid = val;
        }
        if (val) {
            // release
            this._left = null;   // left children
            this._childtrees = null; // 
            this._right = null;  // right children
            this._brothers = null;
            this._leftblank = null;
            this._rightblank = null;
            this._childblanktrees = null; // 
        }
        return this._invalid = val;
    }
    set parent(val) {
        if (this._parent) {
            // _parent は産みの親なので忘れない
            return;
        }
        this._tmpparent = val;
        /*
        {
            horizonal: val.horizonal,
            vertical: val.vertical,
        };
        */
    }
    get parent() {
        if (this._parent) {
            return this._parent;
        }
        return this._tmpparent;
    }

    get define() {
        return this._define;
    }
    get order() {
        return this.define.order;
    }
    get left() {
        if (this._parent) {
            return this.define.left - this._childtrees.length;
        }
        return this.define.left - this._left.length;
    }
    get right() {

        return this.define.right - this._right.length;
    }

    get type() {
        return this.define.gettype(this);
    }

    setleft(val) {
        if (this.horizonal <= val.horizonal) {
            return false;
        }
        if (val.type == itemtype.types().blank) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }

            val.parent = this;
            this._leftblank.push(val);
        } else if (this.left > 0) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }
            val.parent = this;
            this._left.unshift(val);
            return true;
        }
        return false;
    }
    setright(val) {
        if (this.horizonal >= val.horizonal) {
            return false;
        }
        if (val.type == itemtype.types().blank) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }
            val.parent = this;

            this._rightblank.unshift(val);
            return true;
        } else if (this.right > 0) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }
            val.parent = this;
            this._right.push(val);
            return true;
        }
        return false;
    }
}

// 演算子を読み込んでそれ単体で成立しうる解釈を返すクラス
class context {
    constructor(first) {
        this._first = first;
        this._context = [];
    }

    get context() {
        return this._context;
    }

    set context(val) {
        for (let v of val) {
            this.push(v);
        }
        return this._context;
    }

    get invalid() {
        return this._invalid;
    }
    set invalid(val) {
        this._invalid = val;
    }
    get offset() {
        return this._offset;
    }
    set offset(val) {
        this._offset = val;
    }
    get horizonal() {
        return this._horizonal;
    }
    set horizonal(val) {
        this._horizonal = val;
    }
    get vertical() {
        return this._vertical;
    }

    set vertical(val) {
        this._vertical = val;
    }

    get first() {
        return this._first;
    }

    get length() {
        return this.context.length;
    }

    match(keyword) {
        return this.first == keyword;
    }

    push(interpretation) {
        if (interpretation.define.first != this.first) {
            myconsole.red("Unmatch operator", interpretation.fullgrammer, ",", this.first);
        }
        if (!interpretation.nexter) {
            interpretation.brothers = () => {
                for (let op of this.context) {
                    if (!op.nexter) {
                        // 次要素のない兄弟要素はどうでもいい。
                        continue;
                    }
                    if (op.finished) {
                        // 次要素のある兄弟要素の完走は自身の存在の否定
                        return true;
                    }
                }
                return false;
            };
        }
        this.context.push(interpretation);
    }

    get finished() {
        let first = false;
        for (let def of this.context) {
            if (!def) {
                continue;
            }
            if (!def.invalid) {
                if (!first) {
                    first = true;
                } else {
                    return false;
                }
            }
        }
        if (!first) {
            myconsole.red("All interpretations invalid!!");
        }
        return true;
    }

    get contexts() {
        const contexts = {};
        for (let def of this.context) {
            const nexter = def.nexter;
            if (!nexter || def.invalid || nexter.invalid) {
                continue;
            } else if (!(nexter.first in contexts)) {
                contexts[nexter.first] = new context(nexter.first);
            }
            contexts[nexter.first].push(nexter);
        }
        return contexts;
    }

}

// 式を読み込んで全体的な解釈をするクラス
class contexts {
    // 
    push(keyword) {
        const context = this.context(keyword).sort((l, r) => {
            return l.priority - r.priority;
        });

        let i = 0;
        for (let interpretation of context) {
            interpretation.horizonal = this.program.length;
            interpretation.vertical = i;
            interpretation.program = this.program;
            interpretation.context = context;
            i++;
        }

        if (context.length) {
            this.program.push(context);
        }
    }

    // program形式で保存されたinterpretationをクローンしながらコピー。
    // 現状はsrcにthis.programないしは、水平位置が0スタートのprogramしかとれない。
    extraction(src, start, end) {
        // src can use only this.program now
        const program = [];
        for (let context of src.slice(start, end)) {
            const array = [];

            for (let def of context) {
                if (!def) {
                    array.push(undefined);
                    continue;
                }
                const clone = (() => {
                    const clone = def.clone;
                    if (clone._parent) {
                        // 結合子は親と同期する
                        return clone._parent.nexter;
                    }
                    return clone;
                })()
                clone.offset = start;
                clone.program = program;
                array.push(clone);
            }
            program.push(array);
        }
        return program;
    }

    // program形式の配列(program order: [[same operator interpretaions], [interpretations],...])を
    // 優先度毎の配列に並び替える関数
    reorder(src) {
        let prev;
        return src.reduce((acc, cur) => {
            for (let interpretation of cur) {
                if (interpretation && !interpretation.invalid) {
                    acc.push(interpretation);
                }
            }
            return acc;
        }, []).sort((l, r) => {
            const priority = r.priority - l.priority;
            if (priority) {
                return priority;
            }
            return l.horizonal - r.horizonal;
        }).reduce((acc, cur) => {
            if (cur.priority != prev) {
                acc.push([]);
            }
            acc[acc.length - 1].push(cur);
            prev = cur.priority;
            return acc;
        }, []);
    }

    retree(program) {
        let nexter;
        const roots = program.filter(cur => {
            for (let def of cur) {
                if (!def) {
                    continue;
                }
                if (def.invalid || !def.finished) {
                    continue;
                }
                if (def.left || def.right) {
                    continue;
                }

                if (nexter !== undefined && def.horizonal < nexter) {
                    break;
                }
                if (nexter !== undefined && def.horizonal >= nexter) {
                    nexter = undefined;
                }

                if (def.nexter) {
                    nexter = def.nexter.horizonal;
                }
                if (def.parent) {
                    break;
                }
                return true;
            }
            return false;
        }).map((cur) => {
            for (let def of cur) {
                if (!def) {
                    continue;
                }
                if (def.invalid || !def.finished) {
                    continue;
                }
                if (def.left || def.right) {
                    continue;
                }
                return def;
            }
            return undefined;
        });
        let prev;
        const trees = roots.reduce((acc, cur) => {
            const root = cur;
            // 開き記号以降を含むと不幸になる？
            const tree = root.tree;
            acc.push(tree);
            root.lefttree = prev;

            if (prev) {
                prev.righttree = root;
            }
            prev = root;
            return acc;
        }, []);

        const newprogram = trees.reduce((acc, tree) => {
            const context = [];
            for (let def of tree) {
                const interpretations = [];
                for (let other of def.others) {
                    if (other === undefined) {
                        interpretations.push(other);
                        continue;
                    }
                    const grammer = [other.define.left - def.define.left, def.first, other.define.right - def.define.right];
                    const op = new opdefine(grammer, other.order, undefined, "tree", null, 0, def.typeset);
                    op.priority = other.priority;
                    const int = op.make(undefined);
                    int.previnterpretation = def;
                    int.vertical = other.vertical;
                    int.horizonal = other.horizonal;
                    int.offset = other.offset;
                    int.root = def.root;
                    int.program = other.program;
                    interpretations.push(int);
                }
                //if (interpretations.length) {
                context.push(interpretations);
                //}
            }
            acc.push(context);
            return acc;
        }, []);
        const reordered = newprogram.reduce((acc, tree) => {
            // ツリー間の処理の優先度を決定する
            for (let interpretations of tree) {
                for (let interpretation of interpretations) {
                    if (interpretation) {
                        acc.push(interpretation);
                    }
                }
            }
            return acc;
        }, []).sort((l, r) => {
            const priority = r.priority - l.priority;
            if (priority) {
                return priority;
            }
            const root = l.root.horizonal - r.root.horizonal;
            if (!root) {
                // 同じ木
                return l.horizonal - r.horizonal;
            }
            if (l.order == r.order) {
                if (l.order == this.config.join.order.right) {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                return root;
            }
            return l.horizonal - r.horizonal;
        });

        const first = reordered.find((interpretation) => {
            // interpretationはnewprogram作成時に作った仮想の演算子
            // 各ツリーが左右に伸ばしうる残りの手数
            let left = interpretation.left;
            let right = interpretation.right;
            let lefttree = interpretation.root.lefttree;
            // 元々の意味が空白だった場合、自身のツリーを食える
            const prev = interpretation.previnterpretation;
            if (prev) {
                const blank = prev.type == itemtype.types().blank;
                if (blank) {
                    if (interpretation.horizonal < prev.root.horizonal && prev.root.priority >= interpretation.priority) {
                        // 元の木の根の左側にいるので、右手で自身の根を掴める
                        right--;
                    } else if (interpretation.horizonal > prev.root.horizonal && prev.root.priority >= interpretation.priority) {
                        // 元の木の根の右側にいるので、左手で自身の根を掴める
                        left--;
                    }
                }
            }
            while (left) {
                if (!lefttree) {
                    break;
                }
                if (lefttree.priority >= interpretation.priority) {
                    lefttree = lefttree.lefttree;
                    left--;
                } else {
                    break;
                }
            }
            if (left > 1) {
                return false;
            }
            let righttree = interpretation.root.righttree;
            while (right) {
                if (!righttree) {
                    break;
                }
                if (righttree.priority >= interpretation.priority) {
                    righttree = righttree.righttree;
                    right--;
                } else {
                    break;
                }
            }
            if (right > 1) {
                return false;
            }
            if (left + right < 1) {
                return true;
            }
            if (left + right == 1 && interpretation.priority <= interpretation.root.priority) {
                if (left && interpretation.root.lefttree) {
                    const tree = interpretation.root.lefttree.nodes;
                    // 左のツリーの右側の要素の優先度より低いならば入り込める
                    const l = tree.slice().sort((l, r) => { return r.horizonal - l.horizonal }).find(v => true);
                    if (l && interpretation.priority < l.priority) {
                        return true;
                    }
                } else if (right && interpretation.root.righttree) {
                    const tree = interpretation.root.righttree.nodes;
                    // 右のツリーの左側の要素の優先度より低いならば入り込める
                    const r = tree.slice().sort((l, r) => { return l.horizonal - r.horizonal }).find(v => true);
                    if (r && interpretation.priority < r.priority) {
                        return true;
                    }
                }
            }
            return false;
        });

        if (first) {
            // 結合可能な要素があるので、ツリーを再構成
            const replace = this.program[first.horizonal][first.vertical];
            const prog = this.reprogram(roots, replace);
            return this.retree(prog);
        }
        return roots;
    }

    squash(program, start, interpretations = []) {
        let nexter;
        for (let i = 0; i < program.length; i++) {
            const horizonal = start + i;

            for (let j = 0; j < program[i].length; j++) {
                const vertical = program[i].length - 1 - j;
                const op = program[i][vertical];
                if (!op) {
                    myconsole.red("undefined code!!");
                    continue;
                }

                if (op.invalid || !op.finished) {
                    continue;
                }
                const interpretation = interpretations.find(def => def.horizonal == op.horizonal);
                if (interpretations.length && !interpretation) {
                    myconsole.red("Error!!", op.fullgrammer, op.define.first, op.horizonal);
                }

                if (interpretation && interpretation.vertical < op.vertical) {
                    op.invalid = true;
                } else if (nexter && (horizonal < nexter.horizonal)) {
                    if (op.vertical > nexter.absolute(horizonal).vertical) {
                        op.invalid = true;
                    } else {
                        program[i][vertical] = nexter.absolute(horizonal);
                    }
                } else if (nexter && (nexter.horizonal == horizonal)) {
                    if (nexter.vertical < op.vertical) {
                        op.invalid = true;
                    } else if (nexter.vertical == op.vertical) {
                        nexter = nexter.nexter;
                        break;
                    }
                } else if (!nexter && op.nexter && !op.invalid) {
                    // nexterのindexが未定義ならそのnexterはもう閉じようがないのでivalid
                    if (!op.finished) {
                        op.invalid = true;
                    } else {
                        nexter = op.nexter;
                        break;
                    }
                }
            }
        }
    }

    reprogram(roots, replace) {
        // rootsを一本のプログラムに変換
        let r = replace;
        let c = 0;
        const interpretations = roots.reduce((acc, root) => {
            c++;
            const nodes = []
            let rec = (node, rec) => {
                if (r && node.horizonal == r.horizonal) {
                    nodes.push(r);
                } else {
                    nodes.push(node);
                }
                for (let child of node.allchildren) {
                    // 直接の子供
                    rec(child, rec);
                }
                for (let child of node.allchildtrees) {
                    // nexterとしての子供
                    rec(child, rec);
                }
                if (r && node.horizonal == r.horizonal) {
                    if (!r.nexter) {
                        return;
                    }
                    r = r.nexter;
                    rec(r, rec);
                } else {
                    if (!node.nexter) {
                        return;
                    }
                    rec(node.nexter, rec);
                }
            };
            rec(root, rec);
            for (let node of nodes) {
                acc.push(node);
            }
            return acc;
        }, []).sort((l, r) => {
            if (l.horizonal == r.horizonal) {
                myconsole.red("Violation!", l.horizonal, l.root.horizonal, r.root.horizonal);
            }
            return l.horizonal - r.horizonal;
        });
        const start = interpretations.find(v => true).horizonal;
        const end = start + interpretations.length;
        const program = this.extraction(this.program, start, end);

        this.squash(program, start, interpretations);

        const contexts = this.reorder(program);
        const completes = Array(program.length);
        completes.fill(false);
        for (let context of contexts) {
            this.minstruct(context, program, completes, start);
        }
        if (completes.includes(false)) {
            myconsole.red("Incomprehensible operators exist");
            const fails = completes.reduce((acc, cur, idx) => {
                if (!cur) {
                    acc.push(start + idx);
                }
                return acc;
            }, []);
            myconsole.red(fails);
        }

        return program;
    }

    // （ほとんど）フラットな状態の式から最小構成のツリー一覧を作成する
    mintrees(start, end) {
        if (!start) {
            start = 0;
        }
        if (end === undefined) {
            end = this.program.length;
        }
        // フラットな状態の式をコピー
        const program = this.extraction(this.program, start, end);

        // 既に無効な解釈の削除と囲み系の事前計算済み解釈の注入
        this.squash(program, start);

        // contexts : 優先度毎にまとめた解釈群
        const contexts = this.reorder(program);
        const completes = Array(program.length);
        completes.fill(false);
        // 自身以上の優先度の解釈を近隣から探す
        for (let context of contexts) {
            this.minstruct(context, program, completes, start);
        }
        if (completes.includes(false)) {
            myconsole.red("Incomprehensible operators exist");
            const fails = completes.reduce((acc, cur, idx) => {
                if (!cur) {
                    acc.push(start + idx);
                }
                return acc;
            }, []);
            myconsole.red(fails);
        }

        return program;
    }

    // 依存解決
    dependency(start, end) {
        if (!start) {
            start = 0;
        }
        if (end === undefined) {
            end = this.program.length;
        }
        const program = this.mintrees(start, end);
        const trees = this.retree(program);
        const nodes = trees.reduce((acc, cur) => {
            for (let node of cur.allnodes) {
                acc.push(node);
            }
            return acc;
        }, []);
        nodes.map((v, idx, self) => {
            if (self.slice(idx + 1).find(n => v.horizonal == n.horizonal)) {
                myconsole.red("Duplication interpretation");
                console.log(v.horizonal);
            }
        });
        return trees;
    }

    minstruct(context, program, completes, start) {
        //  context  [interpretation, interpretation, interpretation,...], <- same priority
        //              old -----------------------------------> new
        //  start : 実際のプログラム上(this.program)での検索位置
        //  completes : あるindexの演算子が解釈可能な定義を発見済みである事を示す配列

        const search = (self, order) => {
            if (completes[self.horizonal - start]) {
                return;
            }

            // 自身が無効な命令ならばなにもしない。
            if (self.invalid) {
                return;
            } else if (!self.finished) {
                self.invalid = true;
                return;
            }

            // self: 1つの解釈
            // order: 探索方向。true: 左方向 false: 右方向
            const step = order ? -1 : 1;
            // 解釈が持つindex情報を今の範囲内の値に置換
            let index = self.horizonal - start;
            let i = 1;
            while (1) {
                // 隣接要素のindexを計算
                const j = index + i * step;

                if ((step == -1 && j > index) || (step == 1 && j < index)) {
                    // ここはエラー
                    break;
                }
                // 想定の範囲を超えるようなら終了
                if (j < 0 || program.length <= j) {
                    break;
                }

                // 優先度の高い順に文脈を並び変える。
                const neighbors = program[j].slice().reverse();
                if (
                    !neighbors.find(def => {
                        return def && !def.invalid;
                    }) || neighbors.find(def => {
                        return def && !def.invalid;
                    }).priority < self.priority
                ) {
                    // 隣接要素の最大優先度が自身より低いとき、その要素を超える方法はない。
                    break;
                }

                // 既に完了しているか確認
                let complete = ((step == -1) && !self.left || (step == 1) && !self.right);
                let blank = false;
                for (let neighbor of neighbors) {
                    // より優先度の高い子を探す
                    if (self.priority > neighbor.priority) {
                        // 自身の優先度より低い要素は無視。これ以降も総じて優先度が低いのでbreak
                        break;
                    } else if (neighbor.invalid) {
                        // 別ルートでinvalid指定されている要素も無視
                        continue;
                    } else if (!neighbor.finished) {
                        // 現段階で閉じていないならば生涯閉じる事はない。
                        neighbor.invalid = true;
                        continue;
                    } else if ((neighbor.left) || (neighbor.right)) {
                        // 隣接要素が子を揃えられていないならば、その隣接要素は地雷なので無視
                        continue;
                    } else if (neighbor.parent && (neighbor.parent.horizonal != self.horizonal)) {
                        // 隣接要素が親を持ち、その親のindexが自身と異なるとき
                        // 次の探索範囲は少なくともその親以降とする
                        i = Math.abs(neighbor.parent.horizonal - self.horizonal) - 1 > i ?
                            Math.abs(neighbor.parent.horizonal - self.horizonal) - 1 : i;

                        break;
                    } else {
                        // 要素をセット（多分できると思っているけれど、出来なかったら関数がはじく予定）
                        if (step == -1) {
                            self.setleft(neighbor);
                        } else {
                            self.setright(neighbor);
                        }
                        blank = (neighbor.type == itemtype.types().blank);
                        if (neighbor.nexter && neighbor.nexter.horizonal !== undefined) {
                            i = Math.abs(neighbor.nexter.horizonal - self.horizonal) > i ?
                                Math.abs(neighbor.nexter.horizonal - self.horizonal) : i;
                        }
                        // 優先度の高い命令に優先的に親として結合するのでbreak
                        break;
                    }
                }
                i++;
                // 探索方向の必要子要素が0になっても終了
                // ただし、隣の要素が空白要素の場合、まだ考える
                if (!blank && complete) {
                    break;
                }


            }
        };

        for (let i = 0; i < context.length; i++) {
            let interpretation = context[i];
            if (completes[interpretation.horizonal - start]) {
                continue;
            }

            if (interpretation.order == this.config.join.order.right) {
                let next = 0;
                while (interpretation.order == this.config.join.order.right) {
                    if (i + next >= context.length) {
                        break;
                    }
                    interpretation = context[i + next];
                    next++;
                }
                for (let j = 0; j < next; j++) {
                    interpretation = context[i + next - j - 1];
                    // 右結合の要素は最新の要素の左側から検証する
                    search(interpretation, true);
                }
                i += next - 1;
            } else {
                // 左結合の要素は古い要素の右側から検証する
                search(interpretation, false);
            }
        }
        for (let i = 0; i < context.length; i++) {
            let interpretation = context[i];
            if (completes[interpretation.horizonal - start]) {
                continue;
            }
            if (interpretation.order == this.config.join.order.right) {
                let next = 0;
                while (interpretation.order == this.config.join.order.right) {
                    if (i + next >= context.length) {
                        break;
                    }
                    interpretation = context[i + next];
                    next++;
                }
                for (let j = 0; j < next; j++) {
                    interpretation = context[i + next - j - 1];
                    if (!completes[interpretation.horizonal - start]) {
                        search(interpretation, false);
                        if (interpretation.left || interpretation.right) {
                            interpretation.invalid = true;
                        } else {
                            completes[interpretation.horizonal - start] = true;
                        }
                    }
                }
                i += next - 1;
            } else {
                if (!completes[interpretation.horizonal - start]) {
                    search(interpretation, true);
                    if (interpretation.left || interpretation.right) {
                        interpretation.invalid = true;
                    } else {
                        completes[interpretation.horizonal - start] = true;
                    }
                }
            }
        }
    }

    context(keyword) {
        const current = this.current(keyword);
        if (current.length) {
            return current;
        }
        let open = false;
        const reserved = [];
        for (let define of this._constant) {
            if (define.firstmatch(keyword)) {
                const op = define.make(keyword);
                if (op) {
                    current.push(op);
                    if (op.nexter) {
                        open = true;
                    }
                    if (define.grammer instanceof Array) {
                        reserved.push(op);
                    }
                }
            }
        }
        const recurrent = reserved.length ? reserved : current;
        if (open) {
            const con = new context(keyword);
            con.context = recurrent;
            this._temporary.unshift(con);
        }
        return recurrent;
    }

    current(keyword) {
        // 自身の意味が通じないと分かる瞬間
        // ・共通の開始子を持つ兄弟の中で、自分は読み出されず優先度の高い兄弟が読み出された
        // ・共通の開始子を持つ兄弟の中で、自分より優先度の低い要素が閉じた上に上位の文脈の結合子に至った
        let i;
        for (let index = 0; index < this._temporary.length; index++) {
            const contexts = this._temporary[index].contexts;
            if (keyword in contexts) {
                const nexters = contexts[keyword].context.sort((l, r) => {
                    return r.priority - l.priority;
                }); // [interpretation, interpretation, interpretation,...];
                this._temporary[index] = new context(keyword);

                const roots = this.dependency(nexters.find(v => !v.invalid).parent.horizonal + 1);
                const length = (() => {
                    if (roots.length != 1) {
                        return roots.length;
                    }
                    if (roots[0].type == itemtype.types().blank) {
                        return 0;
                    }
                    return 1;
                })();
                this._temporary[index].context = nexters.filter((op) => {
                    if (op) {
                        if (length != op.left) {
                            op.invalid = true;
                            return false;
                        } else {
                            op.childtrees = roots;
                        }
                        return !op.invalid;
                    }
                    return false;
                });
                i = index;
                break;
            }
        }
        if (i === undefined) {
            return [];
        }
        while (i) {
            this._temporary.shift();
            i--;
        }
        return this._temporary[0].context;
    }

    get program() {
        return this._program;
    }

    constructor(config) {
        this.config = config;
        this._constant = config.ops.constant;   // [opdefine, opdefine,]
        this._temporary = []; // [[interpretation2], [interpretation2, interpretation2]]
        this._program = []; // [[interpretation2], [interpretation2, interpretation2]]
    }
}

// 命令の定義集を読み込んで読み込みの補助などを少しするクラス
class ops {
    get constant() {
        if (this._all === undefined) {
            this._all = this.opdefines.reduce((acc, cur) => {
                for (let def of cur) {
                    acc.push(def);
                }
                return acc;
            }, []);
        }
        return this._all;
    }
    match(word, defines = null) {
        if (defines == null) {
            defines = this.constant;
        }
        const match = [];
        for (let define of defines) {
            if (define.match(word)) {
                match.push(define);
            }
        }
        return match;
    }

    constructor(opdefines) {
        // opdefines: [               priority
        //    [opdefine, opdefine],     low
        //    [opdefine],                |
        //    [opdefine],               high
        // ];
        this.opdefines = opdefines;
        //this.oporder = {};
        //this.mostoffset = {};
        let priority = 0;

        for (let ops of opdefines) {
            for (let opdefine of ops) {
                opdefine.priority = priority;
            }
            priority++;
        }
        this.offset = priority;
    }
}

// 計算機クラス
class calculator {
    constructor(text) {
        this.config = new config();
        if (text instanceof mystr) {
            this.text = text;
        } else {
            this.text = new mystr(text);
        }
        this.parse();
    }

    parse() {
        this.result = new contexts(this.config);

        while (this.text.length > 0) {
            const read = this.config.getword(this.text);
            this.result.push(read.keyword);
        }
        return this.result;
    }
}

module.exports = {
    itemtype,
    calculator
};
