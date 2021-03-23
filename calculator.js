'use strict';
const performance = require('perf_hooks').performance;

// 演算子の定義など、解析器が必要とする基礎情報をまとめて保持するクラス
class config {
    constructor(opdefs, punctuations, puncblanks, hooks, reserved, controls) {
        this.join = module.exports.join.orders;
        this.types = itemtype.types();
        this.opdefine = (grammer, order, formula, groupid) => {
            return new opdefine(grammer, order, formula, groupid);
        }
        this.ctrldefine = (grammer, formula, groupid) => {
            return new ctrldefine(grammer, formula, groupid);
        };
        this.reserved = reserved || ['false', 'true', 'undefined', 'return', 'var', 'break'];

        this.puncblanks = puncblanks || ["\r\n", "\n"]; // 空白または文末として解釈される文字群
        this.punctuations = punctuations || [';']; // 文末として解釈される文字群
        this.hooks = hooks || {};
        this.controls = controls || 
        [
            // 返り値
            this.ctrldefine(
                ['return'],
                (argv, meta, self) => {
                    meta.stop = true;
                    meta.stopinfo = {
                        name: 'return',
                        return: true
                    };
                    if (argv.length) {
                        return argv[0];
                    }
                    return new interpretation();
                },
                "return"
            ),
                // same priority group
            this.ctrldefine(
                ["break"],
                (argv, meta) => {
                    meta.stop = true;
                    meta.stopinfo = {
                        name: 'break',
                        break: true
                    };
                    return undefined;
                },
                "break"
            ),
            this.ctrldefine(
                ["if", "(", 1, ")", "{", 0.5, "}"],
                (argv, meta) => {
                    if (argv[0].value) {
                        meta.success = true;
                        const val = argv[1].value;
                        meta.stop = argv[1].meta.stop;
                        meta.stopinfo = argv[1].meta.stopinfo;
                        return val;
                    }
                    meta.success = false;
                    return undefined;

                },
                "if"
            ),

            this.ctrldefine(
                [1, "else", "if", "(", 1, ")", "{", 1, "}"],
                (argv, meta) => {
                    const val = argv[0].value;
                    meta.success = true;
                    meta.type = argv[0].meta.type;
                    if (argv[0].meta.success) {
                        return val;
                    } else if (argv[1].value) {
                        const val = argv[2].value;
                        meta.type = argv[2].meta.type;
                        return val;
                    }
                    meta.success = false;
                    return undefined;

                },
                "if"
            ),
            this.ctrldefine(
                [1, "else", "{", 1, "}"],
                (argv, meta) => {
                    const val = argv[0].value;
                    meta.type = argv[0].meta.type;
                    if (argv[0].meta.success) {
                        return val;
                    } else {
                        const val = argv[1].value;
                        meta.type = argv[1].meta.type;
                        return val;
                    }
                },
                "if"
            ),
            this.ctrldefine(
                [1, "final", "{", 1, "}"],
                (argv) => {
                    const val = argv[0].value;
                    const type = argv[0].type;
                    if (argv[0].meta.success) {
                        if (type == this.types.ret) {
                            return val;
                        }
                        return argv[1].value;
                    }
                },
                "if"
            ),

            this.ctrldefine(
                ["for", "(", 1, ")", "{", 1, "}"],
                (argv, meta) => {
                    for (let i = 0; i < argv[0].value; i++) {
                        const val = argv[1].value;
                        if (argv[1].meta.stop) {
                            if (!argv[1].meta.stopinfo.break) {
                                meta.stop = argv[1].meta.stop;
                                meta.stopinfo = argv[1].meta.stopinfo;
                            }
                            return val;
                        }
                    }
                    return undefined;
                },
                "for"
            ),

            this.ctrldefine(
                ["for", "(", 1, ";", 1, ";", 1, ")", "{", 0.5, "}"],
                (argv, meta) => {                  
                    for (argv[0].value; argv[1].value; argv[2].value) {
                        const val = argv[3].value;
                        if (argv[3].meta.stop) {
                            if (!argv[3].meta.stopinfo.break) {
                                meta.stop = argv[3].meta.stop;
                                meta.stopinfo = argv[3].meta.stopinfo;
                            } else {
                                argv[3].meta.stop = false;
                                return;
                            }
                            return val;
                        }
                    }
                    return;
                },
                "for"
            ),
            ];

        // *****同一の演算子の場合、項数の少ない演算子ほど優先度を高くすること*****
        // 例えば + 1 と 1 + 1 の場合、単項の方が優先度が高い
        // x ? y : z と a ? b の場合 a ? b の方が優先度が高い
        // リテラルもここで定義する。詳しくはdecやstringの要素を確認
        // 読み込みは『演算子として解釈可能な最長の単語』単位で行われる
        this.opdefs = opdefs || [
            [
                this.opdefine(
                    ["log", "(", 1, ")"],
                    this.join.order.left,
                    (argv, meta) => {
                        console.log(argv[0].value);
                        return undefined;
                    },
                    "log"
                ),
            ],
            // priority order
            // next priority group
            // 宣言
            [
                this.opdefine(
                    ["var", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
                            const success = self.rootnamespace.declare(name, value, false, 'object');
                            if (!success) {
                                argv[0].meta.stop = true;
                                argv[0].meta.stopinfo = {
                                    throw: true,
                                    name: 'throw',
                                };
                            }
                        };
                        argv[0].meta.deftypename = 'object';
                        argv[0].value;
                        return undefined;
                    },
                    "{}"
                ),

                this.opdefine(
                    ["drop", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
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
                                        error : 1,
                                        msg: 'drop is out of range.(variable:' + name + ')'
                                    };
                                }
                                return {error : 0};
                            })
                        };
                        argv[0].meta.deftypename = 'drop';
                        argv[0].value;
                        return undefined;
                    },
                    "{}"
                ),
                this.opdefine(
                    ["drops", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
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
                    "{}"
                ),

                this.opdefine(
                    ["attribute", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        argv[0].meta.declare = (name, value = 0) => {
                            self.rootnamespace.declare(name, value, false, 'attribute')
                        };
                        argv[0].meta.deftypename = 'attribute';
                        argv[0].value;
                        return undefined;
                    },
                    "{}"
                ),
            ],

            // エラーハンドリング
            [
                this.opdefine(
                    ["try", "{", 1, "}", "catch", "(", 1, ")", "{", 1, "}"],
                    this.join.order.left,
                    (argv, meta) => {
                        const val = argv[0].value;
                        meta.type = argv[0].meta.type;
                        if (argv[0].meta.type == this.types.esc) {
                            const v = argv[2].value;
                            meta.type = argv[2].meta.type;
                            return v;
                        }
                        return val;
                    },
                    "try"
                ),


            ],
            [
                this.opdefine(
                    ["throw", "(", 1, ")"],
                    this.join.order.left,
                    (argv) => {
                        argv[0].meta.type = this.types.esc;
                        return argv[0];
                    },
                    "throw"
                )
            ],


            // 区切り文字
            [
                this.opdefine(
                    [1, ",", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        if (meta.declare) {
                            argv[0].meta.declare = (name, value) => {
                                meta.declare(name, value);
                            }
                            argv[1].meta.declare = (name, value) => {
                                meta.declare(name, value);
                            }
                        }
                        const val = argv[0].value;
                        if (val instanceof internalArray) {
                            return val.concat([argv[1].value]);
                        }
                        return new internalArray(val, argv[1].value);
                    },
                    ",",
                ),
            ],
            [
                // 区切り文字
                this.opdefine(
                    [1, ","],
                    this.join.order.left,
                    (argv, meta, self) => {
                        if (meta.declare) {
                            argv[0].meta.declare = (name, value) => {
                                meta.declare(name, value);
                            }
                        }
                        const val = argv[0].value;
                        if (val instanceof internalArray) {
                            return val;
                        }
                        const result = new internalArray();
                        result.push(val);
                        return result;
                    },
                    ","
                ),
            ],
            // 代入
            [
                this.opdefine(
                    [1, "=", 1],
                    this.join.order.right,
                    (argv, meta, self) => {
                        argv[1].meta.deftypename = meta.deftypename;
                        const val = argv[1].value;
                        const value = {
                            value: val,
                            typename: argv[1].typename
                        };
                        if (meta.declare) {
                            argv[0].meta.declare = (name) => {
                                meta.declare(name, value);
                            }
                        } else {
                            argv[0].meta.set = (name, property) => {
                                if (property) {
                                    return property.set(name, value);
                                }
                                return argv[0].rootnamespace.set(name, value);
                            }
                        }
                        return argv[0].value;
                    },
                    "{}"
                ),
            ],


            [// 条件演算
                
                this.opdefine(
                    [1, "?", 1, ":", 1],
                    this.join.order.right,
                    (argv) => {
                        return argv[0].value ? argv[1].value : argv[2].value;
                    },
                    "?"
                ),
            ],
            [
                // 
                this.opdefine(
                    [1, ":", 1],
                    this.join.order.right,
                    (argv, meta) => {
                        const property = meta.self.property;
                        const value = {
                            value: argv[1].value,
                        };
                        argv[0].meta.declare = (name) => {
                            property.declare(name, value, false);
                        }
                        argv[0].value;
                        return undefined;
                    },
                    ":"
                ),
            ],
            [// 論理演算3
                
                this.opdefine(
                    ["!", 1],
                    this.join.order.right,
                    (argv) => {
                        return !argv[0].value;
                    },
                    "!"
                ),
                // 論理演算3
                this.opdefine(
                    ["not", 1],
                    this.join.order.right,
                    (argv) => {
                        return !argv[0].value;
                    },
                    "not"
                ),
            ],
            [// 論理演算2
                
                this.opdefine(
                    [1, "||", 1],
                    this.join.order.left,
                    (argv) => {
                        // 短絡処理
                        if (argv[0].value) {
                            return argv[0].value;
                        }
                        return argv[1].value;
                    },
                    "||"
                ),
            ],
            [// 論理演算2
                
                this.opdefine(
                    [1, "&&", 1],
                    this.join.order.left,
                    (argv) => {
                        // 短絡処理
                        if (!argv[0].value) {
                            return argv[0].value;
                        }
                        return argv[1].value;
                    },
                    "&&"
                ),
            ],
            [// bit演算
                
                this.opdefine(
                    ["~", 1],
                    this.join.order.left,
                    (argv) => {
                        return ~argv[0].value;
                    },
                    "~"
                ),
            ],
            [// bit演算
                
                this.opdefine(
                    [1, "|", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value | argv[1].value;
                    },
                    "|"
                ),
            ],
            [// bit演算
                
                this.opdefine(
                    [1, "&", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value & argv[1].value;
                    },
                    "&"
                ),
            ],

            [// 比較演算
                
                this.opdefine(
                    [1, ">", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value > argv[1].value;
                    },
                    ">"
                ),
                this.opdefine(
                    [1, "<", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value < argv[1].value;
                    },
                    "<"
                ),
                this.opdefine(
                    [1, ">=", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value >= argv[1].value;
                    },
                    ">="
                ),
                this.opdefine(
                    [1, "<=", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value <= argv[1].value;
                    },
                    "<="
                ),

                this.opdefine(
                    [1, "[==]", 1],
                    this.join.order.left,
                    (argv) => {
                        const arr = argv[0].value;
                        const val = argv[1].value;
                        return arr.map(v => v == val);
                    },
                    "<="
                ),
            ],

            [// 四則演算1
                
                this.opdefine(
                    [1, "+", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value + argv[1].value;
                    },
                    "+"
                ),
                this.opdefine(
                    [1, "-", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value - argv[1].value;
                    },
                    "-"
                ),
            ],

            [// 四則演算2
                
                this.opdefine(
                    [1, "*", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value * argv[1].value;
                    },
                    "*"
                ),
                this.opdefine(
                    [1, "/", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value / argv[1].value;
                    },
                    "/"
                ),
                this.opdefine(
                    [1, "%", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value % argv[1].value;
                    },
                    "%"
                ),
            ],

            [// 四則演算1+(単項)
                
                this.opdefine(
                    ["+", 1], // ちょっと除け中
                    this.join.order.right,
                    (argv) => {
                        return argv[0].value;
                    },
                    "+"
                ),
                this.opdefine(
                    ["-", 1],
                    this.join.order.right,
                    (argv) => {
                        return -argv[0].value;
                    },
                    "-"
                ),
            ],

            // 配列・辞書・関数
            [
                this.opdefine(
                    ["(", 1, ")", "=>", "{", 1, "}"],
                    this.join.order.right,
                    (argv) => {
                        return (args) => {
                            return argv[1].value;
                        };
                    },
                    "{}"
                ),


            ],

            // アクセサ
            [

                this.opdefine(
                    [1, "[", "@", 1, "]"],
                    this.join.order.left,
                    (argv, meta) => {
                        const val = argv[0].value;
                        if (val instanceof property) {
                            const property = val;
                            return argv[1].map(v => {
                                v.property = property;
                                return v.value;
                            });
                        }
                        const arr = val;
                        return argv[1].value.map(v => arr[v]);
                    },
                    "[@]"
                ),

                this.opdefine(
                    [1, "{", "@", 1, "}"],
                    this.join.order.left,
                    (argv, meta) => {
                        const key = argv[1].value;
                        return argv[0].value.map(v => v.value[key]);
                    },
                    "{@}"
                ),

                this.opdefine(
                    [1, "@", 1],
                    this.join.order.left,
                    (argv, meta) => {
                        argv[1].value;
                        const key = argv[1].name;
                        const arr = argv[0].value;
                        return arr.map(v => v.value[key]);
                    },
                    "{@}"
                ),
                // operator
                // brackets
                this.opdefine(
                    [1, "(", 1, ")"],
                    this.join.order.left,
                    (argv, meta) => {
                        const exe = argv[0].value(argv[1].value);
                        if (exe === undefined) {
                            return undefined;
                        }
                        meta.type = exe.meta.type;
                        return exe.value;
                    },
                    "()"
                ),

                this.opdefine(
                    [1, "[", 1, "]"],
                    this.join.order.left,
                    (argv, meta) => {
                        const val = argv[0].value;
                        if (val instanceof property) {
                            const property = val
                            argv[1].property = property;
                            argv[1].value;
                            const name = argv[1].name;
                            meta.ref = property.resolve(name);
                            return meta.ref.value;
                        } else if (val instanceof Array) {
                            return val[argv[1].value];
                        }
                    },
                    "[]"
                ),

                this.opdefine(
                    [1, "?", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        const space = argv[0].value;
                        if (!(space instanceof property)) {
                            return undefined;
                        }
                        argv[1].property = space;
                        self.property = space;
                        if (meta.set) {
                            argv[1].meta.set = meta.set;
                        }
                        argv[1].value;
                        const name = argv[1].name;
                        meta.ref = space.resolve(name);
                        if (meta.ref) {
                            return meta.ref.value;
                        }
                        return undefined;
                    },
                    "?"
                ),
                this.opdefine(
                    [1, ".", 1],
                    this.join.order.left,
                    (argv, meta, self) => {
                        const property = argv[0].value;
                        argv[1].property = property;
                        self.property = property;
                        if (meta.set) {
                            argv[1].meta.set = (name) => {
                                meta.set(name, property);
                            }
                        }
                        const ret = argv[1].value;
                        return ret;
                    },
                    "."
                ),
            ],

            // 宣言
            [
                // values
                // brackets
                this.opdefine(
                    ["(", 1, ")"],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value;
                    },
                    "()"
                ),
                this.opdefine(
                    ["[", 0.5, "]"],
                    this.join.order.left,
                    (argv, meta) => {
                        if (argv[0].meta.dummy) {
                            return [];
                        }
                        const val = argv[0].value;
                        if (val instanceof internalArray) {
                            return [].concat(val);
                        }
                        return [argv[0].value];
                    },
                    "[]"
                ),

                this.opdefine(
                    ["{", 0.5, "}"],
                    this.join.order.left,
                    (argv, meta) => {
                        if (argv[0].meta.dummy) {
                            return new property();
                        }
                        argv[0].property = new property();
                        argv[0].value;
                        return argv[0].property
                    },
                    "{}"
                ),
            ],

            // リテラルとか予約語とか
            [
                this.opdefine(
                    [1, (val, ptr) => {
                        const varreg = /^[a-zA-Z_][\w]*$/;
                        return val.match(varreg);
                    }],
                    this.join.order.left,
                    (argv, meta, self) => {
                        const val = argv[0].value;

                        const property = meta.property || self.rootnamespace;
                        const name = argv[0].meta.name + ' ' + self.operator; //val;
                        if (meta.declare) {
                            meta.declare(name);
                        }
                        if (meta.set) {
                            meta.set(name);
                        }
                        meta.name = name;
                        meta.ref = property.resolve(name);
                        if (meta.ref) {
                            return meta.ref.value;
                        }
                        return undefined;
                    },
                    "variable"
                ),
            ],
            [
                this.opdefine(
                    ["undefined"],
                    this.join.order.left,
                    () => {
                        return undefined;
                    },
                    "undefined"
                ),
                this.opdefine(
                    ["true"],
                    null,
                    () => {
                        return true;
                    },
                    "bool"
                ),
                this.opdefine(
                    ['false'],
                    null,
                    () => {
                        return false;
                    },
                    "bool"
                ),
                this.opdefine(
                    (val) => {
                        const hexreg = /^(0x[\d]+)$/;
                        if (val.match(hexreg)) {
                            return true;
                        }
                        return false;
                    },
                    this.join.order.left,
                    (val) => {
                        return parseInt(val, 16);
                    },
                    "hex"
                ),
                this.opdefine(
                    (val) => {
                        const decreg = /^([\d]+(\.)?([\d]+)?)$/;
                        if (val.match(decreg)) {
                            return true;
                        }
                        return false;
                    },
                    this.join.order.left,
                    (val, meta, self) => {
                        return Number(self.operator);
                    },
                    "dec"
                ),
                this.opdefine(
                    (val, ptr) => {
                        const varreg = /^[a-zA-Z_][\w]*$/;
                        return val.match(varreg);
                    }, 
                    this.join.order.left,
                    (val, meta, self) => {

                        const property = meta.property || self.rootnamespace;
                        const name = self.operator;
                        if (meta.declare) {
                            meta.declare(name);
                        }
                        if (meta.set) {
                            meta.set(name);
                        }
                        meta.name = name;
                        meta.ref = property.resolve(name);
                        if (meta.ref) {
                            return meta.ref.value;
                        }
                        return undefined;
                    },
                    "variable"
                ),

                this.opdefine(
                    (val) => {
                        // 文字列
                        const isEscape = (text, index) => {
                            let result = 0;
                            for (let i = index; i > 0; i--) {
                                if (text[i] == "\\") {
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
                    this.join.order.left,
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
                    "string"
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
                    this.join.order.nojoin,
                    null,
                    "space"
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
                    this.join.order.nojoin,
                    null,
                    "space"
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
                    this.join.order.nojoin,
                    null,
                    "space"
                ),
            ],
        ];
        this.ops = new ops(this.opdefs, this.punctuations, this.puncblanks, this.hooks, this.reserved, this.controls);
    }
    get predict() {
        if (this._predict === undefined) {
            this.predict = false;
        }
        return this._predict;
    }
    set predict(val) {
        this._predict = val;
    }
    // text : mystrクラス
    // テキストを先頭から読み込んで、最長の解釈が可能な演算子を取得
    getword(text) {
        let word = text.index(0);
        let matched = this.ops.match(word, undefined, text);
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
            matched = this.ops.match(word, matched, text);
        };
        return result;
    }
}

