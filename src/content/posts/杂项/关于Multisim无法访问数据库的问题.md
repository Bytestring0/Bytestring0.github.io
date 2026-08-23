---
title: 关于Multisim无法访问数据库的问题
published: 2026-08-23
description: ''
image: ''
tags: []
category: '杂项'
draft: false 
lang: ''
---

> [NOTE] 打开一年多没用的Multisim遇到了Multisim无法访问数据库的问题，重装了新版本还是没有解决，Codex找了半天没定位到问题，最后在CSDN上找到了解决方案。

# 问题描述

打开Multisim弹出报错，无法使用其中的任何元件。

管理员启动无效。

![alt text](multisim_err.png)

# 解决方案

进入`C:\ProgramData\National Instruments\Circuit Design Suite\xx.x`，找到目录下的`database`文件夹，右键选择`属性`，取消勾选`只读`，点击`应用`，然后重新启动Multisim。

不过再次打开database的属性会发现又变成了只读，下次再打开Multisim也要重复上述的步骤，不知道为什么，感觉很神奇，不过总算能用了。