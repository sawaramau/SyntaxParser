// 演算子の定義など、解析器が必要とする基礎情報をまとめて保持するクラス
class config {
    constructor(calculator, opdefs) {
        this.join = new order();
        this.calculator = calculator;

        // *****同一の演算子の場合、項数の少ない演算子ほど優先度を高くすること*****
        // 例えば + 1 と 1 + 1 の場合、単項の方が優先度が高い
        // x ? y : z と a ? b の場合 a ? b の方が優先度が高い
        // 現状ではインタプリタなどはないので、名前解決が必要な演算子や制御構文は解析のみで実行できない。
        // リテラルもここで定義する。詳しくはdecやstringの要素を確認
        // リテラルにせよ演算子にせよ、基本的な読み込みは『演算子として解釈可能な最長の単語』単位で行われる。
        this.opdefs = [
            // priority order
            [
                // same priority group
                new opdefine(
                    ["if", "(", 1, ")", "{", "}"],
                    this.join.order.right,
                    (argv) => {
                        () => {
                            if (argv[0].value) {
                                argv[1].value;
                            }
                        }
                    },
                    "if",
                ),
                new opdefine(
                    ["for", "(", 1, ";", 1, ";", 1, ")", "{", "}"],
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
                    "for",
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
                    "return",
                ),
                new opdefine(
                    ["return", 1],
                    this.join.order.right,
                    (argv) => {
                        () => {
                            return argv[0].value;
                        }
                    },
                    "return",
                ),
            ],
            [
                // 区切り文字
                new opdefine(
                    [1, ",", 1],
                    this.join.order.left,
                    (argv) => {
                        if (argv[0].op == ",") {
                            return argv[0].value.push(argv[1].value);
                        }
                        return [argv[0].value, argv[1].value];
                    },
                    ",",
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
                    "?",
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
                    "?",
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
                    ":",
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
                    "!",
                ),
                // 論理演算3
                new opdefine(
                    ["not", 1],
                    this.join.order.right,
                    (argv) => {
                        return !argv[0].value;
                    },
                    "not",
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
                            return true;
                        }
                        return argv[1].value;
                    },
                    "||",
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
                            return false;
                        }
                        return argv[1].value;
                    },
                    "&&",
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
                    "~",
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
                    "|",
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
                    "&",
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
                    "+",
                ),
                new opdefine(
                    [1, "-", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value - argv[1].value;
                    },
                    "-",
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
                    "*",
                ),
                new opdefine(
                    [1, "/", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value / argv[1].value;
                    },
                    "/",
                ),
                new opdefine(
                    [1, "%", 1],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value % argv[1].value;
                    },
                    "%",
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
                    "+",
                ),
                new opdefine(
                    ["-", 1],
                    this.join.order.right,
                    (argv) => {
                        return -argv[0].value;
                    },
                    "-",
                ),
            ],

            [
                new opdefine(
                    ["(", 1, ")", "=>", "{", 1, "}"],
                    this.join.order.right,
                    (argv) => {
                        return (args) => {
                            const a = {};
                            let i = 0;
                            for (let arg of args) {
                                a[argv[i]] = arg;
                                i++;
                            }
                            argv[1].value(a).value;
                        };
                    },
                    "{}",
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
                        return argv[0].value;
                    },
                    "()",
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
                        return argv[0].value;//[argv[1].value];
                    },
                    "[]",
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
                    "()",
                ),
                new opdefine(
                    ["[", 1, "]"],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value;
                    },
                    "[]",
                ),

                new opdefine(
                    ["{", 1, "}"],
                    this.join.order.left,
                    (argv) => {
                        return argv[0].value;
                    },
                    "{}",
                ),
            ],
            // リテラルとか
            [
                new opdefine(
                    (val) => {
                        if ("true".indexOf(val) == 0 || "false".indexOf(val) == 0) {
                            return true;
                        }
                        return false;
                    },
                    null,
                    (val) => {
                        if (val == "true") {
                            return true;
                        }
                        return false;
                    },
                    "bool"
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
                    "hex"
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
                    "dec"
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
                    "variable"
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
                    "string"
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
                    "space",
                    () => {

                    },
                ),
                new opdefine(
                    (val) => {
                        const varreg = /^[\r\n\n]+$/;
                        if (val.match(varreg)) {
                            return true;
                        }
                        return false;
                    },
                    this.join.order.right,
                    null,
                    "newline",
                    () => {

                    }
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
        if (word != "" && matched.length == 0) {
            console.log("No mean character: ", word);
        }
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
            console.log("Duplication enum value");
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
    constructor(grammer, order, formula, groupid, meta, root = 0) {
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
            if (isNaN(elm)) {
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
                if (!isNaN(key)) {
                    continue;
                }
                if (key.slice(0, text.length) == text) {
                    return true
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

    make(keyword, program) {
        if (this._grammer instanceof Array) {
            const int = new interpretation(this);
            int.program = program;
            return int;
        }
        if (this.formula) {
            const def = new opdefine([this.groupid], this.order, () => {
                return this.formula(keyword);
            }, this.groupid, this.meta, this.root);
            def.priority = this.priority;
            const int = new interpretation(def);
            int.program = program;
            return int;
        }
        return undefined;
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
                if (isNaN(elm)) {
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
            if (isNaN(elm)) {
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
            if (isNaN(elm)) {
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
            if (isNaN(elm)) {
                break;
            }
        }
        while (cnt) {
            grammer.shift();
            cnt--;
        }
        const first = grammer.find(elm => isNaN(elm));
        if (first === undefined) {
            this._nexter = null;
            return;
        }

        this._nexter = new opdefine(grammer, this.order, () => {
            // interpretation側で解決
        }, this.groupid, { parent: this }, this.root + 1);

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
            console.log("Unexpected define. This is undefined");
        }

        this._invalid = false;
        this._define = define; // opdefine
        if (parent) {
            // 親の生成直後は位置が確定していないが、その段階では子にとっても親の位置は重要ではないため、
            // 適宜もらう事にする。
            this._parent = () => {
                return parent;
            };
        }
        this._left = [];   // left children
        this._childtrees = []; // 
        this._right = [];  // right children
        this._brothers;
        this._offset = offset;
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
        this._root = {
            horizonal: val.horizonal,
            vertical: val.vertical,
        };
    }

    get root() {
        // 根を取得
        if (this._root) {
            return this.program[this._root.horizonal - this.offset][this._root.vertical];
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
        for (let node of this.nodes) {
            if (node.horizonal == horizonal) {
                return node;
            }
        }
        return undefined;
    }

    set lefttree(val) {
        if (val) {
            this._lefttree = {
                horizonal: val.horizonal,
                vertical: val.vertical
            };
        }
    }
    get lefttree() {
        if (!this._lefttree) {
            return undefined;
        }
        return this.program[this._lefttree.horizonal - this.offset][this._lefttree.vertical]
    }
    set righttree(val) {
        if (val) {
            this._righttree = {
                horizonal: val.horizonal,
                vertical: val.vertical
            };
        }
    }
    get righttree() {
        if (!this._righttree) {
            return undefined;
        }

        return this.program[this._righttree.horizonal - this.offset][this._righttree.vertical]
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
                console.log("Double interpretation violation");
            }
            root = root.parent;
        }
        return {
            left,
            right,
        }
    }

    commit() {
        const left = [];
        for (let child of this._left) {
            if (!(child instanceof interpretation)) {
                const op = this.program[child.horizonal - this.offset][child.vertical];

                op.commit();
                left.push(op);
            } else {
                left.push(child);
            }
        }
        this._left = left;
        const right = [];
        for (let child of this._right) {
            if (!(child instanceof interpretation)) {
                const op = this.program[child.horizonal - this.offset][child.vertical];

                op.commit();
                right.push(op);
            } else {
                right.push(child);
            }
        }
        this._right = right;
    }

    set childtrees(val) {
        this._childtrees = [];
        for (let def of val) {
            const op = def;
            op.program.push([this]);
            op.parent = this;
            // 閉じ記号側から閉じ記号成立時に確認した解釈にアクセスするために必要だと考えたものだが、
            // 現状では閉じ記号出現のたびにprogramをコピーしてそのコピーに対してアクセスできるため、
            // 完全な解釈を適宜持ち合わせられている。
            // op.commit();// ← 不要だと思う。
            this._childtrees.push(op);
        }
    }
    get childtrees() {
        return this._childtrees;
    }

    get args() {
        // 引数として渡すときの左右の要素
        const left = this._left.map(child => {
            if (child instanceof interpretation) {
                return child;
            }
            return this.program[child.horizonal - this.offset][child.vertical];
        });
        const right = (() => {
            const right = [];
            let nexter = this.nexter;
            while (nexter instanceof interpretation) {
                for (let node of nexter.childtrees) {
                    right.push(node);
                }
                for (let node of nexter._right) {
                    if (node instanceof interpretation) {
                        right.push(node);
                    } else {
                        right.push(this.program[node.horizonal - this.offset][node.vertical]);
                    }
                }
                nexter = nexter.nexter;
            }
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                } else {
                    right.push(this.program[child.horizonal - this.offset][child.vertical]);
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

    get children() {
        const left = this._left.map(child => {
            if (child instanceof interpretation) {
                return child;
            }
            return this.program[child.horizonal - this.offset][child.vertical];
        });
        const right = (() => {
            const right = [];
            for (let child of this._right) {
                if (child instanceof interpretation) {
                    right.push(child);
                } else {
                    right.push(this.program[child.horizonal - this.offset][child.vertical]);
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
                console.log("Violation!");
            }
            return l.horizonal - r.horizonal;
        });
        return children;
    }

    get nodes() {
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
                    console.log("Already recorded node!!");
                    break;
                }
                tree.push(child);
                maketree(child.children, tree, maketree);
            }
        };
        const children = this.children;

        maketree(children, tree, maketree);

        tree.sort((l, r) => {
            return l.horizonal - r.horizonal;
        });
        return tree;
    }

    get others() {
        const others = [];
        const roots = this.roots;
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

        for (let def of this.program[this.index]) {
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
            } else if (roots.left.length && !this.define.left && def.priority < max.left.priority) {
                // 自身が左手側に子要素を持たない時、左手側の親要素を越える事は出来ない
                others.push(undefined);
            } else if (roots.right.length && !this.define.right && def.priority < max.right.priority) {
                // 自身が右手側に子要素を持たない時、右手側の親要素を越える事は出来ない
                others.push(undefined);
            } else if (def.define.left > this.index) {
                others.push(undefined);
            } else if (def.define.right + this.index >= this.program.length) {
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

    set program(val) {
        this._program = val;
    }
    get program() {
        return this._program;
    }

    get clone() {
        const elm = new interpretation(this.define, this._parent ? this._parent() : undefined, this.offset);
        elm._nexter = this._nexter;
        elm.childtrees = this._childtrees;
        elm.vertical = this._vertical;
        elm.horizonal = this.horizonal;
        elm._left = this._left.slice();
        elm._right = this._right.slice();
        elm._invalid = this._invalid;
        elm.brothers = this.brothers;
        elm._tmpparent = this._tmpparent;
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
            const nexter = new interpretation(this.define.nexter, this);
            nexter.program = this.program;
            this._nexter = () => {
                return nexter;
            };
            return nexter;
        }
        return this._nexter();
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
            console.log("horizonal index is rewritten");
        }
        this._horizonal = val;
    }
    set vertical(val) {
        if (this._vertical !== undefined) {
            console.log("vertical index is rewritten");
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
        if (this._parent) {
            if (this.parent.invalid) {
                return true;
            }
        }
        if (this.brothers && this.brothers()) {
            return true;
        }

        return this._invalid;
    }
    set invalid(val) {
        if (this._parent) {
            this.parent.invalid = val;
        }
        return this._invalid = val;
    }
    set parent(val) {
        if (this._parent) {
            // _parent は産みの親なので忘れない
            return;
        }
        this._tmpparent = {
            horizonal: val.horizonal,
            vertical: val.vertical,
        };
    }
    get parent() {
        if (this._parent) {
            return this._parent();
        }
        let horizonal;
        let vertical;
        if (this._tmpparent) {
            horizonal = this._tmpparent.horizonal - this.offset;
            vertical = this._tmpparent.vertical;
        } else {
            return undefined;
        }
        if (this.program && 0 <= horizonal && horizonal < this.program.length) {
            return this.program[horizonal][vertical];
        }
        return undefined;
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
    setleft(val) {
        if (this.horizonal <= val.horizonal) {
            return false;
        }
        if (this.left > 0) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {

                return false;
            }
            val.parent = this;
            this._left.unshift(
                {
                    vertical: val.vertical,
                    horizonal: val.horizonal
                },
            );
            return true;
        }
        return false;
    }
    setright(val) {
        if (this.horizonal >= val.horizonal) {
            return false;
        }
        if (this.right > 0) {
            if (this.priority > val.priority) {
                return false;
            }
            if (val.parent) {
                return false;
            }
            val.parent = this;
            this._right.push({
                vertical: val.vertical,
                horizonal: val.horizonal
            });
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
            console.log("Unmatch operator", interpretation.fullgrammer, ",", this.first);

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
            console.log("All interpretations invalid!!");
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
                const clone = def.clone;
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
                    const op = new opdefine(grammer, other.order, undefined, "tree");
                    op.priority = other.priority;
                    const int = op.make(undefined);
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
                    console.log("undefined code!!");
                    continue;
                }

                if (op.invalid || !op.finished) {
                    continue;
                }
                const interpretation = interpretations.find(def => def.horizonal == op.horizonal);
                if (interpretations.length && !interpretation) {
                    console.log("Error!!", op.fullgrammer, op.define.first, op.horizonal);
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
                        program[i][vertical] = nexter;
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
        const interpretations = roots.reduce((acc, root) => {
            const nodes = []
            let rec = (node, rec) => {
                if (r && node.horizonal == r.horizonal) {
                    nodes.push(r);
                } else {
                    nodes.push(node);
                }
                for (let child of node.children) {
                    rec(child, rec);
                }
                for (let child of node.childtrees) {
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
                console.log("Violation!");
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

        return this.retree(program);
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

            if (self.invalid || !self.finished) {
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

                // 探索方向の必要子要素が0になっても終了
                if ((step == -1) && !self.left || (step == 1) && !self.right) {
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
                for (let neighbor of neighbors) {
                    // より優先度の高い子を探す
                    if (self.priority > neighbor.priority) {
                        // 自身の優先度より低い要素は無視。これ以降も総じて優先度が低いのでbreak
                        break;
                    } else if ((neighbor.left) || (neighbor.right)) {
                        // 隣接要素が子を揃えられていないならば、その隣接要素は地雷なので無視
                        continue;
                    } else if (neighbor.invalid || !neighbor.finished) {
                        // 別ルートでinvalid指定されている要素も無視
                        neighbor.invalid = true;
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
                        if (neighbor.nexter && neighbor.nexter.horizonal !== undefined) {
                            i = Math.abs(neighbor.nexter.horizonal - self.horizonal) > i ?
                                Math.abs(neighbor.nexter.horizonal - self.horizonal) : i;
                        }
                        // 優先度の高い命令に優先的に親として結合するのでbreak
                        break;
                    }
                }
                i++;
            }


            if (
                (self.order != this.config.join.order.right && order)
                || (self.order == this.config.join.order.right && !order)
            ) {
                // 結合順序と同一の検証後は終了処理をする。
                if (self.left || self.right) {
                    // 失敗したので、確保した子要素を解放
                    if (self.fail) {
                        self.fail();
                    }
                    //self.invalid = true;
                } else {
                    // 成功したので
                    if (self.success) {
                        self.success();
                    }
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
        for (let define of this._constant) {
            if (define.firstmatch(keyword)) {
                const op = define.make(keyword, this.program);
                if (op) {
                    current.push(op);
                    if (op.nexter) {
                        open = true;
                    }
                }
            }
        }
        if (open) {
            const con = new context(keyword);
            con.context = current;
            this._temporary.unshift(con);
        }
        return current;
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
                this._temporary[index].context = nexters.filter((op) => {
                    if (op) {
                        const roots = this.dependency(op.parent.horizonal + 1);
                        if (roots.length != op.left) {
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
    calculator
};