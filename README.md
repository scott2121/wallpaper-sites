# 壁紙アトリエ / Wallpaper Atelier

ブラウザで動く壁紙を集める公開ギャラリーです。壁紙ごとに独立したURLを持ち、ソースはこのリポジトリで公開します。

**[ギャラリーを開く](https://scott2121.github.io/wallpaper-sites/)** · **[壁紙の追加方法](CONTRIBUTING.md)**

| 壁紙 | 状態 | 内容 |
| --- | --- | --- |
| [夕日 / Living Sunset](https://scott2121.github.io/wallpaper-sites/wallpapers/living-sunset/) | 公開中 | 草原や街の夕景を生成し、日が沈むにつれて空の色や反射が変化する |
| [焚き火 / Campfire](https://scott2121.github.io/wallpaper-sites/wallpapers/campfire/) | 公開中 | 揺れる炎と舞い上がる火の粉を眺めながら、薪をくべられる |

## リポジトリの構成

- `docs/index.html` は公開ギャラリーです。
- `docs/_data/wallpapers.json` に掲載情報を登録します。
- `docs/wallpapers/<id>/` に各壁紙の公開用ファイルを配置します。ビルドが必要な壁紙のソースは `projects/<id>/` に置けます。

GitHub Pages は `main` の `docs/` から Jekyll で一覧とサイトマップを生成します。追加や更新は Pull Request で受け付け、マージ後に反映されます。