class myconsole {
    // color code refference: https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
    static standard(elm) {
        if (elm === undefined) {
            return "\u001b[90m" + "undefined" + '\u001b[0m';
        } if ((typeof elm) == "string") {
            return elm;
        } else if ((typeof elm) == "number") {
            return '\u001b[32m' + elm + '\u001b[0m';
        } else if (elm instanceof Array) {
            return myconsole.array(elm);
        } else if (elm instanceof Object) {
            return myconsole.object(elm);
        } else if ((typeof elm) == "boolean") {
            if (elm) {
                return '\u001b[32m' + "true" + '\u001b[0m';
            } else {
                return '\u001b[32m' + "false" + '\u001b[0m';
            }
        }
        return undefined;
    }
    static array(arr) {
        let text = "[ ";
        const len = arr.length;
        let i = 0;
        for (let elm of arr) {
            const str = (() => {
                if ((typeof elm) == "string") {
                    return '\u001b[32m' + "'" + elm + "'" + '\u001b[0m';
                } else if ((typeof elm) == "number") {
                    return '\u001b[33m' + elm + '\u001b[0m';
                }
                return elm;
            })();
            const tmp = myconsole.standard(str);
            if (tmp !== undefined) {
                text += tmp;
            }
            i++;
            if (i < len) {
                text += ", ";
            }
        }
        text += " ]";
        return text;
    }
    static object(obj) {
        let text = "{ ";
        const len = obj.length;
        let i = 0;
        for (let key of Object.keys(obj)) {
            let tmp = (() => {
                if ((typeof key) == "string") {
                    return '\u001b[32m' + "'" + key + "'" + '\u001b[0m';
                } else if ((typeof key) == "number") {
                    return '\u001b[33m' + key + '\u001b[0m';
                }
                return key;
            })();
            tmp = myconsole.standard(tmp);
            if (tmp !== undefined) {
                text += tmp;
            }
            text += " : ";
            const elm = obj[key];
            tmp = (() => {
                if ((typeof elm) == "string") {
                    return '\u001b[32m' + "'" + elm + "'" + '\u001b[0m';
                } else if ((typeof elm) == "number") {
                    return '\u001b[33m' + elm + '\u001b[0m';
                }
                return elm;
            })();
            tmp = myconsole.standard(tmp);
            if (tmp !== undefined) {
                text += tmp;
            }
            i++;
            if (i < len) {
                text += ", ";
            }
        }
        text += " }";
        return text;
    }
    static log(arr) {
        const len = arr.length - 1;
        console.log(arr.reduce((acc, cur, idx) => {
            acc += myconsole.standard(cur);
            if (idx < len && !(acc.slice(-1)[0] == "\n")) {
                acc += " ";
            }
            return acc;
        }, ""));
    }


