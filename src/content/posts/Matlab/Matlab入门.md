---
title: Matlab入门
published: 2026-08-24
description: ''
image: ''
tags: [Matlab]
category: 'Matlab'
draft: false 
lang: ''
---

>[NOTE]参考https://matlabacademy.mathworks.com/


# Matlab


## 基础语法
```matlab
Create Evenly Spaced Vectors
Instructions are in the task pane to the left. Complete and submit each task one at a time.

Task 1
x = [1 2 3]


Task 2
y = [1:10]


Task 3

z = 1:0.5:5


Task 4

a = 3:2:13

Task 5
b = linspace(1,10,5)

Task 6
b = b'


Task 7

c = (5:2:9)'


Further Practice

linspace(1,2*pi,100)
```

```matlab
Create Arrays with Functions
Instructions are in the task pane to the left. Complete and submit each task one at a time.

Task 1

x = rand(5)

Task 2
y = rand(5,1)


Task 3

z = zeros(6,3)

Further Practice
rand(size(x))

```

```matlab
Index into Arrays
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the activity.
v = linspace(0,1,5)
load datafile
data

Task 1

x = v(2)

Task 2

y = v(end)

Task 3
z = v(end-1)


Task 4

a = data(6,3)

Task 5
b = data(end,3)


Further Practice

data(8)
idx = 8
data(8)
```

```matlab
Extract Multiple Elements
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the activity.
load datafile
data

Task 1

density = data(:,2)

Task 2

volumes = data(:,end-1:end)

Task 3

p = density(2:5)

Further Practice

density([1 3 6])
```

```matlab
Change Values in Arrays
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the interaction.
load datafile
data
v2 = data(:,end)

Task 1

v2(1) = 0.5

Task 2

data(1,end) = 0.5

Further Practice

data(:,1) = data(:,2)
```

```matlab
Perform Array Operations on Vectors
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the interaction.
load datafile
density = data(:,2);
v1 = data(:,3)
v2 = data(:,4)

Task 1
r = v1 + 1


Task 2

vs = v1 + v2

Task 3

va = vs / 2

Task 4

vm = max(va)

Task 5

vr = round(va)

Task 6
mass = density .* va


Further Practice
x = [1 2; 3 4; 5 6; 7 8].*[1;2;3;4]
size(x)
```

```matlab
Request Multiple Outputs in Function Calls
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the activity.
load datafile
data
v1 = data(:,3);
v2 = data(:,4);

Task 1

dsize = size(data)

Task 2
[dr,dc] = size(data)

Task 3
[vMax,ivMax] = max(v2)
```
## 绘图
```matlab
Plot Vectors
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the interaction.
load datafile
sample = data(:,1);
density = data(:,2);
v1 = data(:,3);
v2 = data(:,4);
mass1 = density.*v1;
mass2 = density.*v2;

Task 1

plot(sample,mass1);

Task 2
plot(sample,mass2,"r*");

Task 3
hold on
plot(sample,mass1,"ms")

Task 4

hold off

Task 5

plot(v1)

Task 6

plot(v1,LineWidth=3)

Task 7

plot(sample,v1,"r-o",LineWidth=4)

Further Practice

histogram(density,FaceColor="y")
```
```matlab
Annotate Plots
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code creates data for the interaction.
load datafile
sample = data(:,1);
density = data(:,2);
v1 = data(:,3);
v2 = data(:,4);
mass1 = density.*v1;
mass2 = density.*v2;

This code creates the plot from the last activity.
plot(sample,mass1,"ms")
hold on
plot(sample,mass2,"r*")
hold off
Task 1

title("Sample Mass")
Task 2

ylabel("Mass (g)")
Task 3

legend("Exp A","Exp B")

Further Practice
bar(data(3,:))
title("Sample " + sample(3) + " Data")
```

## 数据导入和逻辑数组
```matlab
Import Data as a Table
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code loads the table that was imported with Import Tool.
load datafile
elements

Task 1

d = elements.Density

Task 2 & 3

elements.Mass = elements.Density .* elements.Volume1
elements = sortrows(elements, "Mass")

```
```matlab
Relational Operators
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the interaction.
load datafile
sample = data(:,1)
v1 = data(:,3)

Task 1

x = pi < 4

Task 2

y = v1 < 4

Task 3
z = sample == 18


Further Practice
sample > 10 & sample <20


```
```matlab
Logical Indexing
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code sets up the interaction.
load datafile
sample = data(:,1);
v1 = data(:,3)
isGreater = v1 > 6

Task 1
x = v1(isGreater)


Task 2
y = v1(v1<4)


Task 3

z = sample(v1 < 4)

Task 4
v1(v1<4) = 0


Further Practice

data(data < 4) = 0
```

## 编程
```matlab
Decision Branching
Instructions are in the task pane to the left. Complete and submit each task one at a time.

Do not edit. This code creates a random number to test the if statement.
doPlot = randi([0 1])
This code loads the data.
load datafile
density = data(:,2);

Task 1 & 2
if doPlot == 1
plot(density)
title("Sample Densities")
xticklabels(element)
ylabel("Density (g/cm^3)")
else
    disp("The density of " + element ...
        + " is " + density)
end


```
```matlab
Write a For Loop
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code loads the data for the interaction.
load datafile
density = data(:,2)

Task 1–2
hold on
for idx = 1:7
    plot(idx,density(idx),"*")
    pause(0.3)
end
hold off
```

## 恒星运动

```matlab
Project - Stellar Motion
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code loads the data and defines measurement parameters.
load starData
nObs = size(spectra,1)
lambdaStart = 630.02
lambdaDelta = 0.14

Task 1
lambdaEnd = lambdaStart + (nObs-1)*lambdaDelta
lambda = (lambdaStart:lambdaDelta:lambdaEnd)

Task 2 & 7
s = spectra(:,2)

Task 3
plot(lambda,s,".-")
xlabel("Wavelength")
ylabel("Intensity")
Task 4
[sHa,idx] = min(s)
lambdaHa = lambda(idx)
Task 5
hold on
plot(lambdaHa,sHa,"rs",MarkerSize=8)
hold off

Task 6
z = lambdaHa/656.28 - 1
speed = z*299792.458
```

## 恒星光谱
```matlab
Project - Compare Stellar Spectra
Instructions are in the task pane to the left. Complete and submit each task one at a time.

This code loads the data from the previous project.
load starData

Task 1
[sHa,idx] = min(spectra);
lambdaHa = lambda(idx);
z = lambdaHa/656.28 - 1;
speed = z*299792.458

Tasks 2–4
for v=1:7
    s = spectra(:,v)
    hold on
    if speed(v)<=0
        plot(lambda,s,"--")
    else
        plot(lambda,s,LineWidth=3)

    end
end
hold off

Task 5
legend(starnames)

Task 6
movaway = starnames(speed>0)
```
