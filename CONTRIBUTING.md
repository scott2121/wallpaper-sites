# 壁紙を追加する

1. このリポジトリをフォークして作業用ブランチを作成します。
2. 英小文字、数字、ハイフンからなる固有のIDを決めます。例は `rainy-window` です。
3. `docs/wallpapers/rainy-window/index.html` と必要なファイルを追加します。画像、音声、スクリプトは相対パスで参照してください。ビルドが必要な場合は、ソースと再現手順を `projects/rainy-window/` に、ビルド結果を `docs/wallpapers/rainy-window/` に置きます。
4. `docs/_data/wallpapers.json` の配列に以下の項目を追加します。任意の `subtitle` を添えられます。既存の計画を公開するときは、その項目の `status` を `published` に更新します。

   ```json
   {
     "id": "rainy-window",
     "title": "雨の窓辺",
     "description": "窓ガラスを伝う雨粒を眺める壁紙。",
     "status": "published"
   }
   ```

5. Jekyll をインストールし、リポジトリのルートで `jekyll serve --source docs --baseurl /wallpaper-sites` を実行します。ブラウザで `http://localhost:4000/wallpaper-sites/` を開き、一覧から壁紙が開けることを確認してください。壁紙のページにも固有の `<title>` と `meta description`、ページ内に読める名前と説明を付けてください。
6. 変更をコミットしてフォークにプッシュし、このリポジトリの `main` に Pull Request を送ります。説明には動作確認の結果と素材の出典を記入してください。

コードのライセンスと、画像・音声・フォントなどの出典および再配布条件を、該当する壁紙の README などに明記してください。各壁紙は同じ公開サイト上で動作するため、外部への通信、ストレージの利用、依存ライブラリはレビュー時に確認します。設定を保存する場合は、壁紙のIDを含む固有のキーを使ってください。

マージ後、壁紙は `https://scott2121.github.io/wallpaper-sites/wallpapers/<id>/` で公開されます。