    static implmenterror() {
        const array = ["Maybe implematation error\r\n"];
        const reg = /(.*)([\r\n\n])$/;
        for (let i = 0; i < arguments.length; i++) {
            if ((typeof arguments[i]) == "string") {
                const m = arguments[i].match(reg);
                if (m) {
                    array.push('\u001b[33m' + m[1] + '\u001b[0m' + m[2]);
                } else {
                    array.push('\u001b[33m' + arguments[i] + '\u001b[0m');
                }
            } else {
                array.push(arguments[i]);
            }
        }
        myconsole.log(array);
    }


    static defineerror() {
        const array = [];
        const reg = /(.*)([\r\n\n])$/;
        for (let i = 0; i < arguments.length; i++) {
            if ((typeof arguments[i]) == "string") {
                const m = arguments[i].match(reg);
                if (m) {
                    array.push('\u001b[31m' + m[1] + '\u001b[0m' + m[2]);
                } else {
                    array.push('\u001b[31m' + arguments[i] + '\u001b[0m');
                }
            } else {
                array.push(arguments[i]);
            }
        }
        myconsole.log(array);
    }

    static programerror() {
        const array = [];
        const reg = /(.*)([\r\n\n])$/;
        for (let i = 0; i < arguments.length; i++) {
            if ((typeof arguments[i]) == "string") {
                const m = arguments[i].match(reg);
                if (m) {
                    array.push('\u001b[35m' + m[1] + '\u001b[0m' + m[2]);
                } else {
                    array.push('\u001b[35m' + arguments[i] + '\u001b[0m');
                }
            } else {
                array.push(arguments[i]);
            }
        }
        myconsole.log(array);
    }

    static red() {
        const array = []
        const reg = /(.*)([\r\n\n])$/;
        for (let i = 0; i < arguments.length; i++) {
            if ((typeof arguments[i]) == "string") {
                const m = arguments[i].match(reg);
                if (m) {
                    array.push('\u001b[31m' + m[1] + '\u001b[0m' + m[2]);
                } else {
                    array.push('\u001b[31m' + arguments[i] + '\u001b[0m');
                }
            } else {
                array.push(arguments[i]);
            }
        }
        myconsole.log(array);
    }

