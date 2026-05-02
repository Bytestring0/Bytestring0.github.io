---
title: "那些有趣的Github开源项目"
published: 2025-11-13
description: "一些有趣的Github开源项目，更新中~"
tags: [fun]
category: "有趣的东西"
author: "Bytestring"
draft: false
---

> [!NOTE]
> 收录一些个人觉得有意思的开源项目

# StupiD IDEA

~~经常编程的人都知道~~我们在敲代码的时候非常容易手滑，或者卡切换输入法，导致以下代码发生
```c
井include<stdio。h》
int mian()
{
    print(“Hello World！”)
    retrun 0;
}
```
当我们把代码交给不那么现代的编译器后，编译器就会看不懂，然后拒绝编译并报错，非常地不人性。

现在这个项目解决了这一苦恼，不论是`井include<stdio。h》`,还是`cout ??= fmt.Println<echo~("HELLO")>::await!; return WORLD;`这个IDE都能编译并运行。
::github{repo="ZeroAd-06/StudiD-IDEA"}
!!但是作者好像仓库名打错了（!!

# 您配吗

这个项目可以一键删光其他项目的依赖，~~然后就可以再配一遍啦。~~


::github{repo="RimoChan/match-you"}

!!何意味!!

# SakanaWidget 

请输入文本
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/sakana-widget@2.7.1/lib/sakana.min.css"
/>
<div id="sakana-widget"></div>
<script>
  function initSakanaWidget() {
    new SakanaWidget().mount('#sakana-widget');
  }
</script>
<script
  async
  onload="initSakanaWidget()"
  src="https://cdn.jsdelivr.net/npm/sakana-widget@2.7.1/lib/sakana.min.js"
></script>

::github{repo="dsrkafuu/sakana-widget"}
!!标题不能写Sakana!Widget，不然会被吞掉，吓哭了 !!


# 更新中