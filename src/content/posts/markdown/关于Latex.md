---
title: 关于Latex
published: 2025-11-04 
description: About Latex.
tags: [Markdown,Latex]
category: Markdown
licenseName: "Unlicensed"
author: bytestring
draft: false
---

> 可以使用Latex在Markdown里嵌入公式  
> ~~写一半发现Shokax好像不太支持行内公式，改成块级公式吧~~  
> ~~可以非常粗暴地在layout.pug里加入katex支持来做到行内公式渲染~~  
> 关于我受不了latex支持而把博客迁移了这回事  
# 一、基础语法
## 行内公式
$ a^2 + b^2 = c^2 $
## 块状公式
$$ a^2 + b^2 = c^2 $$
```latex
$ a^2 + b^2 = c^2 $
$$ a^2 + b^2 = c^2 $$
```
# 二、数学结构
## 上下标
$ a^2 \space x_i \space y_{12} \space e^{i\pi} $
```latex
$ a^2 \space x_i \space y_{12} \space e^{i\pi} $
```
## 分数
$ \frac{a}{b} \space \frac{1}{x}{y} \space \dfrac{x}{y} $
```latex
$ \frac{a}{b} \space \frac{1}{x}{y} \space \dfrac{x}{y} (强制大分数) $
```

## 根号
$ \sqrt{A_{1}^{2} + A_{2}^{2}} \space \sqrt[3]{a^{3} + b^{3}} $

```latex
$ \sqrt{A_1^2 + A_2^2} \space \sqrt[3]{a^3 + b^3} $
```

# 三、常用符号
## 求和和乘积
$ \sum \space \sum_{i=1}^{n}{i^2} \space \prod \space $
还有另一种块内求和不太一样
$$ \sum_{i=1}^{n}{i^2} \\
    \prod_{i=1}^n{i}
$$

```latex
$ \sum \space \sum_{i=1}^{n}{i^2} \space \prod \space $
$$ \sum_{i=1}^{n}{i^2} \\
    \prod_{i=1}^n{i}
$$
```

## 积分
$ \int \space \int_1^2 xdx = \frac{3}{2} \space \int_{-\infty}^{+\infty}t \times e^t dt \space \displaystyle\int_{-\infty}^{+\infty} $

```latex
$ \int \space \int_1^2 xdx = \frac{3}{2} \space \int_{-\infty}^{+\infty}t \times e^t dt \space \displaystyle\int_{-\infty}^{+\infty} $
```

## 极限
$ \lim \space \lim_{x \to 0^+} \frac{\sin x}{x} = 1 $

```latex
$ \lim \space \lim_{x \to 0^+} \frac{\sin x}{x} = 1 $
```



## 运算符
$ + - \times \div \lt \gt \le \ge \pm \mp $

```latex
$ + - \times \div \lt \gt \le \ge \pm \mp $
```
## 希腊字母
$ \alpha \space \beta \space \Gamma $

```latex
$ \alpha \space \beta \space \Gamma $
```

## 文本
$ \text{Hello world} \space \textcolor{red}{Red} $

```latex
$ \text{Hello world} \space \textcolor{red}{Red} $
```
## 矩阵和行列式

$$ 
\begin{bmatrix}
    1 & 2 \\
    2 & 1 
\end{bmatrix}
\\
\begin{vmatrix}
    1 & 2 \\
    3 & 4
\end{vmatrix}
$$

```latex
$$ \begin{bmatrix}
    1 & 2 \\
    2 & 1 \\
    3 & 3
\end{bmatrix} $$
\\
\begin{vmatrix}
    1 & 2 \\
    3 & 4
\end{vmatrix}
```

# 四、排版
## 对齐


$$
\begin{aligned}
    \left\{
        \begin{aligned}
            2x + y &= 1  \\
            2x + 2y &= 2
        \end{aligned}
    \right.
\end{aligned}
$$

有标号

$$
\begin{align}
    f & = (a+b)^2 \\
      & = a^2 + 2ab + b^2
\end{align}
$$

无标号

$$
\begin{align*}
    f & = (a+b)^2 \\
      & = a^2 + 2ab + b^2
\end{align*}
$$

```latex
$$
\begin{aligned}
    \left\{
        \begin{aligned}
            2x + y &= 1  \\
            2x + 2y &= 2
        \end{aligned}
    \right.
\end{aligned}
$$
$$
\begin{align}
    f & = (a+b)^2 \\
      & = a^2 + 2ab + b^2
\end{align}
$$
$$
\begin{align*}
    f & = (a+b)^2 \\
      & = a^2 + 2ab + b^2
\end{align*}
( & 用于标注对齐点)
$$
```

## 分段
$$
\delta_{ij}=
\begin{cases}
    1 & \text{if }i=j \\
    0 & \text{otherwise}
\end{cases}
$$

```latex
\delta_{ij}=
\begin{cases}
    1 & \text{if }i=j \\
    0 & \text{otherwise}
\end{cases}
```