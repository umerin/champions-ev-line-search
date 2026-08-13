# チャンピオンズ努力値サポート 試作

PokéAPI由来のJSONを使う想定で作った、耐久努力値の逆引きWEBアプリ試作です。

This is an unofficial fan-made tool. It is not affiliated with, endorsed, sponsored, or specifically approved by Nintendo, Creatures Inc., GAME FREAK inc., or The Pokémon Company.

This project was created with AI assistance. Please review calculations and data before relying on them for competitive play.

## ファイル構成

```text
index.html
styles.css
app.js
data/
  pokemon.json
  moves.json
  learnsets.json
  battle-effects.json
  type-chart.json
  champions-rules.json
scripts/
  validate-data.mjs
LICENSE
NOTICE.md
```

## 現在できること

- 自分のポケモン、HP、防御、特防、残りポイントを入力
- シングル/ダブルを選択
- 攻撃側ステータスポイントを0-32で自由入力
- 性格補正、物理/特殊、タイプ相性で絞り込み
- ポケモンごとに検索対象の技を選択し、設定を保存
- フォルム違いのポケモン名を「ポケモン名（フォーム名）」で表示
- 残りポイントをH/B/Dへ振る全候補を探索
- 最大乱数ダメージが変わる相手、技、実数値、補正、技威力、変化量を表示

## データ管理

- `data/*.json` を正本として、ブラウザから直接読み込みます。Excelへの変換や事前生成は不要です。
- `pokemon.json` はポケモン情報とポケモンごとの `championsTarget` を管理します。
- `moves.json` は技情報と技ごとの `championsTarget` を管理します。
- `moves.json` の `isContactMove` は、技が接触技かどうかを管理します。判定は Pokémon Showdown の技フラグ `contact` を基準にしています。
- `learnsets.json` はポケモンIDごとの習得技ID一覧を管理します。
- `battle-effects.json` は特性・天候などの対象、補正値、検索結果の表示を管理します。
- 更新後は `node scripts/validate-data.mjs` でID・重複・対象数を高速に検証できます。
- ステータスポイントは0-32の33段階、合計66として扱います。現在のH/B/Dポイントと残りポイントの合計が66を超える入力は検索できません。
- 非HPは性格補正前にステータスポイントを加算し、HPは最終値に加算します。公式の詳細式が確認できたら `app.js` の計算関数だけ差し替えます。

## チャンピオンズ使用可否の絞り込み

`pokemon.json` と `moves.json` の各項目にある `championsTarget` で管理します。

```json
{
  "id": "garchomp",
  "championsTarget": true
}
```

`true` の項目が通常の検索対象になり、「全データ」を選ぶと対象外の項目も含めて検索します。

## ライセンスと注意

- このリポジトリの自作コードはMIT Licenseです。
- データはPokéAPI由来です。PokéAPIはBSD-3-Clause licenseです。
- ダメージ計算の挙動はPokémon Showdownを参考にしています。Pokémon ShowdownはMIT Licenseです。
- Pokémonおよびポケモンの名称は各権利者の商標です。
- このプロジェクトはAI支援で作成されています。対戦で使う前に計算式とデータを確認してください。
- 詳細は `NOTICE.md` を参照してください。

公開時は、公式ロゴ、公式画像、ゲーム内画像、公式と誤認される表現を使わないでください。