    static green() {
        const array = []
        const reg = /(.*)([\r\n\n])$/;
        for (let i = 0; i < arguments.length; i++) {
            if ((typeof arguments[i]) == "string") {
                const m = arguments[i].match(reg);
                if (m) {
                    array.push('\u001b[32m' + m[1] + '\u001b[0m' + m[2]);
                } else {
                    array.push('\u001b[32m' + arguments[i] + '\u001b[0m');
                }
            } else {
                array.push(arguments[i]);
            }
        }
        myconsole.log(array);
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
            myconsole.defineerror("Duplication enum value");
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

// ただの配列を使うと、内部用のものと外部用のものの区別が付かなくなることがあるので、明示的に内部用であることを示したいときはinternalArrayを使う。
class internalArray extends Array {
}

// 文字列操作用の自作クラス
class mystr {
    constructor(str) {
        this.value = str;
    }
    set value(val) {
        this._value = val;
        this.start = 0;
        this.end = this.last;
    }
    get value() {
        return this._value.slice(this.start, this.end);
    }
    get length() {
        return this._end - this.start;
    }
    get last() {
        return this._value.length;
    }
    get end() {
        return this._end;
    }
    set end(val) {
        this._end = val;
    }

    get start () {
        return this._start;
    }
    set start(val) {
        this._start = val;
    }

    array() {
        return;
        // current no use
        const array = [];
        for (let i = 0; i < this.length; i++) {
            array.push(this.value[i]);
        }
        return array;
    }

    index(i) {
        const index = i + this.start;
        if (-1 < index && index < this.last) {
            return this._value[index];
        }
        return null;
    }
    pop(len = 1) {
        // 末尾を取り出す
        const tmp = this._value.slice(this.end - len, this.end);
        this.end -= len;
        return tmp;
    }
    push(w) {
        return;
        // current no use
        for(let i = 0; i < w.length; i++) {
            this._value[this.end] = w[i];
            this.end++;
        }
        return this.value;
    }

    shift(len = 1) {
        let w = "";
        for (let i = 0; i < len; i++) {
            if (this.length == 0) {
                break;
            }
            const c = this._value[this.start];
            this.start++;
            w += c;
        }
        return w;
    }
    unshift(w) {
        // current no use
        //return this.value = w + this.value;
    }
    slice(s, e) {
        const start = s >= 0 ? this.start + s : this.end + s;
        const end = e === undefined ? this.end : (e >= 0 ? this.start + e: this.end + e);

        return this._value.slice(start, end);
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
        return undefined;
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
        //return undefined;
        if (!this._outputs || this._outputs.length == 0) {
            myconsole.defineerror("Output type undefined");
            return undefined;
        }
        if (node && !node.left && !node.right && !node._parent) {
            let dele = 0;
            for (let i = 0; i < this._outputs.length; i++) {
                if (i >= this.inputs.length || this.checkinput(this.inputs[i], node.args)) {
                    if (this._outputs[i] == this.types.delegate) {
                        return this._delegates[dele](node.args);
                    } else {
                        return this._outputs[i];
                    }
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
    static string(type) {
        const types = itemtype.types();
        for (let key of Object.keys(types)) {
            if (types[key] == type) {
                return key;
            }
        }
        return undefined;
    }

    static types() {
        let blank = myenum.define(0);
        let control, ret, br, esc;
        let number, string, bool, func, ref, array, object, through, delegate, parallel, notunavailable;
        let unsettled;
        let undef;

        const e = new myenum({
            blank,
            control,    // 句読点、if、forなどの制御構文用
            bool,
            number,
            string,
            func,
            ref,        // 参照を保持する型（変数）
            array,
            object,
            ret,            // return
            br,             // break
            esc,            // throw
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
        let nojoin = myenum.define(-1); // for blank
        let left;
        let right;

        this.enum = new myenum({
            nojoin,
            left,
            right,
        });
    }
    get order() {
        return this.enum.enum;
    }
}

class ctrldefine {
    constructor(grammer, formula, groupid) {
        this.order = module.exports.join.orders.order.left;
        this.grammer = grammer;
        this.formula = formula;
        this.groupid = groupid;
    }
    get grammer() {
        if (this.isfunction) {
            return [this._grammer];
        }
        return this._grammer;
    }
    set grammer(val) {
        this.isfunction = typeof val == 'function';
        this._grammer = val;
    }
    get formula () {
        return this._formula;
    }

    set formula (val) {
        this._formula = val;
    }
    addformula(left, right) {
        return (args, meta, self) => {
            const argv = args;
            if (left) {
                const val1 = argv[0].value;
                if (argv[0].meta.stop) {
                    meta.stop = true;
                    meta.stopinfo = argv[0].meta.stopinfo;
                    meta.retValue = val1;
                    return val1;
                }
            }
            const val2 = this.formula(argv.slice(left), meta, self);
            if (meta.stop) {
                meta.retValue = val2;
                return val2;
            }

            if (right) {
                const val3 = argv[argv.length  - 1].value;
                if (argv[argv.length - 1].meta.stop) {
                    meta.stop = true;
                    meta.stopinfo = argv[argv.length - 1].meta.stopinfo;
                    meta.retValue = val3;
                    return val3;
                }
            }
            meta.retValue = val2;
            return val2;
        }
    }
    get solo() {
        if (this.left || this.right) {
            return undefined;
        }
        return new opdefine(this.grammer, this.order, this.addformula(0, 0), this.groupid);
    }
    get bothone() {
        const left = Math.max(0, 1 - this.left);
        const right = Math.max(0, 1 - this.right);
        return new opdefine([left].concat(this.grammer).concat([right]), this.order,
            this.addformula(left, right),
            this.groupid
        );
    }
    get leftone() {
        const left = Math.max(0, 1 - this.left);
        const right = 0;
        return new opdefine([left].concat(this.grammer).concat([right]), this.order,
            this.addformula(left, right),
            this.groupid
        );
    }
    get rightone() {
        const left = 0;
        const right = Math.max(0, 1 - this.right);
        return new opdefine([left].concat(this.grammer).concat([right]), this.order,
            this.addformula(left, right),
            this.groupid
        );
    }
    get left() {
        if (this._left !== undefined) {
        } else if (this.isfunction) {
            this._left = 0;
        } else {
            this._left = 0;
            for (let elm of this.grammer) {
                if (typeof elm == 'number') {
                    this._left += elm;
                } else {
                    break;
                }
            }
        }
        return this._left;
    }

    get right() {
        if (this._right !== undefined) {
        } else if (this.isfunction) {
            this._right = 0;
        } else {
            this._right = 0;
            for (let i = 0; this.grammer.length; i++) {
                const elm = this.grammer[this.grammer.length - i - 1];
                if (typeof elm == 'number') {
                    this._right += elm;
                } else {
                    break;
                }
            }
        }
        return this._right;
    }
}

// 命令定義用クラス
class opdefine {
    constructor(grammer, order, formula, groupid, meta, root = 0, inouts = null) {
        if (grammer === undefined) {
            this.grammer = ['undefined'];
            this.formula = () => {
                return undefined;
            };
            return;
        }
        this.grammer = grammer;
        this.order = order;
        this.formula = formula;
        this.groupid = groupid;
        this.meta = meta; // free space. meta data
        this.root = root;
        //this._inouts = inouts;
    }

    get formula() {
        return this._formula;
    }
    set formula(val) {
        if (typeof val == 'function') {
            this._formula = val;
        } else {
            this._formula = () => {
                return undefined;
            };
        }
    }

    gettype(node) {
        return this._inouts.gettype(node);
    }
    get outputs() {
        return this._inouts._outputs;
    }

    get grammer() {
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

    set grammer(val) {
        if (!(val instanceof Array)) {
            this._grammer = [val];
            this._funcgrammer = true;
            this.matchfunction = val;
            this._firstindex = 0;
            return;
        } 
        this._grammer = val;
        this._funcgrammer = false;

        let first;
        if (this._grammer.length == 1) {
            first = this.grammer[0];
            this._firstindex = 0;
        } else {
            let index = 0;
            for (let elm of this._grammer) {
                if ((typeof elm) != "number") {
                    first = elm;
                    this._firstindex = index;
                    break;
                }
                index++;
            }
        }
        if (typeof first == "string") {
            this._first = first;
        } else {
            this.matchfunction = first;
        }
    }
    get matchfunction() {
        return this._matchfunction;
    }
    set matchfunction(val) {
        this._matchfunction = val;
    }
    get firstindex() {
        return this._firstindex;
    }

    match(text, ptr, reserved) {
        const futertext = (() => {
            if (ptr === undefined) {
                return undefined;
            }
            if (reserved.includes(text + ptr.index(1))) {
                return text + ptr.slice(1, 3); // 次回に予約語と一致するならば、次々回についてまで考える
            }
            return undefined;
        })();
        for (let key of this._grammer) {
            if ((typeof key) == "number") {
                continue;
            }
            if (typeof key == "string") {
                if (key.slice(0, text.length) == text) {
                    return true;
                }
            } else {
                
                if (typeof key == "function") {
                    const hit = key(text, ptr) && ((futertext === undefined) || key(futertext, ptr));
                    if (hit) {
                        return true;
                    }
                }
            }
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
    // 単語として確定した後なので、読み込み中のptrはない。
    // 可変要素は予約語に成り得ない。
    firstmatch(word, reserved) {
        if (this.matchfunction) {
            return (!reserved && this.matchfunction(word));
        } else {
            return this.first == word;
        }
    }

    clone(keyword) {
        const grammer = this.firstindex === undefined ? [keyword] : this._grammer.map((v, i) => {
            return i == this.firstindex ? keyword : v;
        });
        const def = new opdefine(grammer, this.order, (argv, meta, self) => {
            self.operator = keyword;
            return this.formula(argv, meta, self);
        }, this.groupid, this.meta, this.root, this._inouts);
        def.priority = this.priority;
        def.punctuation = this.punctuation;
        return def;
    }

    make(keyword) {
        if (!this._funcgrammer) {
            const int = new interpretation(this.clone(keyword));
            return int;
        }
        if (this.formula) {
            const def = new opdefine([keyword], this.order, (argv, meta, self) => {
                self.operator = keyword;
                return this.formula(keyword, meta, self);
            }, this.groupid, this.meta, this.root);
            def.priority = this.priority;
            def.punctuation = this.punctuation;
            const int = new interpretation(def);
            return int;
        } else {
            const def = new opdefine([keyword], this.order, () => {
                return undefined;
            }, this.groupid, this.meta, this.root);
            def.priority = this.priority;
            def.punctuation = this.punctuation;
            const int = new interpretation(def);
            return int;
        }
    }

    get first() {
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
                return undefined;
            }
            return this._nexter;
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
            return undefined;
        }

        this._nexter = new opdefine(grammer, this.order, () => {
            // interpretation側で解決
        }, this.groupid, null, this.root + 1); //, this._inouts.shift(this.left));

        this._nexter.priority = this.priority;
        this._nexter.parent = this;
        return this._nexter;
    }
    get parent() {
        return this._parent;
    }
    set parent(val) {
        this._parent = val;
    }
    get starter() {
        let current = this;
        while (1) {
            if (!current.parent) {
                return current;
            }
            current = current.parent;
        }
    }

}

// 定義に基づいて解釈を展開しつつ、式の上での親子関係を保持するクラス
class interpretation {
    // 定義クラスから実際の解釈を生成
    // 解釈の無効を管理
    // offsetは部分的な構文解析時に使用
    constructor(define, parent, offset = 0) {
        if (define === undefined) {
            define = new opdefine();//myconsole.implmenterror("Unexpected define. This is undefined", parent);
        }

        this._invalid = false;
        this._define = define; // opdefine
        if (parent) {
            this._parent = parent;
        }
        this.meta;
        this._left = [];   // left children
        this._childtrees = []; // 
        this._right = [];  // right children
        this._brothers;
        this._offset = offset;
        this._leftblank = [];
        this._rightblank = [];
        this._childblanktrees = [];
    }

    printtree(hist = {}, depth = 0, color = 0) {
        const left = this.leftchildren;
        const right = this.rightchildren;
        const maxcount = left.length + right.length;

        let branch = (color ? '\u001b[32m' : '\u001b[96m') + ((depth == 0 || hist[depth - 1] == " ") ? "┗" : "┣") + "━━" + '\u001b[0m';
        let blank = ""
        for (let i = 0; i < depth; i++) {
            blank += "    " + (i == depth - 1 ? "" : hist[i]);
        }
        myconsole.log([" " + blank + branch, this.horizonal + "[" + this.priority + ',' + this.first.replace(/(\r\n|\n|\r)/g, "\\r\\n") + "]"]);
        depth;

        if (left.length) {
            hist[depth] = '\u001b[96m' + "┃" + '\u001b[0m';
        } else if (right.length) {
            hist[depth] = '\u001b[32m' + "┃" + '\u001b[0m';
        } else {
            hist[depth] = " ";
        }
        
        for (let i = 0; i < left.length; i++) {
            const node = left[i];
            if (i == left.length - 1) {
                hist[depth] = '\u001b[32m' + "┃" + '\u001b[0m';
            }
            if (i == maxcount - 1) {
                hist[depth] = " ";
            }
            node.printtree(hist, depth + 1, 0);
        }
        for (let i = 0; i < right.length; i++) {
            const node = right[i];
            if (i == right.length - 1) {
                hist[depth] = " ";
            }
            node.printtree(hist, depth + 1, 1);
        }
        hist[depth] = " ";
    }

    get typename() {
        const property = this.meta.property || this.rootnamespace;
        const name = this._define.first;
        if (!property) {
            return undefined;
        }
        const ref = property.resolve(name);
        if (ref) {
            return ref.typename;
        }
        return undefined;
    }

    get rootnamespace() {
        if (this.meta.rootnamespace) {
            return this.meta.rootnamespace;
        } else if (this.parent) {
            return this.parent.childnamespace;
        }
        return new property();
    }

    set rootnamespace(val) {
        this.meta.rootnamespace = val;
    }

    get childnamespace() {
        return this.meta.childnamespace || this.rootnamespace;
    }

    set childnamespace(val) {
        this.meta.childnamespace = val;
    }

    set property(val) {
        this.meta.property = val;
    }

    get property() {
        if (this.meta.property) {
            return this.meta.property;
        }
        if (this.parent) {
            return this.parent.property;
        }
        return undefined;
    }

    set starter(val) {
        this._starter = val;
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
            parent = parent._parent;
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
        myconsole.implmenterror("undefined absolute horizonal access:", this.starter.allnodes.map(v => v.horizonal))
        myconsole.implmenterror(horizonal, this.starter.horizonal, this.horizonal, this.starter.first, this.first);
        return undefined;
    }

    set lefttree(val) {
        if (val) {
            this._lefttree = val;
        }
    }
    get lefttree() {
        return this._lefttree;
    }
    set righttree(val) {
        if (val) {
            this._righttree = val;
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
                myconsole.implmenterror("Double interpretation violation");
            }
            root = root.parent;
        }
        return {
            left,
            right,
        }
    }

    set dummychild(val) {
        this._dummychild = val;
    }

    get dummychild() {
        return this._dummychild;
    }

    set childtrees(val) {
        this._childtrees = [];
        this._childblanktrees = [];
        for (let op of val) {
            op.parent = this.starter;
            if (op.define.order == module.exports.join.orders.order.nojoin) {
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
        });
        for (let child of this._leftblank) {
            if (child instanceof interpretation) {
                left.push(child);
            }
        }
        const right = (() => {
            if (this._parent) {
                return [];
            }
            const right = [];
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                }
            }
            for (let child of this._rightblank) {
                if (child instanceof interpretation) {
                    right.push(child);
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
                myconsole.implmenterror("Violation!");
                myconsole.implmenterror(r.horizonal, l.horizonal, r.root.horizonal, l.root.horizonal);
            }
            return l.horizonal - r.horizonal;
        });
        return children;

    }

    get leftchildren() {
        const children = this._left.map(child => {
            if (child instanceof interpretation) {
                return child;
            }
        });
        children.sort((l, r) => {
            if (l.horizonal == r.horizonal) {
                myconsole.implmenterror("Violation!");
            }
            return l.horizonal - r.horizonal;
        });
        return children;
    }

    get rightchildren() {
        const children = (() => {
            if (this._parent) {
                return [];
            }
            const right = [];
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                }
            }
            return right;
        })();
        children.sort((l, r) => {
            if (l.horizonal == r.horizonal) {
                myconsole.implmenterror("Violation!");
            }
            return l.horizonal - r.horizonal;
        });
        return children;
    }

    get children() {
        // 空白文字を含まない全ての子供
        const left = this.leftchildren;
        const right = this.rightchildren;
        const children = [];
        for (let child of left) {
            children.push(child);
        }
        for (let child of right) {
            children.push(child);
        }
        children.sort((l, r) => {
            if (l.horizonal == r.horizonal) {
                myconsole.implmenterror("Violation!");
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
        });
        const right = (() => {
            const right = [];
            let nexter = this.nexter;
            while (nexter) {
                for (let node of nexter.childtrees) {
                    right.push(node);
                }
                if (nexter.dummychild) {
                    right.push(nexter.dummychild);
                }
                nexter._tmpparent = this;
                nexter = nexter.nexter;
            }
            for (let node of this._right) {
                if (node instanceof interpretation) {
                    right.push(node);
                } else {
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
        const nodes = [];
        const stack = [this];
        while (stack.length) {
            const pop = stack.pop();
            nodes.push(pop);
            pop.allchildren.map(v => stack.push(v));
            pop.allchildtrees.map(v => stack.push(v));
            if (pop.nexter) {
                stack.push(pop.nexter)
            }
        }
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
                    myconsole.implmenterror("Already recorded node!!");
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
        // 【優先度について】
        // priorityは例えば空白文字が一番高く、文末表現が一番低い
        // 同じ演算子の単項演算子と多項演算子であれば、項数の少ない解釈ほどpriorityは高い（1+1より+1の方がpriorityが高い）
        // ただしpriorityが高いとは検証順序の優先度であって、採用の優先度ではない。
        // priorityの高い解釈は項数の少なさから成立しやすいが、priorityは低いが成立する解釈があれば、それは積極的に採用される。
        // ここでは、ほかの解釈を変えずに自身の別解釈を採用した場合に、成立するかを検討する
        const others = [];
        // roots: 自身の直系の親から根までの木構造を、自身より左手側か右手側かに分類したもの
        const roots = this.roots;
        const blank = this.define.order == module.exports.join.orders.order.nojoin;
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
        const bracket = roots.left.find(parent => {
            return (parent.horizonal < this.horizonal && this.horizonal < parent.terminator.horizonal);
        });

        for (let def of this.context) {
            // def: interpretation
            const leftgeta = def.order == module.exports.join.orders.order.left ? 1 : 0; // 左結合
            const rightgeta = def.order == module.exports.join.orders.order.right ? 1 : 0; // 右結合
            const minleft = roots.left.length && (min.left.priority + leftgeta) < def.priority;
            const minright = roots.right.length && (min.right.priority + rightgeta) < def.priority;
            if (!def) {
                others.push(undefined);
            } else if (def.priority >= this.priority) {
                // 自身以降の解釈は敢えて入れない。
                others.push(undefined);
            } else if (bracket) {
                // 囲み文字に囲まれた領域は考慮しない。
                others.push(undefined);
            } else if (def.invalid || !def.finished) {
                // 既に無効な命令、または終了していない命令は無視
                others.push(undefined);
            } else if (def.define.left < this.define.left || def.define.right < this.define.right) {
                // 左右の要素数が減るような解釈は使用不可
                others.push(undefined);
            } else if (blank && roots.left.length && roots.right.length) {
                // 空白要素は左右両方に親がいる時、再解釈不可。
                others.push(undefined);
            } else if (
                minleft && minright
            ) {
                // ルーツの両側の最小優先度より高い優先度のとき、その解釈による拡張はできない
                others.push(undefined);
            } else if (minleft && def.define.left > this.define.left) {
                // 左に祖先が残っている時に、左に手を伸ばすことは出来ない
                 others.push(undefined);
            } else if (minright && def.define.right > this.define.right) {
                // 右に祖先が残っている時に、右に手を伸ばすことは出来ない
                others.push(undefined);
            } else if (!blank && roots.left.length && !this.define.left && def.priority < max.left.priority + leftgeta) {
                // 自身が空白要素でなければ、自身が左手側に子要素を持たない時、左手側の親要素を越える事は出来ない
                // （自身を子としていた親要素が子を失う）
                others.push(undefined);
            } else if (!blank && roots.right.length && !this.define.right && def.priority < max.right.priority + rightgeta) {
                // 自身が空白要素でなければ、自身が右手側に子要素を持たない時、右手側の親要素を越える事は出来ない
                // （自身を子としていた親要素が子を失う）
                others.push(undefined);
            } else {
                others.push(def);
            }
        }
        return others;
    }

    get grammer() {
        return this.define.grammer;
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

    get terminator() {
        if (!this._terminator) {
            let terminator = this;
            while (1) {
                if (!terminator.nexter) {
                    this._terminator = terminator;
                    break;
                }
                terminator = terminator.nexter;
            }
        }
        return this._terminator;
    }

    get nexter() {
        if (!this.define.nexter) {
            return undefined;
        }
        if (!this._nexter) {
            const nexter = new interpretation(this.define.nexter, this, this.offset);
            this._nexter = nexter;
        }
        return this._nexter;
    }

    get meta() {
        if (!this._meta) {
            this._meta = {
                self: this
            };
        }
        return this._meta;
    }

    get name() {
        return this.meta.name;
    }

    get calculated () {
        if (this._calclated === undefined) {
            this._calclated = false;
        }
        return this._calclated;
    }
    set calculated(val) {
        this._calclated = val;
    }

    get confirm () {
        if (this._confirm === undefined) {
            this._confirm = false;
        }
        return this._confirm;
    }
    set confirm (val) {
        if (val == !this._confirm) {
            this.args.map(v => v.confirm = val);
        }
        this._confirm = val;
    }

    get val() {
        if (this._executed) {
            return this._oldvalue;
        }
        const first = (() => {
            const args = this.args;
            if(args.length == 0) {
                return undefined;
            } else if (args[0].horizonal < this.horizonal) {
                return args[0];
            }
            return undefined;
        })()
        if (first) {
            const stop = first.meta.stop;
            Object.defineProperty(first, 'value', {
                get: function () {
                    if (first._executed) {
                        first.meta.stop = stop;
                        return first._oldvalue;
                    }
                    return first._value;
                },
                configurable: true
            });
            this.meta.rootnamespace = first.meta.rootnamespace;
        }
        return this._value;
    }

    get _value() {
        this.args.map(arg => {
            arg.parent = this;
            arg.meta.stop = false;
        });
        this._executed = true;
        this._oldvalue = this.define.formula(this.args, this.meta, this);
        const meta = this.args.reduce((acc, arg) => {
            if (acc.stop) {
                return acc;
            }
            if (arg.meta.stop) {
                acc.stop = true;
                acc.stopinfo = arg.meta.stopinfo;
            }
            return acc;
        }, { stop: false });
        if (meta.stop) {
            this.meta.stop = meta.stop;
            this.meta.stopinfo = meta.stopinfo;
            return;
        }
        return this._oldvalue;
    }

    get value() {
        return this._value;
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
            myconsole.implmenterror("horizonal index is rewritten");
        }
        this._horizonal = val;
    }
    set vertical(val) {
        if (this._vertical !== undefined) {
            myconsole.implmenterror("vertical index is rewritten");
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
        if (this._invalid && !val) {
            myconsole.implmenterror("Judge invalid failure");
        }
        if (this._parent) {
            this.parent.invalid = val;
            delete this._parent;
            delete this._tmpparent;
        }
        if (val) {
            // release
            delete this._left;   // left children
            delete this._childtrees; // 
            delete this._right;  // right children
            delete this._brothers;
            delete this._leftblank;
            delete this._rightblank;
            delete this._childblanktrees; // 
        }
        return this._invalid = val;
    }

    set parent(val) {
        if (this._parent) {
            // _parent は産みの親なので忘れない
            //return;
        }
        this._tmpparent = val;
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
        if (this.calculated) {
            return 0;
        }
        if (this.invalid) {
            return -1;
        }
        if (this.define.left == 0.5) {
            if ((this._childtrees.length === 0 && this._dummychild)|| this._childtrees.length === 1) {
                return 0;
            }
            return 1;
        }
        if (this._parent) {
            return this.define.left - this._childtrees.length;
        }
        return this.define.left - this._left.length;
    }
    get right() {
        if (this.calculated) {
            return 0;
        }
        if (this.invalid) {
            return -1;
        }
        if (this._parent) {
            return 0;
        }
        return this.terminator.define.right - this._right.length;
    }

    get type() {
        if (this.invalid) {
            return undefined;
        }
        return undefined;
        //this.define.gettype(this);
    }

    setleft(val) {
        if (this.horizonal <= val.horizonal) {
            return false;
        }
        if (val.define.order == module.exports.join.orders.order.nojoin) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                if (!val.parent.invalid) {
                    return false;
                }
            }

            val.parent = this.starter;
            if (this._leftblank.find(v => v.horizonal == val.horizonal)) {
                myconsole.implmenterror("Already record horzonal", val.horizonal, val.first, this.horizonal, this.first);
            }
            this._leftblank.push(val);
            return true;
        } else if (this.left > 0) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }
            val.parent = this.starter;
            if (this._left.find(v => v.horizonal == val.horizonal)) {
                myconsole.implmenterror("Already record horzonal", val.horizonal, val.first, this.horizonal, this.first);
            }
            this._left.unshift(val);
            return true;
        }
        return false;
    }
    setright(val) {
        if (this.horizonal >= val.horizonal) {
            return false;
        }
        if (this._parent) {
            return false;
        }
        if (val.define.order == module.exports.join.orders.order.nojoin) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                if (!val.parent.invalid) {
                    return false;
                }
            }
            val.parent = this.starter;

            if (this._rightblank.find(v => v.horizonal == val.horizonal)) {
                myconsole.implmenterror("Already record horzonal", val.horizonal, val.first, this.horizonal, this.first);
            }
            this._rightblank.unshift(val);
            return true;
        } else if (this.right > 0) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }
            val.parent = this.starter;
            if (this._right.find(v => v.horizonal == val.horizonal)) {
                myconsole.implmenterror("Already record horzonal", val.horizonal, val.first, this.horizonal, this.first);
            }
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
        if (this.context.length == 0) {
            return undefined;
        }
        return this.context[0].horizonal;
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
        if (!interpretation.define.match (this.first)){
            myconsole.implmenterror("Unmatch operator", interpretation.fullgrammer, ",", this.first);
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
            myconsole.defineerror("All interpretations invalid!!");
        }
        return true;
    }

    get contexts() {
        const contexts = {};
        contexts.nexters = {};
        contexts.functions = [];
        contexts.count = 0;
        for (let def of this.context) {
            const nexter = def.nexter;
            if (!nexter || def.invalid || nexter.invalid) {
                // なにもしない
                continue;
            } else if (typeof nexter.first == 'string') {
                if (!(nexter.first in contexts.nexters)) {
                    contexts.nexters[nexter.first] = new context(nexter.first);
                }
                contexts.nexters[nexter.first].push(nexter);
            } else {
                contexts.functions.push(nexter);
            }
            contexts.count++;
        }
        return contexts;
    }
    get closed() {
        for (let def of this.context) {
            if (!def || def.invalid) {
                continue;
            }
            const nexter = def.nexter;
            if (nexter && nexter.invalid) {
                continue;
            }
            if (!nexter) {
                return true;
            }
        }
        return false;
    }

}

class predictor {
    constructor(program) {
        this.init(program);
        this._start = program[0][0].horizonal;
        this._end = program[program.length - 1][0].horizonal;
    }
    compare(others) {
        if (this.length != others.length) {
            return false;
        }
        for (let i = 0; i < this.length; i++) {
            const self = this.hash[i];
            const other = others.hash[i];
            if (self != other) {
                return false;
            }
        }
        return true;
        for (let i = 0; i < this.length; i++) {
            const self = this.program[i];
            const other = others.program[i];
            if (self.length != other.length) {
                return false;
            }
            for (let j = 0; j < self.length; j++) {
                if (
                    !(
                        self[j].priority == other[j].priority
                        && self[j].order == other[j].order
                        && self[j].left == other[j].left
                        && self[j].right == other[j].right
                        && self[j].vertical == other[j].vertical
                    )
                ) {
                    return false;
                }
            }
        }
        return true;
    }
    get hash() {
        if (this._hash !== undefined) {
            return this._hash;
        }
        this._hash = this.program.map(v => {
            return v.reduce((acc, node) => {
                acc = acc << 8;
                acc |= ((node.priority << 5) | (node.order << 4) | (node.left << 3) | (node.right << 2) | (node.vertical));
                return acc;
            }, 0);
        });
        return this._hash;
    }

    get length() {
        return this._end - this._start + 1;
    }
    get program() {
        return this._contexts;
    }
    init(program) {
        this._contexts = program.map(context => {
            return context.map(interpretation => {
                return {
                    priority: interpretation.priority,
                    order: interpretation.define.order,
                    left: interpretation.define.left, right: interpretation.define.right,
                    vertical: interpretation.vertical,
                };
            });
        });
    }
    get confirms() {
        if (this._confirms === undefined) {
            this._confirms = [];
        }
        return this._confirms;
    }
    confirmed(node) {
        this.confirms[node.horizonal - this._start] = {
            priority: node.priority,
            vertical: node.vertical
        };
    }
}

class bracketContext {
    constructor(config, contexts) {
        this._contexts = [];
        this._prevpuncs = [[0]];
        this._latests = [0];
        this.config = config;
        this.contexts = contexts;
    }


    get width() {
        if (this._width === undefined) {
            this.width = (this.config.width + 1) || 2;
        }
        return this._width;
    }
    get distance() {
        if (this._distance === undefined) {
            this.distance = this.config.distance || 0;
        }
        return this._distance;
    }
    set width(val) {
        this._width = val;
    }
    set distance(val) {
        this._distance = val;
    }

    set prevpunc(val) {
        const prevpunc = this._prevpuncs[0];
        let index = prevpunc.length - 1;
        for (let i = 0; i < prevpunc.length; i++) {
            if (prevpunc[index] == val) {
                index = -1;
                break;
            } else if (prevpunc[index] < val) {
                break;
            }
            index--;
        }
        if (index < 0) {
            return;
        }
        prevpunc.splice(index + 1, 0, val);
    }

    get latest() {
        return this._latests[0];
    }
    set latest(val) {
        if (this._latests[0] < val) {
            this._latests[0] = val;
        }
    }

    get prevpunc() {
        const prevpunc = this._prevpuncs[0];
        let index = prevpunc.length - (this.distance + this.width + 1);
        let next = prevpunc[index + 1];
        let value = prevpunc[index];
        // 文末表現が右に隣接しているとき左の要素も必要
        while (index > 0) {
            if (next - value > 1) {
                const range = this.contexts.program.filter((v, i) => (value <= i && i < next - 1));
                if (
                    range.find(v => v.find(v => v.define.order != module.exports.join.orders.order.nojoin))
                ) {
                    break;
                }
                // 間の要素に空白しかないならば、実質的に文末表現ではないので次を探す。
            }
            index--;
            value = prevpunc[index];
            next = prevpunc[index + 1];
        }
        return value;
    }
    get prevend() {
        const prevpunc = this._prevpuncs[0];
        const index = prevpunc.length - (this.distance + 1);
        if (index < this.width) {
            return -1;
        } else if (prevpunc[index - this.width] < this.latest) {
            return -1;
        }
        return prevpunc[index];
    }

    at(index, value) {
        if (value) {
            this._contexts[index] = value;
        }
        return this._contexts[index];
    }
    get length() {
        return this._contexts.length;
    }
    shift() {
        if (this._contexts.length == 0) {
            return;
        }
        this._prevpuncs.shift();
        this._latests.shift();
        return this._contexts.shift();
    }
    unshift(...args){
        let i;
        for (i = 0; i < args.length; i++) {
            const v = args[args.length - i - 1];
            this._contexts.unshift(v);
            this._latests.unshift(v.horizonal);
            this._prevpuncs.unshift([v.horizonal]);
        }
        return i;
    }
}

// 式を読み込んで全体的な解釈をするクラス
class contexts {
    get ptr() {
        return this._ptr;
    }
    set ptr(val) {
        this._ptr = val;
    }

    confirmbody(node) {
        this.brackets.latest = node.horizonal;
        this.program[node.horizonal] = this.program[node.horizonal].filter(v => v.vertical == node.vertical);
        this.program[node.horizonal][0].context = this.program[node.horizonal][0].context.filter(v => v.vertical == node.vertical);
        
    }

    confirm(node, prd, end) {
        const confirmed = (node) => {
            // horizonal == end - 1 は現状の末尾であるが、後続によって解釈が変わるので必ず確定できない。
            if (!(node.horizonal == end - 1)) {
                // 制御構文または文末表現のときprevpuncとして扱い、これより前の要素について再検討されないようにする。
                // * 再検討されると、自身の左手側が存在しないパターンが発生する
                if (node.priority <= this.config.ops.ctrlpriority) {
                    this.brackets.prevpunc = node.horizonal + 1;
                }
                this.confirmbody(node);
                if (this.config.predict && prd) {
                    prd.confirmed(node);
                }
            }
            // 文末表現のその他の子要素は文末表現を超えられる解釈を持たないので、子要素については総じて確定と考える
            node.allchildren.map(v => confirmed(v));
            node.allchildtrees.map(v => confirmed(v));
        }
        confirmed(node);
        //this.confirmed[node.horizonal] = node;
    }
    get confirmed() {
        if (this._confirmed === undefined) {
            this._confirmed = [];
        }
        return this._confirmed;
    }
    get predictor() {
        if (this._predictor === undefined) {
            this._predictor = [];
        }
        return this._predictor;
    }

    set predictor(val) {
        if (this.predictor[val.length - 1] === undefined) {
            this.predictor[val.length - 1] = [];
        }
        this.predictor[val.length - 1].push(val);
    }

    compare(start, end) {
        const prd = new predictor(this.program.slice(start, end));
        const pred = this.predictor[prd.length - 1];
        if (pred === undefined) {
            return prd;
        }
        for (let i = 0; i < pred.length; i++) {
            if (pred[i].compare(prd)) {
                return pred[i];
            }
        }
        return prd;
    }

    read(keyword) {
        const context = this.context(keyword).sort((l, r) => {
            return l.priority - r.priority;
        });
        
        let ispunc = true;
        context.map((interpretation, index) => {
            interpretation.vertical = index;
            interpretation.context = context;
            ispunc = interpretation.define.punctuation && ispunc;
        });
        if (context.length == 0) {
            return;
        }
        this.program.push(context);
        if (ispunc) {
            this.brackets.prevpunc = this.program.length;
            if (this.brackets.prevend > 0) {
                const end = this.brackets.prevend;
                const start = this.brackets.prevpunc;
                
                const predict = (() => {
                    if (!this.config.predict) {
                        return {confirms:[]};
                    }
                    return this.compare(start, end+1);
                })();
                if (predict.confirms.length) {
                    predict.confirms.filter(v => v).map((v, i) => {
                        return {
                            horizonal: i + start,
                            vertical: v.vertical
                        };
                    }).map(node => {
                        this.confirmbody(node);
                        this.brackets.latest = node.horizonal;
                        this.program[node.horizonal] = this.program[node.horizonal].filter(v => v.vertical == node.vertical);
                        this.program[node.horizonal][0].context = this.program[node.horizonal][0].context.filter(v => v.vertical == node.vertical);
                    });
                } else {
                    if (this.config.predict) {
                        this.predictor = predict;
                    }
                    const dep = this.dependency(start, end);
                    dep.map(root => {
                        this.confirm(root, predict, end);
                    });

                }
            }
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
                        const c = clone._parent.nexter;
                        return c;
                    }
                    return clone;
                })()
                clone.offset = start;
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
        // roots: 解析木の根の集合（現状の1解釈分のみ）
        // [interpretation, interpretation, ...] <- only tree root
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
        if (roots.length == 1) {
            return roots;
        }
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
                    op.punctuation = other.punctuation;
                    const int = op.make(undefined);
                    int.previnterpretation = def;
                    int.vertical = other.vertical;
                    int.horizonal = other.horizonal;
                    int.offset = other.offset;
                    int.root = def.root;
                    interpretations.push(int);
                }
                context.push(interpretations);
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
            // 基本的には優先度の高いものから順に考慮
            const priority = r.priority - l.priority;
            if (priority) {
                return priority;
            }

            // 位置も結合方向も同じならば、子供の数の多い方？
            if (l.horizonal == r.horizonal) {
                if (l.order == r.order) {
                    if (l.order == module.exports.join.orders.order.left) {
                        return l.right - r.right;
                    } else if (l.order == module.exports.join.orders.order.right) {
                        return l.left - r.left;
                    }
                } 
            }
            // よく分かんない。一方が左結合ならば右から、一方が右結合ならば左から検討すべきってこと？
            if (l.order == module.exports.join.orders.order.left) {
                return r.horizonal - l.horizonal;
            } else {
                return l.horizonal - r.horizonal;
            }
        });
        
