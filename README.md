# 構文解析器
* configクラス内でopdefineに従って演算子を定義するだけで使える構文解析器

# 設定項目
* 文法
* 入出力の関係（入力型と出力型の関係定義）
* 演算内容
* その他、結合順序等（ここでの説明は省略しています）

# 設定方法
## 文法定義
### 典型的な演算子・標準関数・制御構文・句読点の定義（1項以上の引数をとる演算子の定義）
* 配列形式で定義
```javascript
[1, "+", 1]
```
* 数値は項の数で文字列は演算子の識別記号です
* 例えば以下のように書き換える事で前置の加算演算子に変わります
```javascript
["+", 2]
```
* 囲い込むタイプの演算子も定義可能です
```javascript
["(", 1, ")"]
[1, "?", 1, ":", 1]
```

### 変数・リテラル・空白文字などの定義（0項の演算子）
* true/falseのような予約語は通常の演算子同様、配列形式で指定します
```javascript
["true"]
["false"]
```
* 変数や数値など可変な要素は関数形式で定義します
```javascript
(val) => {
    if (val.length == 1 && val == "0") {
        return true;
    } else if (val.length == 2 && val == "0x") {
        return true;
    }
    const hexreg = /^(0x[\da-fA-F]+)$/;
    if (val.match(hexreg)) {
        return true;
    }
    return false;
}
(val) => {
    const varreg = /^[a-zA-Z_][\w]*$/;
    if (val.match(varreg)) {
        return true;
    }
    return false;
},
```
* 上記のように、先頭から一致している限りtrueを返すような関数を定義する事で変数・リテラルを定義可能です
* 変数の場合、演算方法の定義で別途名前解決の方法を用意する必要があります
* 配列による定義は関数による定義より優先されます
* 予約語は必ず配列形式で定義してください
* 空白文字は一番優先度を高くしてください
* 空白と句読点のどちらでも解釈する可能性がある記号は配列形式で指定してください

## 入出力定義
* 入出力の関係はtypesetクラスを用いて指定します
* 指定内容は以下の通りです
    + 入力セット
    + 入力セットに対応する出力
    + 各入力に使用不可能な型
    + 実行時に決定されるような型の場合、型の決定法
```javascript
new typeset(
    [
        // input 1 type, input 2 type,...
        [this.types.number, ...],   // input set 1
        [this.types.string, ...],   // input set 2
    ],
    [
        // output 1, output 2, ...
        this.types.punctuation, this.types.delegate, ...
    ],
    [
        [this.types.punctuation], // Unavailable types for input 1
        [this.types.punctuation], // Unavailable types for input 2
    ],
    [
        // delegate output 1
        (children) => {
            // if ouput type delegete,
            // types decide this method
        },
    ],
)
```

## 演算方法の定義
* 定義した演算子に対して、演算方法を定義できます
```javascript
["+", 2]
["true"]
```
* 例えば、上記のような演算子定義に対して、以下のように演算を定義できます。
```javascript
// + 2
(args) => {
    return args[0].value + args[1].value;
}
// true
() => {
    return true;
}
```
* リテラルの場合
```javascript
// hex
(val) => {
    return parseInt(val, 16);
}
```
* 配列形式の項においてアクセス可能な要素
    + value : その要素の実行結果
    + type : その要素の型（一部のみ実装）
