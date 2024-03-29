# 構文解析器
* configクラス内の句点、予約語、演算子、制御構文定義をもとに構文解析～演算実行まで行う何か。

# 使い方
* デフォルト（適当設計）のconfigを使用する場合のサンプルコード
```javascript
const Calc = require("./calculator.js");
const calc = new Calc.calculator(); // デフォルトのconfigを使用
calc.code = 'var test = 1;log("sample code executed"); return 1 + test';
console.log(calc.value);
```
* 適当設計なcsvパーサー用configを使用する場合のサンプルコード
```javascript
const csv = require("./csvparser.js");
csv.code = 'test, aaa,"aaa""aa"\r\nabcd';
csv.processor = (val, col, row) => {
    if (col == 0) {
        if (row !== 0) {
            process.stdout.write('\r\n');
        }
    }
    process.stdout.write(val + '/');
};
csv.value;
```

# 句点定義
* 句点として扱う文字列、または句点判定する関数を配列形式で定義します。
* 句点はpunctuationsとpuncblanksの2種類があります。
* punctuationsは必ず句点として扱われますが、puncblanksはその前後を横断するような演算子があるとき、空白文字として振る舞います。
* 扱うコード量が多い場合、punctuationsを定義し、こまめに句点を記述することを推奨します。
  * 確定的な句点ごとまたは囲みごとに構文解析処理を行うため。

# 予約語定義
* 予約語として扱う文字列を配列形式で定義します。
* 単体で意味を持つ単語は変数名などの可変要素に組み込まれると正しく動作しなくなるため、予約語として事前に登録しておきます。

# 演算子定義
* opdefineクラスを利用し以下を定義し、優先度順に配列形式で定義します。
  + 文法
  + 結合方向
  + 実行式
* 優先度の定義は以下のようになります。
```javascript
[
    [opdefine1, opdefine2], // priority low
    [opdefine3, opdefine4], //      ↓
    [opdefine5]             // priority high
]
```
* 同一記号でオペランド数の異なる演算子定義を登録する場合、オペランド数の多い定義ほど優先度を低くしてください。

# 制御構文定義
* ctrldefineクラスを利用し、以下を定義します。
  + 文法
  + 実行式
* 演算子定義と異なる点は以下です。
  + 結合方向が左方向で固定です
  + 自身で定義した定義のほかに<左に1項追加><右に1項追加><左右に1項ずつ追加>した場合の定義が同時に生成されます
    * ただし演算式定義時に左に追加された1項はアクセスできません。（右の追加分はアクセス可能です）
  + 優先度は固定で、演算子定義より低く設定されています。（0～2）

# 定義詳細
## 文法定義
* 文法定義は演算子となる文字列とオペランドとなる項数（とその位置）を配列形式で指定します。
* 演算子の定義は句点の定義と同様に文字列で指定する方法と関数で指定する方法があります。
  + 文字列による指定
```javascript
[1, "+", 1]
```
* 数値は左右のオペランド数で、文字列が演算子の識別記号です
* カッコなどの囲み文字も同様に以下のように指定可能です
```javascript
[1, ',', 1] // 並記
[1, "[", 1, "]"] // アクセサ
["[", 1, "]"] // 配列宣言
["[", "]"] // 空の配列宣言
```
* 例えば上記のような配列定義は以下のようにまとめることができます。
```javascript
["[", 0.5, "]"] // 中身が空、または中身を伴う事のある配列宣言
```
* 一見、配列宣言時に中身が1つしかとれないように見えますが、カンマによる並記演算子を用いることで同時に複数の要素を持つ配列の宣言も可能です。
+ 関数による指定
```javascript
[(val, ptr, self) => {
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
}]
[(val, ptr, self) => {
    const varreg = /^[a-zA-Z_][\w]*$/;
    if (val.match(varreg)) {
        return true;
    }
    return false;
}]
```
* 変数名などの可変な要素に対して有用です。
* ただし、関数で定義する場合に予約語となる単語は除外されます
* 先読みや、囲み文字の先頭部分に応じて一致不一致を決めることも一応できます（少し煩雑になりますが）
* ptrは単語選定時、selfは解釈決定時以外はundefinedとなっています。
  * 使いどころが難しいため、基本的にはあまり使いません。

## 実行式定義
* 実行式は以下の関数形式で定義します。
```javascript
(argv, meta, self) => {
    // argv: オペランドの配列
    // meta: 自身の演算子が管理しているメタ情報
    // self: 演算子本体（metaはself.metaと同一）
    return argv[0].value + argv[1].value;
}
```
* argv[x]とselfは同じクラスのインスタンスです。
* 変数などの名前空間は特に指定しない限り、親子で共通です。
* 名前空間を変更したい、辞書を作りたいなどはcalculator.jsの演算子定義を参考にしてください。
* 演算子の文字列を取得したい場合、self.operator.keywordを参照してください。