        const first = reordered.find((interpretation) => {
            // interpretationはnewprogram作成時に作った仮想の演算子
            // 各ツリーが左右に伸ばしうる残りの手数
            let left = interpretation.left;
            let right = interpretation.right;

            // 真隣の木
            const adjacentleft = interpretation.root.lefttree;
            const adjacentright = interpretation.root.righttree;
            const geta = {};
            geta.left = interpretation.order == this.config.join.order.left ? 1 : 0;
            geta.right = interpretation.order == this.config.join.order.right ? 1 : 0;
            // 元々の意味が空白だった場合、自身のツリーを食える
            const prev = interpretation.previnterpretation;
            if (prev) {
                const blank = prev.define.order == module.exports.join.orders.order.nojoin;
                if (blank) {
                    if (interpretation.horizonal < prev.root.horizonal && prev.root.priority + geta.right > interpretation.priority) {
                        // 元の木の根の左側にいるので、右手で自身の根を掴める
                        right--;
                    } else if (interpretation.horizonal > prev.root.horizonal && prev.root.priority + geta.left > interpretation.priority) {
                        // 元の木の根の右側にいるので、左手で自身の根を掴める
                        left--;
                    }
                }
            }
            let lefttree = adjacentleft;
            // 『真隣の木の中』で一番自身に近いノード
            const l = adjacentleft ? adjacentleft.nodes.slice().sort((l, r) => { return r.horizonal - l.horizonal }).find(v => true) : {priority : -1};
            const r = adjacentright ? adjacentright.nodes.slice().sort((l, r) => { return l.horizonal - r.horizonal }).find(v => true) : { priority: -1 };
            while (left > 0) {
                if (!lefttree) {
                    break;
                }
                if (lefttree.priority + geta.left >= interpretation.priority) {
                    lefttree = lefttree.lefttree;
                    left--;
                } else if ((lefttree == adjacentleft) && (l.priority + geta.left > interpretation.priority)) {
                    lefttree = lefttree.lefttree;
                    left--; // 
                } else {
                    break;
                }
            }
            if (left > 1) {
                return false;
            }
            let righttree = adjacentright;
            while (right > 0) {
                if (!righttree) {
                    break;
                }
                if (righttree.priority + geta.right >= interpretation.priority) {
                    righttree = righttree.righttree;
                    right--;
                } else if ((righttree == adjacentright) && (r.priority + geta.right > interpretation.priority)) {
                    righttree = righttree.righttree;
                    right--;
                } else {
                    break;
                }
            }
            if (right > 1) {
                return false;
            }
            if (left == 0 && right == 0) {
                return true;
            }
            geta.root = interpretation.horizonal < interpretation.root.horizonal ? geta.right : geta.left;
            if (left * right == 0 && left + right == 1 && interpretation.priority <= interpretation.root.priority + geta.root) {
                if (left && adjacentleft) {
                    // 左のツリーの右側の要素の優先度より低いならば入り込める
                    if (l && interpretation.priority < l.priority + geta.left) {
                        return true;
                    }
                } else if (right && adjacentright) {
                    // 右のツリーの左側の要素の優先度より低いならば入り込める
                    
                    if (r && interpretation.priority < r.priority + geta.right) {
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
                const vertical = program[i].length - 1 - j; // このverticalは実装次第ではop.verticalと一致しないので注意
                const op = program[i][vertical];
                if (!op) {
                    myconsole.implmenterror("undefined code!!");
                    continue;
                }

                if (op.invalid || !op.finished) {
                    continue;
                }
                const interpretation = interpretations.find(def => def.horizonal == op.horizonal);
                if (interpretations.length && !interpretation) {
                    myconsole.implmenterror("Error!!", op.fullgrammer, op.define.first, op.horizonal);
                    myconsole.implmenterror(interpretations.map(v => v.horizonal));
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
                        nexter = op.nexter;
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

    reprogram(roots, replacefirst) {
        // roots: 解析木の根の集合
        // rootsを一本のプログラムに変換
        let replace = replacefirst;
        let c = 0;
        // interpretations: 解析木の根の集合と再解釈予定の演算子から再構築したプログラム
        // この構成で解釈は可能だが、解析木の数は最小ではない
        const interpretations = roots.reduce((acc, root) => {
            c++;
            const nodes = []
            let rec = (node, rec) => {
                if (replace && node.horizonal == replace.horizonal) {
                    nodes.push(replace);
                } else {
                    nodes.push(node);
                }
                for (let child of node.allchildren.concat(node.allchildtrees)) {
                    // allchildren   : 直接の子供(空白含む)
                    // allchildtrees : nexterとしての子供
                    rec(child, rec);
                }
                if (replace && node.horizonal == replace.horizonal) {
                    if (!replace.nexter) {
                        return;
                    }
                    replace = replace.nexter;
                    rec(replace, rec);
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
                myconsole.implmenterror("Violation!", l.horizonal, l.root.horizonal, r.horizonal, r.priority, l.priority, r.define.first);
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
            const fails = completes.reduce((acc, cur, idx) => {
                if (!cur) {
                    acc.push(start + idx);
                }
                return acc;
            }, []);
            myconsole.implmenterror("(reprogram)Incomprehensible operators exist", fails);
            //myconsole.implmenterror("Range:", start, "-", end - 1);
            //const f = this.program[start].find(v => !v.invalid);
            //myconsole.implmenterror("Start", f.fullgrammer, "End", this.program[end - 1][0].first);
            const ops = fails.map(v => program[v - start]);
            myconsole.implmenterror("Operator");
            ops.map(vs => console.log(vs[0].horizonal, vs.map(v => [v.first, v.left, v.right, v.finished, v.priority, v.invalid, v.define.grammer])));
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
        const completes = program.map(v => false); 
        // 自身以上の優先度の解釈を近隣から探す
        for (let context of contexts) {
            this.minstruct(context, program, completes, start);
        }
        if (completes.includes(false)) {

            const fails = completes.reduce((acc, cur, idx) => {
                if (!cur) {
                    acc.push(start + idx);
                }
                return acc;
            }, []);
            myconsole.implmenterror("(mintrees)Incomprehensible operators exist", fails);
            const ops = fails.map(v => program[v - start]);
            myconsole.implmenterror([start, end]);
            myconsole.implmenterror("Operator");
            ops.map(vs => console.log(vs[0].horizonal, vs.map(v => [v.first, v.define.left, v.define.right, v.priority, v.invalid, v.vertical])));
        }

        return program;
    }

    // 依存解決
    dependency(start, end) {
        const isall = (start === undefined) && (end === undefined);
        if (!start) {
            start = 0;
        }
        if (end === undefined) {
            end = this.program.length;
            if (start == 0) {
                while (this.brackets.length) {
                    this.brackets.shift(); // 始点も終点も未定義で呼ばれる時は末尾なので、囲み文字は閉じておく
                }
                const prevpunc = this.brackets.prevpunc;
                const dep = this.dependency(prevpunc, end);
                dep.map(root => {
                    this.confirm(root, undefined, end + 1);
                });
            }
        }

        const program = this.mintrees(start, end);
        const trees = this.retree(program);
        if (isall) {
            this._program = trees.reduce((acc, tree) => acc.concat(tree.allnodes.map(v => [v])), []);
        }
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
            } else if (self != self.starter) {
                return;
            } else if (self.parent) {
                // 既に親要素がいるのは、過去の依存チェックで考慮済みな囲み文字の中身
                return;
            }

            // self: 1つの解釈
            // order: 探索方向。true: 左方向 false: 右方向
            const step = order ? -1 : 1;
            // 解釈が持つindex情報を今の範囲内の値に置換
            const index = self.horizonal - start;
            let i = 1 + (step == 1 ? self.terminator.horizonal - self.horizonal : 0);
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
                const n = neighbors.find(def => {
                    return def && !def.invalid;
                });
                const g = (self.order == (order ? module.exports.join.orders.order.left : module.exports.join.orders.order.right) ? 1 : 0);
                if (
                    !n || ((n.priority + g) < self.priority)
                ) {
                    // 隣接要素の最大優先度が自身より低いとき、その要素を超える方法はない。
                    break;
                }
                // 既に完了しているか確認
                let complete = ((step == -1) && !self.left || (step == 1) && !self.right);
                let blank = false;

                for (let neighbor of neighbors) {
                    blank = (neighbor.define.order == module.exports.join.orders.order.nojoin);
                    const geta = self.order == (order ? module.exports.join.orders.order.left : module.exports.join.orders.order.right) ? 1 : 0;
                    // より優先度の高い子を探す
                    if (self.priority > neighbor.priority + geta) {
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
                    } else if (neighbor.parent && (neighbor.root.horizonal != self.horizonal)) {
                        // 隣接要素が親を持ち、その親のindexが自身と異なるとき
                        // 次の探索範囲は少なくともその親以降とする
                        i = Math.abs(neighbor.root.horizonal - self.horizonal) - 1 > i ?
                            Math.abs(neighbor.root.horizonal - self.horizonal) - 1 : i;
                        break;
                    } else {
                        // 要素をセット（多分できると思っているけれど、出来なかったら関数がはじく予定）
                        if (order) {
                            const result = self.setleft(neighbor);
                        } else {
                            const result = self.setright(neighbor);
                        }
                        if (neighbor.nexter) {
                            i = Math.abs(neighbor.nexter.horizonal - self.horizonal) > i ?
                                Math.abs(neighbor.nexter.horizonal - self.horizonal) : i;
                        } else {
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
            
            if (interpretation.order == module.exports.join.orders.order.right) {
                let next = 0;
                while (interpretation.order != module.exports.join.orders.order.left) {
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
            if (interpretation.order == module.exports.join.orders.order.right) {
                let next = 0;
                while (interpretation.order != module.exports.join.orders.order.left) {
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
        const current = this.current(keyword); // 囲み文字としての現在可能な解釈
        current.map(v => v.horizonal = this.program.length);
        if (current.length) {
            // 囲み文字としての解釈があればそれが優先される
            return current;
        }
        let open = false;
        const reserved = [];
        for (let define of this._constant) {
            if (define.firstmatch(keyword, this.config.ops.reserved.includes(keyword))) {
                const op = define.make(keyword);
                if (op) {
                    current.push(op);
                    if (op.nexter) {
                        open = true;
                    }
                    reserved.push(op);
                }
            }
        }
        reserved.map(v => v.horizonal = this.program.length);
        const recurrent = reserved.length ? reserved : current;
        if (open) { // 
            const con = new context(keyword);
            con.context = recurrent;
            this.brackets.unshift(con);
        }
        return recurrent;
    }

    current(keyword) {
        // 自身の意味が通じないと分かる瞬間
        // ・共通の開始子を持つ兄弟の中で、自分は読み出されず優先度の高い兄弟が読み出された
        // ・共通の開始子を持つ兄弟の中で、自分より優先度の低い要素が閉じた上に上位の文脈の結合子に至った
        let i;
        for (let index = 0; index < this.brackets.length; index++) {
            const result = this.brackets.at(index).contexts;
            const contexts = result.nexters[keyword] || new context(keyword);
            result.functions.filter(v => v.define.matchfunction(keyword, undefined, v)).map(v => contexts.push(v));
            const closed = this.brackets.at(index).closed;
            if (contexts.length) {
                const nexters = contexts.context.sort((l, r) => {
                    return r.priority - l.priority;
                }); // [interpretation, interpretation, interpretation,...];
                this.brackets.at(index, new context(keyword));
                const start = nexters.find(v => !v.invalid).parent.horizonal + 1;
                const end = this.program.length;
                const roots = this.dependency(start, end);
                const length = (() => {
                    if (roots.length != 1) {
                        return roots.length;
                    }
                    if (roots[0].define.order == module.exports.join.orders.order.nojoin) {
                        return 0;
                    }
                    return 1;
                })();
                this.brackets.at(index).context = nexters.filter((op) => {
                    if (op) {
                        if (op.define.left == 0.5 && length < 2) {
                            if (length === 0) {
                                // ダミー要素を仕込む
                                op.dummychild = new interpretation();
                                //op.dummychild.horizonal = op.horizonal;
                                op.dummychild.meta.dummy = true;
                            }
                            op.childtrees = roots;
                        } else if (length != op.left) {
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
            if (!closed) {
                break;
            }
        }
        if (i === undefined) {
            return [];
        }
        while (i) {
            this.brackets.shift();
            i--;
        }
        const ret = this.brackets.at(0);
        if (ret.contexts.count === 0) {
            // 閉じる事が確定しているならば閉じる。（閉じていないと逐次処理側で事故る）
            this.brackets.shift();
        }
        return ret.context;
    }

    get program() {
        return this._program;
    }

    constructor(config) {
        this.config = config;
        this._constant = config.ops.constant;   // [opdefine, opdefine,]
        this.brackets = new bracketContext(config, this); // [context, context, ...]
        this._program = []; // [[interpretation1], [interpretation1, interpretation2]]
    }
}

// 命令の定義集を読み込んで読み込みの補助などを少しするクラス
class ops {
    // 定義の妥当性を考える関数
    validation(defs) {
        // 要検討
        return;
        if (defs === undefined) {
            defs = this.constant;
        }
        // 不当な定義
        // 1. 同一の識別子で自身より子要素の多い演算子が高優先度に設定されている場合
        // 2. ??
        const firsts = {};
        for (let def of defs) {
            if (!(def._grammer instanceof Array)) {
                // 現状、検討するのは予約語のみ
                continue;
            }
            const first = def.first;
            if (!(first in firsts)) {
                firsts[first] = [];
            }
            firsts[first].push(def);
        }
        for (let key of Object.keys(firsts)) {
            const first = firsts[key];
            first.sort((l, r) => {
                let lparent = l;
                let rparent = r;
                const priority = l.priority - r.priority; // 昇順
                const right = r.right - l.right; // 降順
                if (r.nexter || l.nexter) {
                    // 囲み系演算子定義は終端まで行ってから全体を通して評価するので、ここではスルー
                    return priority;
                }
                while (1) {
                    if (!(lparent.parent && rparent.parent)) {
                        if (lparent.parent || rparent.parent) {
                            myconsole.implmenterror("Different depth");
                        }
                        break;
                    }
                    const left = rparent.left - lparent.left;
                    if (left) {
                        // 囲み演算子の中身が異なるならば、完全に区別のつく全く異なる演算子なのでOK
                        return left;
                    }
                    lparent = lparent.parent;
                    rparent = rparent.parent;
                }
                const left = rparent.left - lparent.left; // 降順
                const terms = left + right; // 降順
                // 演算子の全体の項数が一致する
                if (terms == 0) {
                    if (left) {
                        // 左右の項数の構成が異なるとき、
                        if (priority) {
                            // 優先度が異なれば区別できる
                            // ex. ++ の前置、後置
                            return priority;
                        }
                        if (l.order != r.order) {
                            // 結合順序が異なるときは区別できるようになりたい
                            return priority;
                        } else {
                            // 左右の項構成は異なるが、優先度も結合順序も同じとき、区別できないと思う
                            myconsole.defineerror("They can not be distinguished", lparent.grammer, rparent.grammer);
                            return priority;
                        }
                    } else {
                        // 左右の項の構成が同じとき、
                        if (l.order != r.order) {
                            // 結合順序が異なれば区別できるようになりたい
                            return priority;
                        }
                        if (!priority) {
                            // 優先度が同一ならば、見分けようがない
                            myconsole.defineerror("They can not be distinguished", lparent.grammer, rparent.grammer);
                            return priority;
                        }
                        // 優先度の低い方は必ず採用されない
                        if (priority > 0) {
                            myconsole.defineerror(
                                "Because of same configuration operator, this operator can not be used.\n", rparent.grammer, "\n",
                                "Priority:", lparent.priority, rparent.priority
                            );
                        } else {
                            myconsole.defineerror(
                                "Because of same configuration operator, this operator can not be used.\n", lparent.grammer, "\n",
                                "Priority:", lparent.priority, rparent.priority
                            );
                        }
                        return priority;
                    }
                } else if (terms * priority > 0) {
                    // 全体の項数が増えるとき、増える側の優先度が低くければOK
                    return priority;
                } else {
                    myconsole.defineerror("Priority setting error", priority, left, right, key);
                    return priority;
                }
                myconsole.implmenterror("Not considering pattern");
            });
            const nexters = first.map(v => v.nexter).filter(v => v !== undefined);
            this.validation(nexters);
        }
    }

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

    match(word, defines, ptr) {
        if (!defines) {
            defines = this.constant;
        }
        const match = [];

        for (let define of defines) {
            if (define.match(word, ptr, this.reserved)) {
                match.push(define);
            }
        }
        return match;
    }

    get undefined() {
        if (this._undefined === undefined) {
            for (let def of this.constant) {
                if (def.outputs[0] == itemtype.types().undef) {
                    this._undefined = def;
                    break;
                }
            }
        }
        return this._undefined;
    }

    ispuncblank(word) {
        const result = this.puncblanks.find(v => {
            const t = typeof v
            if (t == 'string') {
                return v == word;
            } else if (t == 'function') {
                return v(word);
            }
            return false;
        });
        return result !== undefined;
    }

    ispunctuation(word) {
        const result = this.punctuations.find(v => {
            const t = typeof v
            if (t == 'string') {
                return v == word;
            } else if (t == 'function') {
                return v(word);
            }
            return false;
        });
        return result !== undefined;
    }

    ispuncs(word) {
        const result = this._puncs.find(v => {
            const t = typeof v
            if (t == 'string') {
                return v == word;
            } else if (t == 'function') {
                return v(word);
            }
            return false;
        });
        return result !== undefined;
    }

    get ctrlpriority() {
        return 2; // 0, 1, 2
    }

    constructor(opdefines, punctuations, puncblanks, hooks, reserved, controls) {
        // opdefines: [               priority
        //    [opdefine, opdefine],     low
        //    [opdefine],                |
        //    [opdefine],               high
        // ];
        this.join = module.exports.join.orders;
        //this.types = itemtype.types();
        this.opdefines = opdefines;
        this.puncblanks = puncblanks || [];
        this.punctuations = punctuations || [];
        this._puncs = this.punctuations.concat(this.puncblanks);
        this.solocontrols = controls.map(v => v.solo).filter(v => v !== undefined);
        this.leftcontrols = controls.map(v => v.leftone).filter(v => v !== undefined);
        this.rightcontrols = controls.map(v => v.rightone).filter(v => v !== undefined);
        this.bothcontrols = controls.map(v => v.bothone).filter(v => v !== undefined);
        this.rightonly = this.rightcontrols.concat(this._puncs.map(v => this.makepunctuations(0, v, 1)));
        this.leftonly = this.leftcontrols.concat(this._puncs.map(v => this.makepunctuations(1, v)));
        //this.onlyonecontrols = this.rightonly.concat(this.leftonly); // この順序では出来なくなった。
        this.onlyonecontrols = this.leftonly.concat(this.rightonly); // この順序でないとダメ。
        // なんでかはよく分かんない。

        this.reserved = reserved || []; // [string, sitring, ...]
        this.opdefines.unshift(this.solocontrols.concat(this.punctuations.map(v => this.makepunctuations(0, v, 0)))); // priority 2
        this.opdefines.unshift(this.onlyonecontrols); // priority 1
        //this.opdefines.unshift(this.leftonly); // priority 2
        //this.opdefines.unshift(this.rightonly); // priority 1
        this.opdefines.unshift(this.bothcontrols.concat(this._puncs.map(v => this.makepunctuations(1, v, 1)))); // priority 0
        this.opdefines.push(this.puncblanks.map(v => this.makeblank(v)));
        
        let priority = 0;
        this.punctuation = (args, meta, self) => {
            meta.executedflag = true;
            //let namespace = meta.rootnamespace;
            let retValue = undefined;
            const argv = args;
            if (hooks && hooks.alternative) {
                meta.retValue = hooks.alternative(argv, meta, self);
                //meta.rootnamespace = namespace;
                return meta.retValue;
            }
            for (let arg of argv) {
                const val = arg.value;
                retValue = val;
                if (
                    arg.meta.stop
                ) {
                    meta.stop = true;
                    meta.stopinfo = arg.meta.stopinfo;
                    break;
                }
            }
            //meta.rootnamespace = namespace;
            meta.retValue = retValue;
            return retValue;
        };

        for (let ops of opdefines) {
            for (let opdefine of ops) {
                if (opdefine.priority === undefined) {
                    opdefine.priority = priority;
                }
            }
            priority++;
        }
        this.validation();
    }
    get maxpriority () {
        return this.opdefines.length;
    }

    makeblank(word) {
        return new opdefine(
            [word],
            this.join.order.nojoin,
            null,
            "space",
        )
    }

    makepunctuations(left, word, right) {
        const def = new opdefine(
            [left, word, right],
            this.join.order.left,
            (argv, meta, self) => {
                return this.punctuation(argv, meta, self);
            },
            "punctuation"
        );
        def.punctuation = true;
        return def;
    }
}

class value {
    constructor(val, constant, typename = 'object', setter = undefined) {
        this.setter = setter;
        this.value = val;
        this._constant = constant;
        this.typename = typename;
    }

    get setter() {
        return this._setter;
    }
    set setter(val){
        this._setter = val;
    }

    get typename() {
        return this._typename;
    }
    set typename(val) {
        this._typename = val;
    }

    get constant() {
        return this._constant;
    }

    set newValue(val) {
        this._value = val;
    }
    set newType(val) {
        this._type = val;
    }

    set value(val) {
        if (this.constant) {
            myconsole.programerror("This is constant.");
        } else if (this.setter) {
            this.setter(this, val);
        } else {
            this.newValue = val.value;
            this.newType = val.type;
        }
    }

    get value() {
        return this._value;
    }

    get type() {
        return this._type;
    }
}

class property {
    constructor(parent, global = true) {
        this._parent = parent;
        this._local = {};
        this.reserved = {};
        this.nodeclaration = global; // trueのとき、宣言無しのsetはグローバル領域で覚える
    }

    toString  () {
        return this._local;
    }

    get meta() {
        const meta = {
            type: itemtype.types().object,
            self: this,
        };
        return meta;
    }

    get value() {
        return this._value;
    }

    get _value() {
        const value = {};
        for (let key of Object.keys(this._local)) {
            value[key] = this._local[key].value;
        }
        return value;
    }

    get parent() {
        return this._parent;
    }

    set parent(val) {
        this._parent = val;
    }

    include(name, global = false) {
        if (name in this._local) {
            return true;
        }
        if (!global || !this.parent) {
            return false;
        }
        return this.parent.include(name, global);
    }
    declare(name, val, constant, typename, setter) {
        if (name in this._local) {
            myconsole.programerror(name, "is already declared.");
            return false;
        } else {
            this._local[name] = new value(val, constant, typename, setter);
            return true;
        }
    }

    set(name, val, strict = false) {
        if (name in this._local) {
            this._local[name].value = val;
        } else if (!strict) {
            if (!this.nodeclaration || !this.parent) {
                this._local[name] = new value(val, false);
            } else {
                this.parent.set(name, val);
            }
        } else {
            if (this.parent) {
                return this.parent.set(name, val);
            } else {
                myconsole.programerror(name, "is not declared.");
                return false;
            }
        }
        return true;
    }

    access(name) {

    }

    resolve(name) {
        if (name in this._local) {
            return this._local[name];
        }
        if (this.parent instanceof property) {
            return this.parent.resolve(name);
        }
        return undefined;
    }
}


// 計算機クラス
class calculator {
    constructor(conf, code) {
        this.config = conf || new config();
        if (code !== undefined) {
            this.code = code;
        }
    }

    set code(val) {
        if (val instanceof mystr) {
            this._code = val;
        } else {
            this._code = new mystr(val);
        }
        this.parse();
    }
    get code() {
        return this._code;
    }

    get namespace() {
        if (this._namespace === undefined) {
            this.namespace = new property();
        }
        return this._namespace;
    }

    set namespace(val) {
        this._namespace = val;
    }

    get value() {
        const result = this.result.dependency();
        const program = result[0].allnodes;
        program.map(v => v._executed = false);
        const start = program[0].horizonal;
        let index = 0;
        program[0].rootnamespace = this.namespace;
        while (index < program.length) {
            const horizonal = program[index].horizonal;
            if (horizonal == result[0].horizonal) {
                break;
            }
            program[index].val;
            if (program[index].parent) {
                index = Math.max(index + 1, program[index].parent.horizonal - start);
            } else {
                index++;
            }
        }
        if (result.length != 1) {
            myconsole.implmenterror('Cannot complete parse tree.', result.length);
            result.map((v, i) => {
                console.log('----------', i, '----------');
                v.printtree()
            });
        }
        const val = result[0].val;
        if (
            result[0].meta.stop && result[0].meta.stopinfo.return
        ) {
            return val.value;
        }
        return new interpretation().value; // default value
    }

    memorylog(msg) {

        let used = process.memoryUsage();
        let messages = [];
        for (let key in used) {
            messages.push(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
        if (msg) {
            console.log(msg);
        }
        console.log(messages.join(','));
    }

    get trees() {
        this._trees = this.result.dependency();
        return this._trees;
    }

    get root() {
        this.memorylog('before dependency');
        const result = this.result.dependency();
        if (result.length != 1) {
            myconsole.implmenterror('Cannot complete parse tree.', result.length);
            result.map((v, i) => {
                console.log('----------', i, '----------');
                v.printtree()
            });
        }
        const program = result[0].allnodes;
        console.log(this.result.program.length, this.result.program.map(v => v.length).reduce((acc, v) => acc + v, 0));
        this.memorylog('after dependency');
        program.map(v => v._executed = false);
        const start = program[0].horizonal;
        let index = 0;
        program[0].rootnamespace = this.namespace;
        while (index < program.length) {
            const horizonal = program[index].horizonal;
            if (horizonal == result[0].horizonal) {
                break;
            }
            program[index].val;
            if (program[index].parent) {
                index = Math.max(index + 1, program[index].parent.horizonal - start);
            } else {
                index++;
            }
        }
        const val = result[0].val;
        this.memorylog('after value');
        return val;
    }

    return(globalspace) {
        if (globalspace === undefined) {
            this.namespace = new property();
        } else {
            this.namespace = globalspace;
        }
        return this.value;
    }

    parse() {
        this.result = new contexts(this.config);
        this.result.ptr = this.code;
        const words = [];
        while (this.code.length > 0) {
            const read = this.config.getword(this.code);
            words.push(read.keyword);
        }
        this.memorylog('read text');
        words.map(word => this.result.read(word));
        this.memorylog('read contexts');
        return this.result;
    }
}

module.exports = {
    // 値定義
    types: itemtype.types(),
    join: { orders: new order() },
    // クラス
    console: myconsole,
    internalArray,
    config,
    opdefine,
    ctrldefine,
    typeset,
    property,
    calculator,
};
