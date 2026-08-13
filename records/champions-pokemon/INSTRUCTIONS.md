# AI editing instructions

このディレクトリは、チャンピオンズ登場ポケモンだけを対象にした調査・記録用データです。
耐久ラインサーチのWebアプリはこのディレクトリを読み込みません。

## 構成

- `index.json`: ID・図鑑番号・表示名・個別ファイルの索引
- `entries/<pokemon-id>.json`: 1ポケモンにつき1ファイルの記録
- `schema.json`: 記録形式

## 編集方針

1. 対象ポケモンを `index.json` または `rg` で探し、対応する個別ファイルだけを読む。
2. 調査中の情報は先に個別ファイルへ記録する。Webアプリ用の `data/*.json` へは、反映を明示された場合だけ同期する。
3. 習得技は `learnset.moveIds` に技IDで記録する。技IDは `data/moves.json` に存在するものを使う。
4. 根拠URL・資料名は `learnset.verification.sources` または `research.sources` に記録する。
5. 習得を確認できた技は `verifiedMoveIds`、誤登録と確認できた技は `rejectedMoveIds` に記録する。
6. 全習得技を確認できた場合だけ `learnset.verification.status` を `verified` にする。
7. 体重は `weight.kg` にkg単位で記録し、根拠と確認状況を `weight.verification` に記録する。
8. 自由な追加情報は `extensions` に記録し、既存フィールドへ無理に詰め込まない。

編集後は次を実行する。

```powershell
node scripts\validate-champions-pokemon-records.mjs
```

`initialize-champions-pokemon-records.mjs` は未作成の個別ファイルだけを初期生成し、既存の調査記録を上書きしません。
