# 焚き火 / Campfire

薪の燃焼、炎、熾火、煙、火の粉をブラウザで描画します。大きな炎は WebGL2 で描画し、利用できない環境では Canvas 2D に切り替えます。薪の隙間から伸びた炎は木肌を包みながら立ち上がり、奥の炎に合流します。

[薪一本の寄り画](./close-up/)では、着火から熾火、灰の崩落までを固定カメラの構図で見られます。

- 薪は燃えている間に炭化し、小さくなって熾火に変わります。左右にドラッグすると風向きが変わります。
- 「油をかける」と、注いだ場所から炎と火の粉が上がり、薪や石が一時的に明るくなります。ブラウザ内の演出です。
- 薪の自動補充と風の設定はブラウザに保存されます。
- 音は初期状態では消音です。「音」をオンにすると、火勢に合わせてはぜる音の強さや間隔が変わります。薪が落ちたときや、油を注いで火勢が強まるときには、それぞれの効果音が鳴ります。
- 「設定を閉じる」で操作パネルを閉じられます。右下の三本線のボタンで再び開けます。

Claude Fable 5.2 が生成した実装をもとにしています。`forest-pit.webp` は内蔵の画像生成で作成した森と石の背景です。石と地面の明暗を火勢に合わせ、手前の石で薪の下端や火の根元を隠します。外部の画像、音声、ライブラリは読み込みません。

`log-materials.webp` は内蔵の画像生成で作成した薪の素材です。2種類の薪がそれぞれ、燃焼に合わせて樹皮が残る状態から黒く炭化した状態へと移り変わります。薪と熾火の割れ目は火勢に合わせて明滅し、炎は風に沿ってなびきます。

<details>
<summary>薪の素材を生成した指示の概要</summary>

Create a transparent two-by-two atlas of photoreal split firewood with two different bark and end-grain patterns. Match the exact silhouette and view of the fresh and charred versions in each row. Show cracked bark, rough split wood, and irregular charcoal fissures. Use neutral lighting without fire, glow, smoke, or cast shadows.

</details>

<details>
<summary>石と地面の背景を生成した指示</summary>

Generate one extremely photorealistic widescreen 3:2 cinema still, intended as a background plate for an interactive campfire wallpaper. Static low eye-level front camera looking only about 12 degrees down over a real forest floor at blue hour. Exactly one SMALL natural improvised fire pit in the LOWER center. The center of the empty inner fire bed is exactly x=50%, y=79% of the frame. The OUTER ellipse of stones occupies x=27% to x=73%, y=68% to y=89%. The empty INNER ellipse occupies x=33%–67%, y=73%–85%. Give this exact composition priority. The scene inside the stones is empty and dark, a shallow depression with cool pale-grey powder ash and a few tiny black charcoal crumbs scattered across textured dirt. No wood, no logs, no flame, no sparks, no glowing embers, no red or orange light, no smoke, no camping gear, no people, no text. Stones are individually different, naturally weathered irregular slate-gray and gray-brown granite rocks, embedded and overlapping organically, with rough granular microdetail, chipped edges, cracks, a few dusty and lichen-mottled surfaces. They should look randomly hand-placed, never like perfect identical pebbles. Foreground earth has natural black-brown soil, pine needles and sparse grit, visible fine texture near the ring and softer focus at the very bottom. Top 60% is a dim out-of-focus real forest, layers of irregular pine trunks and dark shapes in near-black navy, no graphic tree silhouettes, no luminous sky or moon. Slight neutral cool diffuse fill, enough exposure to show rock texture and shape, directional darkness between stones, no studio look. Natural photographic focus on ring, realistic broad subtle shadows, camera still clean and dark. Overall muted navy charcoal and slate palette with neutral grays, fully material, no stylization, no illustration, no 3D low-poly aesthetic. All image edges (especially top and sides) should be near black with gentle natural falloff to make aspect-ratio edges easy to blend.

</details>
