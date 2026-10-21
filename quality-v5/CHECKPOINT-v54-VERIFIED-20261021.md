# 清水寺3D / v5.4 公開検証済みの再開地点

## この記録で確定した状態
- 確認用サイト: https://kiyomizu-quality-v5.onrender.com
- Render service: srv-dbc7c7rrjlhs73b387dg
- Render deploy: dep-dbcdhhbrjlhs73bl1g90
- 公開コミット: 59dbcf9638570caaeff35b1250b31d1c0457d69e
- 公開日時: 2026-10-21T15:47:13Z。再開時にRenderのstatus=liveを読み直した。
- model/viewer: quality-v5.4。旧mainサイトは今回変更していない。
- 前のCHECKPOINT-v54-20261021.mdでは公開中だったが、この記録時点では完了している。

## 中断前に完成・公開していた変更
樹冠のシルエット、枝分かれ、扁平な花房、葉群の高低差を調整。軒下を読み取りやすくする固定補助光を変更。樹木の形状変更に合わせて96サンプルの照明を再計算した。
**この更新では本堂の形状・比率を変更していない。実物との建築精度が上がったとは主張しない。**

## 今回回収した検証証拠
- GitHub Actions run: 39625023465 / conclusion=success。
- Artifact: 12358298863 / kiyomizu-quality-v54-browser-verified。
- ZIP SHA256: 13e75a2a55b34179fab0a1b5aa37530c4aa84960931a87474c1fe6dad38f3094。
- ZIPを取得・展開し、test-results.jsonとgeometry-integrity.jsonを読んだ。全景・接写画像を実際に目視確認した。
- 保存された公開版ブラウザ試験: 30 checks passed、errors=[]。
- 保存された形状・照明対応試験: 10 checks passed。
- 試験環境: GitHub-hosted Linux / Chromium software WebGL。iPhone/Android実機での性能検証ではない。
- 今回、新しいブラウザ試験を実行したという意味ではない。中断前の公開後試験記録を回収・確認した。
- lighting.bin: 12,251,304 bytes / SHA256 9c116017c72bfc12b12ad0a94104b6883830562503735d0f9151022756c73a62。
- scene.js SHA256: c4573b9fc80a0473e57d78096abf51692cc9864211e4e3b98429b406022a5e77。

## 途中報告後、この再開作業で実行したこと
`quality-v5/tests/architecture-observed-audit.cjs` を追加し、回収した公開版siteを対象に実行した。モデルの説明用メタデータではなく、生成された柱インスタンス・屋根頂点を読み取る検証。
- 正面の対象回廊柱列: 10本 / 9区間。
- 左右の対象外側柱列: それぞれ7本 / 6区間。
- モデル内のmainBays表記は[9,7]。外側柱列が正式な柱割りと対応するかは未検証であり、この結果だけで実物の梁間が誤っているとは断定しない。少なくともメタデータだけを正確さの証明に使わない。
- 舞台支持柱の対象インスタンス: 18本。正しい配置・寸法・仕口の証明ではない。
- 主屋根メッシュ外接寸法: 幅16、奥行11.4、高さ3.72（模型の座標単位。実寸メートルではない）。
- scene / renderer / app / index / lightingのハッシュが実行前後で不変なことを確認。
- この監査は読み取り専用。追加の造形改良や追加デプロイは行っていない。

## 未完了・品質判定
コンセプト同等の美的品質、実際の清水寺の輪郭・比率・細部の精密再現、境内の測量配置、スマートフォン実機の発熱・メモリ・速度は未達または未確認。公開とテスト成功を完成判定に置き換えない。新しい画像生成で実際の3Dモデルの改善を代用しない。

## 次の制作単位
1. 同じカメラと寸法基準で、本堂の主屋根・翼廊・舞台・側面柱列を照合する。公式の概数を箇所ごとに別縮尺で当てはめない。
2. 写真や図面と対応を確定してから、外形・柱割り・床と斜面の比率を別作業用コピーで修正する。
3. 幾何形状を変更したら照明も再計算。全景・接写・縦画面・回転の比較後だけ公開する。
4. 一回の作業を一つの検証単位で区切り、コード・結果・次の入口を保存する。長い処理が中断されても、検証済み公開版を残す。

## 再実行
```sh
node quality-v5/tests/architecture-observed-audit.cjs <verified-site-directory> <report.json>
```
この監査が正常終了しても「建築精度合格」を返さない。返す状態はinspection_complete_not_accuracy_approved。
