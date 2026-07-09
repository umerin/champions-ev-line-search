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
  type-chart.json
  champions-rules.json
  champions-availability.json
scripts/
  fetch-pokeapi-data.mjs
LICENSE
NOTICE.md
```

## 現在できること

- 自分のポケモン、HP、防御、特防、残りポイントを入力
- シングル/ダブルを選択
- 攻撃側ステータスポイントを0-32で自由入力
- 性格補正、物理/特殊、タイプ相性で絞り込み
- 残りポイントをH/B/Dへ振る全候補を探索
- 最大乱数ダメージが変わる相手、技、攻撃実数値、変化量を表示

## 注意

- `data/*.json` は動作確認用の少量サンプルです。
- ステータスポイントは0-32の33段階、合計66として扱います。
- 非HPは性格補正前にステータスポイントを加算し、HPは最終値に加算します。公式の詳細式が確認できたら `app.js` の計算関数だけ差し替えます。
- PokéAPIからの本格データ取得は `scripts/fetch-pokeapi-data.mjs` を拡張して対応します。

## PokéAPIデータの取得

Windowsでは、まず以下を実行します。

```bat
update-data.bat
```

全ポケモン・全技を取得したい場合はこちらを実行します。

```bat
update-all-data.bat
```

全件取得はPokéAPIへのリクエスト数が多いため、数分かかることがあります。

ネットワークが使える環境で以下を実行します。

```bash
node scripts/fetch-pokeapi-data.mjs
```

全件取得:

```bash
node scripts/fetch-pokeapi-data.mjs --all
```

通常実行はサンプル対象だけを取得します。全件取得では、各ポケモンの覚える技から技ごとの使用者リストを逆引き生成し、威力のある物理/特殊技だけを `moves.json` に出力します。

## チャンピオンズ使用可否の絞り込み

`data/champions-availability.json` で管理します。

```json
{
  "restrictPokemon": true,
  "pokemon": ["pikachu", "garchomp", "gholdengo"],
  "restrictMoves": false,
  "moves": []
}
```

`restrictPokemon` を `true` にすると、画面の「チャンピオンズのみ」で `pokemon` に入れたPokéAPI IDだけを表示・検索します。公式リストが増えたらこのJSONだけ更新します。

## ライセンスと注意

- このリポジトリの自作コードはMIT Licenseです。
- データはPokéAPI由来です。PokéAPIはBSD-3-Clause licenseです。
- ダメージ計算の挙動はPokémon Showdownを参考にしています。Pokémon ShowdownはMIT Licenseです。
- Pokémonおよびポケモンの名称は各権利者の商標です。
- このプロジェクトはAI支援で作成されています。対戦で使う前に計算式とデータを確認してください。
- 詳細は `NOTICE.md` を参照してください。

公開時は、公式ロゴ、公式画像、ゲーム内画像、公式と誤認される表現を使わないでください。
