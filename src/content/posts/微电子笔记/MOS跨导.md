---
title: MOS 跨导
published: 2026-10-09
publish: true
draft: false
description: 微电子笔记写作示例中的定义与推导。
tags:
  - 微电子
  - 模拟电路
category: 微电子笔记
---

## 定义

跨导描述漏极电流对栅源电压的敏感程度：

$$
g_m = \left.\frac{\partial I_D}{\partial V_{GS}}\right|_{V_{DS}}
$$

跨导的单位为西门子（S）。 ^gm-definition


## 长沟道近似

在长沟道平方律近似、饱和区且忽略沟道长度调制时：

$$
I_D = \frac{1}{2}\mu_n C_{\mathrm{ox}}\frac{W}{L}(V_{GS}-V_{TH})^2
$$

因此 $g_m = 2 I_D/(V_{GS}-V_{TH})$。实际器件需要根据模型和工作点分析。

[[微电子写作示例|回到写作示例]]
