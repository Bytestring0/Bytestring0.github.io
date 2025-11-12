---
title: STM32学习之GPIO（一）
published: 2025-11-11
description: 介绍单片机的GPIO.
tags: [STM32]
category: STM32
licenseName: "Unlicensed"
author: bytestring
draft: false
image: 'https://t.alcy.cc/moez'
---

# 什么是GPIO

GPIO（General Purpose Input Output）是通用输入输出口。字面意思就是说芯片的这个引脚可以用于输入和输出。GPIO是单片机编程的核心之一，我们正是通过GPIO使得芯片可以和外界互动。比如有一个正极连接电源，负极连接单片机PA1的LED，我们可以通过编程让PA1输出低电平来点亮这个LED。

# STM32的GPIO

STM32的外设在使用时需要进行初始化，GPIO初始化有三个要素，分别是引脚（Pin），模式（Mode）和速度（Speed）。  
其中Speed不用特别在意，因为在初学时基本遇不到对引脚速度敏感的场合。  
STM32的GPIO被分成了ABC...等组，每组中有特定的引脚数字，这就是引脚。  
打开`stm32f10x_gpio.h`文件中的`GPIO_InitTypeDef`，如下所示。  
```c
/** 
  * @brief  GPIO Init structure definition  
  */
typedef struct
{
  uint16_t GPIO_Pin;             /*!< Specifies the GPIO pins to be configured.
                                      This parameter can be any value of @ref GPIO_pins_define */

  GPIOSpeed_TypeDef GPIO_Speed;  /*!< Specifies the speed for the selected pins.
                                      This parameter can be a value of @ref GPIOSpeed_TypeDef */

  GPIOMode_TypeDef GPIO_Mode;    /*!< Specifies the operating mode for the selected pins.
                                      This parameter can be a value of @ref GPIOMode_TypeDef */
}GPIO_InitTypeDef;
```
这个结构体就是STM32的初始化结构体，再打开同一文件下的`GPIOMode_TypeDef`，如下所示
```c
/** 
  * @brief  Configuration Mode enumeration  
  */

typedef enum
{ GPIO_Mode_AIN = 0x0, //模拟输入，配合ADC使用
  GPIO_Mode_IN_FLOATING = 0x04, //悬空输入，不接上下拉电阻，可避免多GPIO并联信号问题
  GPIO_Mode_IPD = 0x28, //下拉输入，接入下拉电阻，默认为低电平
  GPIO_Mode_IPU = 0x48, //上拉输入，接入上拉电阻，默认为高电平
  GPIO_Mode_Out_OD = 0x14, //开漏输出，写入1时输出高阻态，可以实现数电中的“线与”功能
  GPIO_Mode_Out_PP = 0x10, //推挽输出，具有输出和输入电流的能力
  GPIO_Mode_AF_OD = 0x1C, //复用开漏，结合复用功能使用
  GPIO_Mode_AF_PP = 0x18 //复用推挽，结合复用功能使用
}GPIOMode_TypeDef;
```
这是GPIO模式的枚举量，后面的地址涉及寄存器相关知识，想了解的话可以看[GPIO介绍](https://www.cnblogs.com/hazy1k/p/18365645)。

# STM32的时钟

在了解了GPIO初始化结构体并对GPIO进行初始化后，我们还是控制不了这个GPIO的，这是因为这个GPIO还处于休眠状态。在初始化之前，我们需要叫醒GPIO，也就是开启时钟。  
下面是一张STM32的时钟树，虽然看起来很复杂，但实际上确实很复杂，不过我们只需要看我们需要用到的部分就好了。  
![05-RCC-clock-tree.png](https://youke1.picui.cn/s1/2025/11/11/69132c90890ec.png)
观察最小系统板的接线图可以发现系统的`OSC_OUT`和`OSC_IN`被接在了一个8MHz的晶振上，也就是说这个`HSE OSC`的频率是8Hz，然后经过一系列倍频操作变成了`SYSCLK`，可以发现这就是系统的核心频率。不过好在这个频率已经在启动文件中被默认设置为了72MHz，这使得我们不用非常在意这个时钟是哪来的（具体可以看`system_stm32f10x.c`文件中的`SetSysClock()`）。只有在时钟的脉冲下单片机才可以运行指令，时钟决定了STM32执行指令的速度。  
现在知道了有时钟这么一回事，但是打开谁的时钟呢。我们查看时钟树，发现并没有GPIO。这是因为GPIO被挂在了APB2这条总线上。文件`stm32f10x_rcc.c`定义了相关时钟设置的函数，其中有一条函数  
```c

/**
  * @brief  Enables or disables the High Speed APB (APB2) peripheral clock.
  * @param  RCC_APB2Periph: specifies the APB2 peripheral to gates its clock.
  *   This parameter can be any combination of the following values:
  *     @arg RCC_APB2Periph_AFIO, RCC_APB2Periph_GPIOA, RCC_APB2Periph_GPIOB,
  *          RCC_APB2Periph_GPIOC, RCC_APB2Periph_GPIOD, RCC_APB2Periph_GPIOE,
  *          RCC_APB2Periph_GPIOF, RCC_APB2Periph_GPIOG, RCC_APB2Periph_ADC1,
  *          RCC_APB2Periph_ADC2, RCC_APB2Periph_TIM1, RCC_APB2Periph_SPI1,
  *          RCC_APB2Periph_TIM8, RCC_APB2Periph_USART1, RCC_APB2Periph_ADC3,
  *          RCC_APB2Periph_TIM15, RCC_APB2Periph_TIM16, RCC_APB2Periph_TIM17,
  *          RCC_APB2Periph_TIM9, RCC_APB2Periph_TIM10, RCC_APB2Periph_TIM11     
  * @param  NewState: new state of the specified peripheral clock.
  *   This parameter can be: ENABLE or DISABLE.
  * @retval None
  */
void RCC_APB2PeriphClockCmd(uint32_t RCC_APB2Periph, FunctionalState NewState)
{
  /* Check the parameters */
  assert_param(IS_RCC_APB2_PERIPH(RCC_APB2Periph));
  assert_param(IS_FUNCTIONAL_STATE(NewState));
  if (NewState != DISABLE)
  {
    RCC->APB2ENR |= RCC_APB2Periph;
  }
  else
  {
    RCC->APB2ENR &= ~RCC_APB2Periph;
  }
}
```
在函数的参数部分，我们可以看见`RCC_APB2Periph`这个参数的可选值有所有的GPIO和一些ADC、定时器啥的。当我们需要使用对应功能时，我们就需要使用这个函数，第一个参数填需要的外设，第二个参数填`ENABLE`。

# 点亮一盏LED灯

在学习完上面的理论后，我们就可以开始我们的第一个`Hello World`程序——点亮一盏LED灯（假设我们使用PA1）。  
首先，我们需要开启时钟`RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);`  
然后对我们需要控制的引脚进行初始化  
```c
GPIO_InitTypeDef gpioDef;    
gpioDef.GPIO_Mode = GPIO_Mode_Out_PP;
gpioDef.GPIO_Pin = GPIO_Pin_1;
gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
GPIO_Init(GPIOA, &gpioDef);
```
然后就可以写入这个GPIO了`GPIO_WriteBit(GPIOA, GPIO_Pin_1, (BitAction)0);`  
我们一般把主程序写进一个`While`循环中，`main`函数如下
```c
int main()
{
    GPIO_InitTypeDef gpioDef;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_Out_PP;
    gpioDef.GPIO_Pin = GPIO_Pin_1;
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(GPIOA, &gpioDef);

    while (1)
    {
        GPIO_WriteBit(GPIOA, GPIO_Pin_1, Bit_RESET);
    }
}
```
将LED的正极连上电源，串联一个电阻，再将负极连接PA1，烧录程序，就可以看到LED点亮了。

## 软件延时

我们只需要简单修改就可以让点亮变为闪烁。
```c
    uint8_t LEDflag = 0;
    GPIO_InitTypeDef gpioDef;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_Out_PP;
    gpioDef.GPIO_Pin = GPIO_Pin_1;
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(GPIOA, &gpioDef);
    while (1)
    {
        if (LEDflag)
        {
            GPIO_WriteBit(GPIOA, GPIO_Pin_1, Bit_SET);
            LEDflag = 0;
        }
        else{
            GPIO_WriteBit(GPIOA, GPIO_Pin_1, Bit_RESET);
            LEDflag = 1;
        }
        
    }
```
但是这样会有一个问题，IO口的电平翻转速度太快了导致观察不到，所以我们要想办法进行延时，最朴素的想法是让单片机进行一些无意义的占位运算，“浪费”掉这些时间。
```c
void delay(int x)
    {
        for (int i = 0; i < x; i++)
        {
            for (int j = 0; j < 1000; j++)
                __NOP();
        }
    }
```
然后
```c
    uint8_t LEDflag = 0;
    GPIO_InitTypeDef gpioDef;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_Out_PP;
    gpioDef.GPIO_Pin = GPIO_Pin_1;
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(GPIOA, &gpioDef);
    while (1)
    {
        if (LEDflag)
        {
            GPIO_WriteBit(GPIOA, GPIO_Pin_1, Bit_SET);
            LEDflag = 0;
        }
        else{
            GPIO_WriteBit(GPIOA, GPIO_Pin_1, Bit_RESET);
            LEDflag = 1;
        }
        delay(5000);
}

```
这样实现的延时不仅不精确，而且会阻塞程序，之后我们会使用定时器来改进它。

# 按键输入与消抖

通过将Mode改为输入就可以实现检测输入信号，程序比较简单，就不讲解了
```c
    GPIO_InitTypeDef gpioDef;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_Out_PP;
    gpioDef.GPIO_Pin = GPIO_Pin_1;
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(GPIOA, &gpioDef);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_IPU;
    gpioDef.GPIO_Pin = GPIO_Pin_1;
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(GPIOB, &gpioDef);
    while(1)
    {
        if(GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_1) == Bit_RESET)
        {
            GPIO_ResetBits(GPIOA, GPIO_Pin_1);
        }
        else
        {
            GPIO_SetBits(GPIOA, GPIO_Pin_1);
        }
    }
```
对于机械按键，我们需要进行消抖，原理是当按下按键时，电平会在一个小的时间内抖动，所以我们需要滤过这段时间，直到松手为止，代码如下
```c
    if (GPIO_ReadInputDataBit(Key_Port, pin) == 0)
    {
        delay(5); // 简单去抖
        if (GPIO_ReadInputDataBit(Key_Port, pin) == 0)
        {
            while (GPIO_ReadInputDataBit(Key_Port, pin) == 0)
                ;
            // logic
        }
    }
```
## 流水灯

既然有了按键，又有了LED，当然要写一个流水灯了。  
当按下`Key1`时关启流水灯，按下`Key2`时反转流水灯方向。
```c
uint8_t key_pressed(uint16_t pin)//按键处理函数
{
    if (GPIO_ReadInputDataBit(Key_Port, pin) == 0)
    {
        delay(5); // 简单去抖
        if (GPIO_ReadInputDataBit(Key_Port, pin) == 0)
        {
            while (GPIO_ReadInputDataBit(Key_Port, pin) == 0)
                ;
            return 1;
        }
    }
    return 0;
}
```
```c
int main() //主程序
{
    uint8_t FlowingLEDflag = 0;
    uint8_t dir = 1;
    GPIO_InitTypeDef gpioDef;
    RCC_APB2PeriphClockCmd(LED_RCC, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_Out_PP;
    for(int i=0; i<3; i++)
    {
        gpioDef.GPIO_Pin |= ledPins[i];
    }
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(LED_Port, &gpioDef);
    RCC_APB2PeriphClockCmd(Key_RCC, ENABLE);
    gpioDef.GPIO_Mode = GPIO_Mode_IPU;
    gpioDef.GPIO_Pin = Key1 | Key2;
    gpioDef.GPIO_Speed = GPIO_Speed_10MHz;
    GPIO_Init(Key_Port, &gpioDef);
    GPIO_SetBits(LED_Port, GPIO_Pin_1 | GPIO_Pin_2 | GPIO_Pin_3);
    while(1)
    {
        if(key_pressed(Key1))
        {
            FlowingLEDflag = 1 - FlowingLEDflag;
        }
        if(key_pressed(Key2))
        {
            dir = -dir;
        }
        if(FlowingLEDflag == 1)
        {
            static int8_t currentLED = 0;
            GPIO_ResetBits(LED_Port, ledPins[currentLED]);
            delay(5000);
            GPIO_SetBits(LED_Port, ledPins[currentLED]);
            currentLED += dir;
            if(currentLED > 2) currentLED = 0;
            if(currentLED < 0) currentLED = 2;
        }
    }
}
```