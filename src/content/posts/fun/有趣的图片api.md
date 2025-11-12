---
title: 有趣的图片api
published: 2024-08-31
description: 一些有意思的图片API.
tags: [fun]
category: 有趣的东西
licenseName: "Unlicensed"
author: bytestring
draft: false
image: 'https://www.loliapi.com/acg/pc/'
---
# 这里有一些有趣的图片api


## 随机猫猫动图（点击可切换）
<div id="maomao1" style="
  background-size:contain;
  background-repeat:no-repeat;
  background-position:center;
  cursor:pointer;">
</div>

<script>
function refreshPicture(urll,id) {
    const url = `${urll}/?${Date.now()}`; // 避免缓存
  const img = new Image();
  img.src = url;
  const box = document.getElementById(id);
  img.onload = ()=>{
    // 根据图片尺寸设置 div 尺寸
    box.style.width = img.width + 'px';
    box.style.height = img.height + 'px';
    box.style.backgroundImage = `url('${url}')`;
}
}
function initPicture(url,id)
{  
  document.getElementById(id).addEventListener('click', e=>{
  e.stopPropagation();
  e.preventDefault();
  refreshPicture(url,id);
});  
  refreshPicture(url,id);
}

initPicture("http://edgecats.net",'maomao1');
</script>




## 加载图片

<div id="loadimg" style="
  background-size:contain;
  background-repeat:no-repeat;
  background-position:center;
  cursor:pointer;">
</div>

<script>

// 初始化
initPicture("https://imgapi.cn/loading.php",'loadimg');
</script>




## 猫猫表情包


<!-- 输入框 -->
<input id="catInput" 
  placeholder="输入猫猫要说的话~"
  style="
    display:block;
    margin:10px auto;
    padding:8px 14px;
    border-radius:10px;
    border:1px solid #ccc;
    font-size:15px;
    outline:none;
    text-align:center;
    transition:.2s;
    background-color:rgba(0,0,0,0);
  "
  onfocus="this.style.borderColor='#ffb6c1'"
  onblur="this.style.borderColor='#ccc'"
/>

<!-- 猫猫显示区 -->
<div id="maomao2" style="
  width:300px;
  height:300px;
  margin:10px auto;
  background-size:contain;
  background-repeat:no-repeat;
  background-position:center;
  cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,0.2);
">
</div>

<script>
function initPicture2(baseUrl, elementId) {
  const el = document.getElementById(elementId);
  const input = document.getElementById("catInput");

  // 默认猫猫
  el.style.backgroundImage = `url(${baseUrl})`;

  // 点击时根据输入内容刷新猫图
  el.addEventListener("click", () => {
    const text = encodeURIComponent(input.value.trim() || "喵喵~");
    const url = `${baseUrl}says/${text}?${Date.now()}`; // 加时间戳避免缓存
    el.style.backgroundImage = `url(${url})`;
  });
}

// 初始化
initPicture2("https://cataas.com/cat/", "maomao2");
</script>




