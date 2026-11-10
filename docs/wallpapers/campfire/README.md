# 焚き火 / Campfire

薪の燃焼、炎、熾火、煙、火の粉をブラウザで描画します。炎は WebGL2 で描画し、利用できない環境では Canvas 2D に切り替えます。

[薪一本の寄り画](./close-up/)では、着火から熾火、灰の崩落までを固定カメラの構図で見られます。

- 薪は燃えている間に炭化し、小さくなって熾火に変わります。左右にドラッグすると風向きが変わります。
- 「油をかける」で炎と火の粉が一時的に強まります。ブラウザ内の演出です。
- 薪の自動補充と風の設定はブラウザに保存されます。
- 音は初期状態では消音です。「音」をオンにすると、焚き火の環境音に加えて、薪が落ちたときの木の音と、油を注いで火勢が強まるときの音が流れます。
- 「設定を閉じる」で操作パネルを閉じられます。「設定を開く」で戻れます。

Claude Fable 5.2 が生成した実装をもとにしています。`forest-pit.webp` は内蔵の画像生成で作成した森と石の背景です。石と地面の明暗を火勢に合わせ、手前の石で薪の下端や火の根元を隠します。外部の画像、音声、ライブラリは読み込みません。


<details>
<summary>石と地面の背景を生成した指示</summary>

Generate one extremely photorealistic widescreen 3:2 cinema still, intended as a background plate for an interactive campfire wallpaper. Static low eye-level front camera looking only about 12 degrees down over a real forest floor at blue hour. Exactly one SMALL natural improvised fire pit in the LOWER center. The center of the empty inner fire bed is exactly x=50%, y=79% of the frame. The OUTER ellipse of stones occupies x=27% to x=73%, y=68% to y=89%. The empty INNER ellipse occupies x=33%–67%, y=73%–85%. Give this exact composition priority. The scene inside the stones is empty and dark, a shallow depression with cool pale-grey powder ash and a few tiny black charcoal crumbs scattered across textured dirt. No wood, no logs, no flame, no sparks, no glowing embers, no red or orange light, no smoke, no camping gear, no people, no text. Stones are individually different, naturally weathered irregular slate-gray and gray-brown granite rocks, embedded and overlapping organically, with rough granular microdetail, chipped edges, cracks, a few dusty and lichen-mottled surfaces. They should look randomly hand-placed, never like perfect identical pebbles. Foreground earth has natural black-brown soil, pine needles and sparse grit, visible fine texture near the ring and softer focus at the very bottom. Top 60% is a dim out-of-focus real forest, layers of irregular pine trunks and dark shapes in near-black navy, no graphic tree silhouettes, no luminous sky or moon. Slight neutral cool diffuse fill, enough exposure to show rock texture and shape, directional darkness between stones, no studio look. Natural photographic focus on ring, realistic broad subtle shadows, camera still clean and dark. Overall muted navy charcoal and slate palette with neutral grays, fully material, no stylization, no illustration, no 3D low-poly aesthetic. All image edges (especially top and sides) should be near black with gentle natural falloff to make aspect-ratio edges easy to blend.

</details>
