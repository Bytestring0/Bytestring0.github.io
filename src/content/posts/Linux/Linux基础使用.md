---
title: "Linux基础使用"
published: 2026-10-12
publish: false
draft: false
description: '以本机 WSL 与 Ubuntu 24.04 为起点，讲解终端、文件、权限、软件包、进程、网络和开发环境，附 Zsh、Neovim 等常用软件教程、综合练习与故障排查。'
image: ''
tags: [Linux, WSL, Ubuntu, Bash, 命令行]
category: "Linux"
create: false
lang: ''
---

本文以自己的 WSL 环境为起点，从进入终端、读懂命令开始，逐步走到安装软件、管理进程、配置开发环境和编写脚本。命令示例以 Ubuntu 24.04、GNU 工具和 Bash 为准；在其他发行版中，文件与进程的基本概念相通，包管理命令和部分默认配置需要替换。

第一次阅读，可以先完成第 3～7 节的文件操作，再读第 11～12 节的权限与软件安装，最后做第 25 节的综合练习。遇到管道、引号、变量时回查第 8～10 节，常用软件安装与配置见第 28 节。其余章节用于把日常工作连起来，不要求第一次就记住全部参数。

文中的 `bash` 代码块在 Ubuntu 终端执行，`powershell` 代码块在 Windows PowerShell 执行，标记为 `zsh` 的配置与命令使用 Zsh。代码块没有附带 `$`、`#` 等提示符，可以逐行输入。含 `user`、`server.example.com`、`package.deb` 等占位名称的命令，需要换成实际值。下文的安装、修改配置与练习命令供学习时操作；本次实际执行的系统变更只有第 3 节记录的 WSL 应用更新，常用软件教程中的工具尚未因此安装。

## 1. 本机 WSL 环境记录

大部分基础信息来自 2026-10-12 对本机的读取；WSL 应用与内核两项已按 2026-10-13 更新后的复核结果改写。软件版本、剩余空间和运行状态会随使用变化，应结合各项记录时间阅读。

| 项目            | 实际结果                                                       | 使用时的含义                         |
| ------------- | ---------------------------------------------------------- | ------------------------------ |
| WSL 注册名称      | `Ubuntu-24.04`，也是默认发行版                                     | Windows 中用这个名称指定发行版            |
| WSL 运行架构      | WSL 2                                                      | 通过轻量虚拟机运行 Linux 内核             |
| WSL 应用版本      | `3.0.1.0`，2026-10-13 已更新                                 | 与表中的 WSL 2 架构编号是两项信息           |
| Linux 发行版     | Ubuntu `24.04.4 LTS`，代号 `noble`                            | 软件仓库与系统配置按 Ubuntu 24.04 处理     |
| Linux 内核      | `6.18.40.1-microsoft-standard-WSL2`，2026-10-13 已复核        | 内核由 WSL 提供，发行版用户空间来自 Ubuntu    |
| 架构            | `x86_64`，APT 中对应 `amd64`                                   | 下载二进制或 `.deb` 时匹配这一架构          |
| 默认 Linux 用户   | `bts`，UID/GID 均为 `1000`                                    | 普通开发与文件操作使用这个账户                |
| 家目录           | `/home/bts`                                                | 可用 `~` 表示                      |
| 登录 Shell      | `/bin/bash`，Bash `5.2.21`                                  | 本文的 Shell 语法以 Bash 为准          |
| 系统包管理         | APT `2.8.3`、dpkg `1.22.6` 系列                               | 日常安装使用 `apt`，底层包数据库由 dpkg 管理   |
| APT 镜像        | `https://mirrors.tuna.tsinghua.edu.cn/ubuntu/`             | 当前已配置清华镜像                      |
| APT 发行分支      | `noble`、`noble-updates`、`noble-backports`、`noble-security` | 基础包、更新、回移植和安全更新的来源             |
| 服务管理          | PID 1 为 `systemd`，版本 `255`                                 | 可使用 `systemctl` 和 `journalctl` |
| 逻辑 CPU        | WSL 内可见 `22` 个                                             | 编译并行度参考这个数量与可用内存               |
| 内存与交换空间       | 约 `19 GiB` 内存，`5 GiB` Swap                                 | 这是 WSL 内观察到的容量                 |
| Linux 根文件系统   | `/` 为 `ext4`                                               | 适合 Linux 工程、虚拟环境与编译产物          |
| 根文件系统容量       | `df` 显示约 `1007G`，已用 `39G`，可用 `918G`                        | 虚拟文件系统容量，不等于宿主磁盘已经占用这么多空间      |
| Windows D 盘映射 | `/mnt/d`，挂载类型显示 `9p`                                       | Windows 文件通过 WSL 的跨系统挂载访问      |
| 字符编码环境        | `LANG=C.UTF-8`                                             | 使用 UTF-8，可处理中文文本               |

这里的内存容量和逻辑 CPU 数量是 WSL 的视角。`df -h /` 显示的是 Linux 文件系统可用空间；WSL 虚拟磁盘通常按需增长，实际能增长到多少还受 Windows 宿主盘剩余空间限制。表中 `G` 来自 `df -h` 的显示，使用的是 1024 进制量级。

### 已经具备的常用工具

| 工具或组件 | 当前结果 |
| --- | --- |
| Git | 已安装，`2.43.0` |
| GCC / G++ / Make | 已安装，GCC `13.3.0`；`build-essential` 已安装 |
| Python | `/usr/bin/python3`，版本 `3.12.3` |
| pip | 已安装，`24.0`，属于系统 Python 环境 |
| Python venv 支持包 | `python3-venv` 与 `python3.12-venv` 未安装 |
| 文本编辑 | Vim、Nano 已安装 |
| 下载、远程与同步 | curl、wget、SSH 客户端、rsync 已安装 |
| 终端会话 | tmux 已安装，软件包版本 `3.4` |
| Snap | `snapd` 已安装；Snap 列表有 `core24`、`snapd` 和 `tldr` |
| 当前 PATH 未找到 | Linux 的 `node`、`cmake`、`docker`、`rg`、`uv`、`unzip` 等命令 |

“当前 PATH 未找到”表示在这次普通 Shell 与交互式 Bash 的检查中找不到该命令。它不排除某个工具被放在自定义目录、容器或尚未激活的环境中。Snap 中安装的 `tldr` 也没有被当前 PATH 直接找到，学习时可以先用 `snap run tldr ls` 调用，再检查 `/snap/bin` 是否在 PATH 中。

### Windows 与 Linux 的 Node 工具混用

当前 `npm` 的位置是：

```text
/mnt/c/Program Files/nodejs/npm
```

`pnpm` 也从 Windows 用户的 `AppData` 路径找到，而 Linux 的 `node` 命令没有找到。WSL 默认可以把 Windows 的路径加入 Linux 的 PATH，因此在 WSL 中输入一个命令，有可能调用的是 Windows 安装的脚本或程序。

这意味着目前找到 `npm` 并不能证明 Linux 原生 Node.js 环境已经配好。做 Linux 项目时，应把 Node.js、包管理器、`node_modules` 和执行环境统一在 Linux 侧；做 Windows 项目时则统一在 Windows 侧。第 20 节会给出检查与配置方法。

### 已启用的 WSL 设置

发行版内部的 `/etc/wsl.conf` 包含：

```ini
[boot]
systemd=true

[user]
default=bts
```

Windows 用户目录下的 `.wslconfig` 包含：

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
autoProxy=true
```

这些字段配置了镜像网络、DNS 隧道与 Windows HTTP 代理信息的自动使用。`.wslconfig` 管理 WSL 2 全局设置，`/etc/wsl.conf` 管理单个发行版的设置；具体生效条件取决于 Windows 与 WSL 的支持情况以及配置是否已在重启后加载。[^wsl-config]

### 当前服务状态

这次 `systemctl is-system-running` 输出 `degraded`，`systemctl --failed` 列出的失败单元是：

```text
nvidia-persistenced.service
```

`degraded` 表示 systemd 有失败单元，不能仅凭这个状态判断整个系统无法使用。这里记录了服务名，没有继续检查驱动、CUDA 或 GPU 工作情况，也没有判断失败原因。需要使用 NVIDIA 相关功能时，可以从第 15 节的日志命令继续排查。

## 2. Linux、发行版、终端与 Shell

Linux 内核负责调度 CPU、管理内存、处理设备和文件系统，并为进程提供系统调用。日常使用的 Ubuntu 还包含命令行工具、软件仓库、服务管理器和配置文件。这些组件组合起来构成一个 Linux 发行版。Ubuntu、Debian、Fedora、Arch Linux 都是发行版，它们的工具选择、发布周期和软件包体系有所不同。

终端是输入与显示的界面，例如 Windows Terminal 中的 Ubuntu 标签页。Shell 是接收命令、解析语法并启动程序的进程，本机使用 Bash。打开两个终端标签页，通常就有两个独立的 Shell；一个标签页中执行的 `cd` 或临时变量设置不会自动改变另一个标签页。

一条命令的执行过程可以理解为：Bash 读取输入，解释变量、引号和通配符，处理重定向，寻找需要执行的命令，最后启动程序并取得退出状态。`cd`、`export`、`alias` 等是 Shell 内建命令，`git`、`python3` 等通常是外部程序。内建命令可以直接改变当前 Shell 的状态，例如改变工作目录。

WSL 2 让 Windows 与 Linux 可以同时使用。本机的 Ubuntu 用户空间运行在 WSL 提供的 Linux 内核上，Windows 盘可以挂载进 Linux，部分 Windows 程序也能从 Linux 命令行启动。普通文件、权限、管道与进程知识可以迁移到原生 Linux；设备、开机流程、网络和后台存活方式需要考虑 WSL 的特点。

## 3. 从 Windows 进入与管理 WSL

### WSL 3.x 应用版本与 WSL 2 架构

2026-10-13 查询微软官方发布记录时，最新稳定版是 **WSL 应用 3.0.1**，发布记录标记为非预览版。这个数字属于 Windows 上的 WSL 软件包版本；发行版使用的运行架构仍需要通过 `wsl --list --verbose` 的 `VERSION` 列查看。官方架构说明区分 WSL 1 与 WSL 2，因此升级应用到 3.x 后，Ubuntu 的这一列仍可以是 `2`。[^wsl-release]

把几类版本分别查询，可以避免把不同层次的编号混在一起：

| 要确认的层次 | 查询位置与命令 | 本机更新前的例子 |
| --- | --- | --- |
| WSL 软件包 | Windows：`wsl --version` | `2.7.3.0` |
| 发行版运行架构 | Windows：`wsl --list --verbose` | `VERSION` 为 `2` |
| Ubuntu 用户空间 | Ubuntu：`cat /etc/os-release` | `24.04.4 LTS` |
| 正在运行的 Linux 内核 | Ubuntu：`uname -r` | `6.6.114.1-microsoft-standard-WSL2` |
| Bash 程序 | Ubuntu：`bash --version` | `5.2.21` |

`wsl --update` 更新 WSL 软件包，`sudo apt upgrade` 更新 Ubuntu 仓库管理的软件。这两个操作各有自己的版本和来源，不必因为某一层更新就把其余层改成相同编号。3.0.1 的发布说明还包括 WSL containers 正式可用，这属于功能变化，也不等于把已有 Ubuntu 发行版转换成一个名为“WSL 3”的运行架构。

### 日常进入与更新命令

2026-10-13 已将本机 WSL 应用从 `2.7.3.0` 更新到 `3.0.1.0`。微软官方安装包的 SHA-256 与发布值一致，Microsoft Corporation 数字签名有效，安装程序返回成功；更新后进入 Ubuntu，实际运行内核为 `6.18.40.1-microsoft-standard-WSL2`。Ubuntu 仍为 `24.04.4 LTS`，发行版运行架构仍为 WSL 2，Bash 与 APT 仍分别为 `5.2.21`、`2.8.3`。

这次普通更新和 GitHub 更新通道最初都遇到连接错误。按要求尝试本机 `127.0.0.1:7897` 代理后，下载仍在 TLS 握手阶段失败；最终使用直连取得官方安装包完成更新。没有修改全局代理配置，更新所用安装包与临时日志已清理。

以下命令在 PowerShell 中执行：

```powershell
# 查看安装了哪些发行版、运行状态和 WSL 1/2 架构
wsl --list --verbose

# 查看默认发行版与组件版本
wsl --status
wsl --version

# 进入本机的 Ubuntu，并从 Linux 家目录开始
wsl -d Ubuntu-24.04 --cd ~

# 不进入交互终端，直接执行 Linux 命令
wsl -d Ubuntu-24.04 -- uname -r
wsl -d Ubuntu-24.04 -- cat /etc/os-release
```

`wsl --list --verbose` 中的 `*` 标记默认发行版，`VERSION` 列的 `2` 表示 WSL 2 架构。更新后 `wsl --version` 中的 `3.0.1.0` 是 WSL 应用版本。`/etc/os-release` 给出 Ubuntu 的发行版版本，`uname -r` 给出内核版本，这几项可以分别更新。

在 Ubuntu 中输入 `exit` 会退出当前 Shell。关闭标签页也通常会结束这一会话，但其他终端或进程可能仍在运行。要停止指定发行版或整个 WSL，可在保存任务后使用：

```powershell
# 停止指定发行版，其中的运行进程会被结束
wsl --terminate Ubuntu-24.04

# 停止所有 WSL 发行版与 WSL 2 虚拟机
wsl --shutdown

# 需要升级 WSL 本身时使用
wsl --update
```

更新 Ubuntu 软件使用的是 `apt`；更新 WSL 本身使用的是 `wsl --update`。修改 `.wslconfig` 后，需要让 WSL 完全停止并重新启动才能加载配置。停止 WSL 也会结束 tmux、服务和后台任务，操作前应保存工作。[^wsl-commands]

从 PowerShell 给 Linux 传复杂命令时，会涉及两套 Shell 的语法。初学阶段，把 Linux 的管道、变量与脚本直接放在 Ubuntu 终端执行，更容易判断由哪一层解释。

## 4. 读懂命令与使用终端

### 命令、选项与参数

以列出家目录文件为例：

```bash
ls -lah /home/bts
```

`ls` 是命令名，`-lah` 是组合短选项，`/home/bts` 是目标路径。`-l` 使用长格式，`-a` 包含隐藏文件，`-h` 用便于阅读的单位显示大小。很多命令支持 `--help` 这样的长选项，但具体选项应查该命令的帮助；同一个字母在不同命令里可能有不同含义。

参数通常用空格分隔，路径包含空格时使用引号：

```bash
ls -ld "/mnt/c/Program Files"
```

`--` 常用于结束选项解析。例如文件名叫 `-report.txt` 时，`rm -i -- -report.txt` 会把它当作文件名。这里的 `--` 是 `rm` 的选项分隔符；前面 `wsl ... -- command` 的 `--` 则属于 WSL 的命令分隔语法。

### 提示符与键盘操作

终端可能显示：

```text
bts@computer:~/projects$
```

它通常表示“用户、主机、当前目录”。普通用户的提示符经常以 `$` 结束，root 经常以 `#` 结束，但提示符可以自定义。真正判断身份时使用 `id` 或 `whoami`。

| 操作 | 用途 |
| --- | --- |
| `Tab` | 补全命令或路径；有多个候选时可再次按下查看 |
| 上、下方向键 | 查找之前输入的命令 |
| `Ctrl + R` | 反向搜索历史；输入关键字，确认后执行 |
| `Ctrl + C` | 通常向前台任务发送中断信号；在输入状态下取消当前行 |
| `Ctrl + D` | 在空输入行时通知输入结束；Shell 常因此退出 |
| `Ctrl + L` | 清理当前终端显示 |
| `Ctrl + A` / `Ctrl + E` | 在默认 Bash 编辑模式下跳到行首、行尾 |
| `Ctrl + U` / `Ctrl + K` | 删除光标前、后的输入内容 |
| `Ctrl + Z` | 暂停前台任务，之后可用 `fg` 恢复 |

Windows Terminal 默认常用 `Ctrl + Shift + C/V` 复制、粘贴，具体以终端设置为准。把多行命令粘贴进终端时，换行可能使它们立即执行，先读清楚每一行的作用。

### 获取帮助

```bash
ls --help
man ls
man bash
help cd
type -a python3
command -v python3
```

`man` 打开手册，通常用方向键或空格翻页，用 `/关键字` 搜索，用 `n` 跳到下一处，用 `q` 退出。手册分章节，例如 `man 1 printf` 查命令，`man 3 printf` 查 C 库函数；同名条目可能属于不同章节。

`help` 查询 Bash 内建命令。`type -a` 列出 Shell 能识别的同名命令，包括别名、函数和多个路径；`command -v` 适合确认当前会选到哪一个命令。本机已有 Snap 版 `tldr`，它提供简短示例，详细行为仍应以手册为准。

## 5. 目录与路径

### 根目录、家目录与工作目录

Linux 的目录从 `/` 开始。Windows 的 `C:`、`D:` 在 WSL 中通常分别出现在 `/mnt/c`、`/mnt/d`。本项目在 Windows 中是 `D:\AstroBlog\mizuki`，在 WSL 中对应：

```text
/mnt/d/AstroBlog/mizuki
```

常见路径的含义如下：

| 路径 | 含义 |
| --- | --- |
| `/` | 根目录 |
| `/home/bts`、`~` | 当前普通用户的家目录 |
| `/root` | root 用户的家目录 |
| `/etc` | 系统配置 |
| `/usr/bin`、`/usr/sbin` | 系统安装的命令与管理工具 |
| `/usr/lib` | 库文件与相关组件 |
| `/usr/local` | 常用于本机手工安装的软件 |
| `/var/log` | 日志 |
| `/var/lib` | 服务、包管理器等的持久状态 |
| `/tmp` | 临时文件；内容可能被系统清理 |
| `/dev` | 设备节点 |
| `/proc`、`/sys` | 内核与进程信息的虚拟接口 |
| `/mnt`、`/media` | 常见的挂载位置 |

根目录 `/`、root 账户和 `/root` 是三个不同概念。`/proc` 中许多内容由内核动态生成，例如读取 `/proc/cpuinfo` 查看 CPU 信息，不能把这些文件都当作普通磁盘文档。

```bash
pwd                 # 当前工作目录
cd ~                # 返回家目录
cd /mnt/d/AstroBlog/mizuki
cd ..               # 上一级目录
cd -                # 返回上一次的工作目录
ls -la              # 查看当前目录，包括隐藏文件
```

绝对路径从 `/` 开始；相对路径从当前目录计算。`.` 表示当前目录，`..` 表示上一级。Linux 原生文件系统通常区分大小写，`Readme.md` 与 `README.md` 可以是两个文件。Windows 挂载目录的行为受宿主文件系统与目录设置影响。

### 文件与扩展名

文件名以 `.` 开头时，通常被命令行工具默认隐藏，例如 `.bashrc`、`.gitignore`。隐藏是一种显示约定，不是访问控制。

Linux 程序是否可执行，取决于内容、执行权限和运行方式，不单由扩展名决定。`file program` 能识别文件类型；`stat program` 查看元数据。一个没有 `.exe` 后缀的文件也可以是编译好的程序。

### WSL 中文件放置的位置

在 Linux 中编译、创建 Python 虚拟环境或安装大量项目依赖时，优先把工程放在 Linux 家目录，例如 `~/projects`。跨 Windows 挂载访问大量小文件时，性能、权限与文件监听行为可能有所不同；微软也建议让文件尽量与执行工具位于同一侧。[^wsl-files]

这不要求把现有博客直接迁走。当前博客在 D 盘，也用于 Windows 编辑时，可以继续在 Windows 工具环境维护。另建 Linux 学习工程时，使用 `~/linux-lab` 或 `~/projects` 即可。

在 Ubuntu 中打开当前目录的 Windows 文件资源管理器：

```bash
explorer.exe .
wslpath -w /home/bts
wslpath -u 'D:\AstroBlog\mizuki'
```

Windows 文件资源管理器也可以访问 `\\wsl.localhost\Ubuntu-24.04\home\bts`。通过这一共享入口访问 Linux 文件；系统虚拟磁盘内部的文件与目录应交给 WSL 管理。

## 6. 创建、复制、移动与删除文件

### 建立练习目录

后面的文件示例尽量放在独立的家目录练习空间。第一次操作前，确认 `~/linux-lab` 没有已有的重要内容；如果已经用过，可以换一个新的名字。以下先建立本节要用的目录：

```bash
mkdir -p ~/linux-lab/files ~/linux-lab/backup
cd ~/linux-lab/files
pwd
touch empty.txt
printf 'hello Linux\n' > hello.txt
ls -lah
```

`mkdir -p` 创建缺少的父目录，已存在的目录不会因此报错。`touch` 在文件不存在时创建空文件，存在时更新访问与修改时间。`printf` 的 `\n` 表示换行，`>` 把输出写入文件，已有同名文件会被截断并覆盖。

### 复制与移动

```bash
cp -i hello.txt hello-copy.txt
cp -a ../files ../backup/files-copy
mv -i hello-copy.txt renamed.txt
```

`cp` 保留源文件，`mv` 用于移动或改名。`-i` 在可能覆盖目标时询问。`cp -r` 递归复制目录，`cp -a` 以归档方式递归复制并尽量保留权限、时间、符号链接等属性；跨 Windows 文件系统时，属性保留可能受限。

目标目录是否已存在会影响结果。例如 `cp -a files backup/` 会把 `files` 目录放入 `backup`；复制前后使用 `ls` 确认层级，避免误把目录套了两层。

### 删除与文件名处理

```bash
rm -i empty.txt
mkdir empty-dir
rmdir empty-dir
```

`rm` 删除文件，`rmdir` 只删除空目录。删除非空练习目录可用 `rm -rI -- 路径`：`-r` 递归删除，GNU `rm` 的 `-I` 在递归删除等情况下进行一次确认。操作前先用 `pwd`、`ls -ld -- 路径` 确认对象。命令行的 `rm` 通常不进入桌面回收站。

带空格的文件名需要引号：

```bash
printf 'notes\n' > 'my notes.txt'
cp -i -- 'my notes.txt' 'my notes copy.txt'
```

`--` 和引号分别解决不同问题：前者避免文件名被当作选项，后者避免一个文件名被空格拆成多个参数。

### 符号链接与硬链接

```bash
ln -s hello.txt hello-link.txt
ls -l hello-link.txt
readlink hello-link.txt
```

符号链接保存目标路径，可指向文件或目录，也可以跨文件系统。上例保存的相对路径 `hello.txt` 是相对于链接所在目录解析的。目标删除后，链接仍在，但访问目标会失败；删除链接本身通常保留目标。

硬链接则让两个目录项引用同一文件的底层对象：

```bash
ln hello.txt hello-hard.txt
ls -li hello.txt hello-hard.txt
```

`ls -i` 显示 inode 编号。在同一个文件系统中，上例两个名称的 inode 相同，通过任意一个名称修改内容都会反映到另一个名称。普通硬链接不能跨文件系统，也通常不能给目录创建。文件被所有硬链接移除且不再被进程打开后，其存储才会释放。

## 7. 查看与编辑文本

### 按内容规模选择查看方式

```bash
cat hello.txt
less /etc/os-release
head -n 10 /etc/passwd
tail -n 20 /var/log/dpkg.log
wc -l hello.txt
```

`cat` 适合短文件，`less` 适合长文件；`head` 看开头，`tail` 看结尾。日志太长时，可以用 `tail -f logfile` 继续观察追加内容，用 `Ctrl + C` 结束观察。`tail -F logfile` 还能按文件名跟踪并重试，适合可能被日志轮转替换的文件。

`wc -l` 统计换行数量；没有以换行结尾的最后一行会影响结果。`wc -c` 统计字节，`wc -m` 在当前字符编码环境中统计字符，中文 UTF-8 文本的字节数和字符数通常不同。

二进制文件不适合直接用 `cat` 输出到终端。先用 `file 文件名` 判断类型，再选择对应工具。查看需要权限的日志可以对那一个读取命令使用 `sudo`。

### 使用 Nano

```bash
nano hello.txt
```

Nano 打开后即可输入。底部的 `^` 表示 Ctrl：`Ctrl + O` 写出文件，再按 Enter 确认文件名；`Ctrl + X` 退出；`Ctrl + W` 搜索。未保存退出时会询问是否保存。适合刚开始编辑配置文件和短脚本时使用。

### 使用 Vim

```bash
vim hello.txt
```

Vim 默认进入普通模式，按 `i` 进入插入模式才能输入文本。按 Esc 回到普通模式，再输入 `:w` 保存、`:q` 退出、`:wq` 保存退出，或者 `:q!` 放弃未保存修改并退出。

普通模式下 `dd` 删除当前行、`yy` 复制当前行、`p` 粘贴、`u` 撤销；输入 `/Linux` 后按 Enter 搜索，再用 `n` 找下一处。需要完整练习时运行 `vimtutor`。在 WSL 的 Windows 编辑器工作流中，也可以用已经配置好的编辑器，但保存脚本时应选 UTF-8 和 LF 换行。

### 编辑配置前保留副本

对自己管理的配置文件，可以先执行：

```bash
cp -a ~/.bashrc ~/.bashrc.backup
nano ~/.bashrc
diff -u ~/.bashrc.backup ~/.bashrc
```

备份名也应避免覆盖旧副本。`diff -u` 显示差异，便于判断哪些内容改变了。修改系统文件时，`sudoedit /etc/某配置文件` 可以先编辑临时副本再写回，权限使用范围更清楚。配置是否需要重新加载，取决于读取它的程序。

## 8. Bash 的引号、变量与展开

Shell 会在程序真正开始执行之前处理命令行。很多看起来像程序参数的问题，实际发生在这一解析阶段。[^bash-quoting]

### 单引号与双引号

```bash
name='Linux learner'
printf '%s\n' "$name"
printf '%s\n' '$name'
```

第一条输出 `Linux learner`，第二条输出字面量 `$name`。单引号保留内部字符的字面含义；双引号允许变量展开和命令替换，同时保护展开结果中的空格。普通单引号内部不能直接放一个单引号，遇到复杂内容可以改用双引号或后面的 here-document。

```bash
mkdir -p 'directory with spaces'
target='directory with spaces'
ls -ld -- "$target"
```

变量赋值时等号两侧不加空格，引用变量时一般写成 `"$target"`。在普通命令参数中，未引用的变量展开可能继续发生分词和文件名展开。上述目录名如果写成 `ls $target`，就会被分为多个参数。[^bash-expansion]

`${name}` 是另一种变量形式，用于明确变量名边界：

```bash
prefix='report'
printf '%s\n' "${prefix}_2026.txt"
```

### 通配符、花括号与波浪号

```bash
ls *.txt
ls hello?.txt
printf '%s\n' {red,green,blue}
printf '%s\n' {1..3}
printf '%s\n' "$HOME"
```

`*` 匹配零个或多个字符，`?` 匹配一个字符，`[0-9]` 匹配一个范围内的字符。这些属于 Shell 文件名匹配规则，与 `grep` 使用的正则表达式不同。Bash 默认的 `*` 通常不匹配开头为点的隐藏文件。

`{red,green,blue}` 是 Bash 的花括号展开，不要求这些文件存在；`~` 在合适的位置展开为家目录。写路径时可用 `~/projects` 或 `"$HOME/projects"`，而 `"~/projects"` 中的波浪号不会展开。默认情况下，如果 `*.txt` 没有匹配文件，Bash 会保留原始模式，具体还受 `nullglob`、`failglob` 等选项影响。

### 命令替换与算术

```bash
today=$(date +%F)
printf 'date=%s\n' "$today"
count=3
printf '%s\n' "$((count + 2))"
```

`$(...)` 把命令的标准输出放入当前位置，并去掉结尾的换行。`$((...))` 进行 Bash 整数运算，不直接处理浮点小数。这里的日期按 Linux 当前时区计算；查时区使用 `timedatectl`。

### 多行文本与 here-document

```bash
cat > sample.txt <<'EOF'
This is a sample.
$HOME remains literal here.
EOF
```

`<<` 让后续文本成为命令的标准输入，直到遇到单独一行的结束标记。结束标记 `EOF` 本身可以换成别的名称。把标记写为 `<<'EOF'` 会关闭正文中的变量与命令展开，适合写配置、代码和包含 `$` 的示例。`> sample.txt` 仍会覆盖同名文件。

## 9. 输入、输出、管道与退出状态

### 三个标准流

进程通常有标准输入（stdin，编号 0）、标准输出（stdout，编号 1）和标准错误（stderr，编号 2）。交互终端中，输入来自键盘，两种输出都显示到屏幕；重定向可以改变连接位置。

| 写法 | 作用 |
| --- | --- |
| `command > file` | 把标准输出写入文件，覆盖原内容 |
| `command >> file` | 把标准输出追加到文件 |
| `command < file` | 从文件提供标准输入 |
| `command 2> errors.log` | 单独保存标准错误 |
| `command > all.log 2>&1` | 先把 stdout 接到文件，再让 stderr 接到 stdout 的当前目标 |
| `command 2>&1 \| tee all.log` | 合并输出并同时显示、保存 |
| `command > /dev/null` | 丢弃标准输出；错误输出仍保留 |

`/dev/null` 是丢弃写入数据的特殊设备。重定向在命令执行前由 Shell 处理，因此即便程序后来失败，`>` 也可能已经截断了目标文件。

```bash
printf 'first\n' > stream.txt
printf 'second\n' >> stream.txt
cat < stream.txt
```

`> file 2>&1` 与 `2>&1 > file` 的顺序会影响 stderr 去向。重定向是依次执行的连接操作，应按流的最终目标判断。

### 管道

```bash
printf 'orange\napple\napple\npear\n' | sort | uniq -c
```

`|` 把左侧标准输出连接到右侧标准输入。上例先排序，使相同内容相邻，再由 `uniq -c` 统计连续重复行的数量。`uniq` 自身不负责把分散在各处的重复行聚到一起。

```bash
grep -n 'error' app.log | head -n 10
printf 'hello\n' | tee output.txt
```

第一条需要已有的 `app.log`，第二条会在屏幕显示并保存文本。`tee -a` 可以追加。管道默认只连接 stdout，stderr 可用 `2>&1` 合并；Bash 也提供 `|&` 简写。

### 退出状态与条件执行

```bash
test -f hello.txt
printf 'status=%s\n' "$?"
```

`$?` 是刚刚执行完的命令的退出状态。通常 `0` 表示成功，非零表示其他结果或错误。应立即读取它，因为下一条命令执行后会更新这个值。`grep` 找到匹配返回 0，没有匹配返回 1，真正的读取或语法错误通常返回 2，所以非零状态需要结合命令定义理解。

```bash
mkdir -p reports && printf 'directory ready\n'
test -f missing.txt || printf 'file is absent\n'
```

`&&` 在左侧成功时执行右侧，`||` 在左侧失败时执行右侧；`;` 不根据上一条结果决定下一条是否执行。编译后运行可以写成 `gcc main.c -o main && ./main`，让编译成功成为运行的条件。

管道默认使用最后一个命令的退出状态，前面命令失败可能被后面的成功掩盖。Bash 的 `set -o pipefail` 会让管道报告最右侧的非零状态；脚本采用它时也应考虑“没有匹配”或下游提前结束等正常情形。[^bash-pipelines]

## 10. 查找文件与处理文本

### 按内容查找：grep 与 ripgrep

先准备本节的样例：

```bash
cd ~/linux-lab/files
cat > app.log <<'EOF'
INFO startup complete
WARN retry request
ERROR request failed
INFO shutdown complete
EOF

grep -n 'ERROR' app.log
grep -i 'error' app.log
grep -v 'INFO' app.log
grep -E 'WARN|ERROR' app.log
grep -F 'request failed' app.log
```

`-n` 显示行号，`-i` 忽略大小写，`-v` 反选，`-E` 使用扩展正则，`-F` 按固定字符串匹配。搜索像 `a.b` 这样的字面内容时，`-F` 可以避免点号被当成正则中的任意字符。

`grep -R` 可以递归搜索目录，但大型工程可能包含依赖和构建文件，需要限定范围。ripgrep 的命令名是 `rg`，它默认递归搜索，并通常遵循忽略规则，适合工程源码搜索。本机尚未找到 `rg`，安装命令是 `sudo apt install ripgrep`。安装后可用：

```bash
rg -n 'TODO' ~/projects
rg -n -g '*.c' 'main' ~/projects
rg -n -F 'request failed' ~/linux-lab
```

默认忽略行为也可能让需要的文件不在结果中，例如隐藏文件或被 `.gitignore` 排除的内容。必要时查询 `rg --help` 中的 `--hidden`、`--no-ignore`，并限制到实际需要的目录。

### 正则表达式的基本规则

| 表达式 | 扩展正则中的常见含义 |
| --- | --- |
| `^ERROR` | 行首的 `ERROR` |
| `complete$` | 行尾的 `complete` |
| `.` | 一个任意字符，通常不跨换行 |
| `[0-9]` | 一位数字 |
| `[[:space:]]` | 一个空白字符 |
| `a*` | 零个或多个 `a` |
| `a+` | 一个或多个 `a` |
| `WARN|ERROR` | 匹配其中任意一个 |
| `\.` | 字面量点号 |

正则写在单引号里，让 Shell 保留反斜杠和 `$`。注意 `grep -E 'a*'` 匹配的是重复的字符 `a`，而 Shell 的 `ls a*` 匹配的是名称以 `a` 开头的文件。不同工具的正则引擎还有差异，复杂表达式应查对应手册。

### 按文件名与属性查找：find

```bash
find ~/linux-lab -type f -name '*.txt'
find ~/linux-lab -type d
find ~/linux-lab -type f -mtime -7
find ~/linux-lab -type f -size +10M
find ~/linux-lab -type f -name '*.txt' -exec wc -l {} +
```

`-type f` 选普通文件，`-type d` 选目录，`-name` 按名称匹配，`-mtime -7` 按 `find` 的整 24 小时分组规则匹配较近的修改时间，`-size +10M` 按 find 的大小单位规则筛选。`'*.txt'` 要加引号，让模式交给 `find`，而不是先在当前目录被 Bash 展开。

`-exec` 中的 `{}` 被替换为找到的文件名，`+` 把多个文件交给一批命令处理。这个方法能直接保留包含空格的文件名。需要逐个调用时也可用以转义分号结束的 `-exec command {} \;`。

### 排序、分列与替换

```bash
printf '10\n2\n1\n' | sort -n
cut -d: -f1 /etc/passwd
awk -F: '$3 >= 1000 && $3 < 65534 {print $1, $3}' /etc/passwd
sed -n '1,3p' app.log
sed 's/ERROR/FAIL/g' app.log
```

`sort -n` 按数值排序，普通 `sort` 根据文本排序规则工作；规则也受 locale 影响。`cut` 适合固定分隔符的简单列提取。`awk` 按记录处理文本，默认以空白划分字段，`-F:` 改为冒号，`$1`、`$3` 分别指第一、第三列；上例只是演示 UID 范围筛选，不是所有系统识别普通用户的通用规则。

`sed -n '1,3p'` 输出前三行，`s/旧/新/g` 在每行进行替换。上例只显示替换后的输出，不改原文件。真正需要原地修改时，可以在确认匹配范围后用 `sed -i.bak ... 文件` 留下备份。处理带引号、转义和复杂结构的 CSV、JSON、YAML 时，应使用对应格式的解析工具。

### 把查找结果交给其他命令

```bash
find ~/linux-lab -type f -name '*.txt' -print0 | xargs -0 -r wc -l
```

`-print0` 与 `xargs -0` 使用空字符分隔文件名，可以处理空格和换行。GNU `xargs` 的 `-r` 在没有输入时不执行命令。不要依赖解析 `ls` 的输出来批量处理文件名；简单操作优先用 `find -exec`，复杂操作再用能保持名称边界的脚本。

## 11. 用户、权限与 sudo

### 身份与所有权

```bash
whoami
id
groups
ls -l hello.txt
```

本机用户是 `bts`，属于 `sudo` 组。普通账户适合写代码、管理家目录和运行用户程序；安装系统包、修改系统配置等操作才需要管理权限。`sudo` 是否准许某条命令，由系统的 sudoers 策略决定。

`ls -l` 的典型输出可以拆成：

```text
-rw-r--r-- 1 bts bts 12 Oct 12 10:00 hello.txt
│└权限位   │  │   │   │       │          └名称
类型      链接数 所有者 所属组 大小    修改时间
```

首字符 `-` 是普通文件，`d` 是目录，`l` 是符号链接。后九位分成所有者、所属组、其他用户三组，每组三位依次为读 `r`、写 `w`、执行或目录搜索 `x`。

| 权限 | 普通文件 | 目录 |
| --- | --- | --- |
| `r` | 读取内容 | 列出目录项名称 |
| `w` | 修改内容 | 修改目录项，例如创建、删除和改名，通常还需 `x` |
| `x` | 请求将文件作为程序执行 | 进入目录、按名称访问其中对象 |

目录的执行权限影响路径访问，删除一个文件主要取决于父目录权限，也受 sticky bit、访问控制列表等限制。只把文件本身设为只读，并不自动禁止有父目录写权限的人删除它。[^file-modes]

### 修改权限

```bash
chmod u+x script.sh
chmod go-w hello.txt
chmod 644 hello.txt
chmod 700 private-dir
```

这些示例要求对应文件或目录存在。符号写法中，`u/g/o/a` 分别表示所有者、组、其他人、所有人；`+` 添加，`-` 移除，`=` 指定。

数字权限把 `r=4`、`w=2`、`x=1` 相加。`644` 是所有者可读写，组和其他人只读；`755` 常用于需要公开读取和执行的目录或程序；`700` 让只有所有者能读、写、执行或进入。权限应按用途设置，`777` 会让所有人都获得全部普通权限，不能代替对所有权和目录访问的检查。

```bash
umask
```

`umask` 是新文件权限的屏蔽值。常见 `022` 会使请求 `666` 的普通文件得到 `644`，请求 `777` 的目录得到 `755`，前提是没有默认 ACL 等额外因素。新建普通文本文件通常不会因为 umask 就自动获得执行位。

### sudo 的使用范围

```bash
sudo apt update
sudo -l
sudo -k
```

输入 sudo 密码时，终端通常不显示字符或星号，这是正常行为。`sudo -l` 查看获准的操作，`sudo -k` 清除缓存的认证状态。`sudo -i` 会进入管理账户的登录 Shell，确有连续管理工作需要时再使用，并在完成后 `exit`。

`sudo echo value > /etc/example.conf` 中，`>` 由当前普通用户的 Shell 执行，提升的是 `echo`，因此写入仍可能被拒绝。需要写系统配置时可以使用 `sudoedit`，或理解权限范围后用 `printf ... | sudo tee 文件`。`tee` 同样会覆盖目标，不应随意拿实际系统配置做练习。

如果某个明确的项目文件是误用 sudo 创建的，可以针对它修正所有权：

```bash
sudo chown bts:bts /home/bts/projects/example/file.txt
```

不要把整个系统目录的所有权递归改成普通用户。排查权限问题时，先确认对象、父目录和实际执行账户，再决定改变哪一项。

## 12. 软件安装：APT、dpkg、Snap 与语言包管理器

### 本机主要使用 APT / dpkg

Ubuntu 属于 Debian 系列，系统软件通常以 `.deb` 包分发。APT（Advanced Package Tool）负责查询仓库、计算依赖、下载软件并组织安装；dpkg 负责包的底层安装与状态记录。日常在终端使用 `apt`，自动化脚本通常选 `apt-get`，以获得更适合脚本的接口。[^apt]

```bash
# 刷新本地软件包索引
sudo apt update

# 搜索与了解软件
apt search ripgrep
apt show ripgrep
apt-cache policy ripgrep

# 安装一个或多个软件包
sudo apt install ripgrep
sudo apt install python3-venv cmake unzip

# 查看可以更新的软件，再按需要更新
apt list --upgradable
sudo apt upgrade
```

`apt update` 更新的是可用软件包的索引，`apt upgrade` 更新已安装软件，`apt install` 安装指定包及依赖。`apt-cache policy` 显示已安装版本、候选版本及来源，适合确认将从哪个仓库安装。

`apt upgrade` 可以安装必要的新依赖，但通常不会为了升级主动移除已安装包；`apt full-upgrade` 允许在依赖调整时移除包，执行前应阅读拟议变更。升级到新的 Ubuntu 发行版则是另外的发行版升级流程。

本机已安装 `build-essential`，其中包括常用 C/C++ 构建组件。可以按实际需求补上 `python3-venv`、`ripgrep`、`cmake` 或 `unzip`，无需一开始把所有工具都装齐。

### 查看安装状态与文件来源

```bash
dpkg -l git
dpkg -L git
dpkg -S /usr/bin/git
apt list --installed
apt-mark showmanual
```

`dpkg -l` 行首 `ii` 通常表示包已安装；`rc` 常表示包被移除但仍有配置残留；查询到名称或数据库条目并不保证已安装。`dpkg -L` 列出软件包提供的文件，`dpkg -S` 查询文件归属，但运行时生成的文件不一定能查到。

`apt-mark showmanual` 列出被标记为手动安装的包，依赖包则可能标记为自动安装。这些标记影响 `autoremove` 的判断，可以用 `apt-mark manual 包名` 保留确实需要独立使用的包。

### 移除、清理与本地 deb

```bash
sudo apt remove ripgrep
sudo apt purge ripgrep
apt -s autoremove
sudo apt autoremove
sudo apt clean
```

这里的移除命令用于说明语法，不必把刚安装的工具立即卸载。`remove` 通常保留系统配置，`purge` 同时移除包管理范围内的配置；用户家目录中的项目和个人配置通常不会因此全部删除。`autoremove` 清理被判定为不再需要的自动依赖，先用 `-s` 模拟并阅读列表。`clean` 清理下载缓存，保留已安装的软件。

下载了可信的本地包后，可以在它所在目录执行：

```bash
sudo apt install ./package.deb
```

`./` 让 APT 明确按路径处理本地文件，它仍会尝试从仓库解决依赖。`dpkg -i package.deb` 本身不会自动下载依赖，依赖不满足时会留下未完成状态。第三方包还应核对 Ubuntu 版本与 `amd64` 等架构。

### 本机的软件源

本机的主要源文件是 `/etc/apt/sources.list.d/ubuntu.sources`，使用 deb822 格式：

```text
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/ubuntu/
Suites: noble noble-updates noble-backports
Components: main universe restricted multiverse
```

这是字段示意，省略了实际签名配置和单独的安全更新段，不能直接用它覆盖完整文件。`URIs` 指镜像地址，`Suites` 指发行分支，`Components` 指软件仓库分类。较旧教程可能使用 `/etc/apt/sources.list` 的逐行格式；应以本机文件为准。目录中还发现了 CUDA 相关源文件，其存在本身不能证明 CUDA 与 GPU 都能正常工作。

### Snap 与其他包管理工具

Snap 分发应用及其运行组件，安装与 APT 的包数据库相互独立。本机已经安装 Snap 管理服务，并有 Snap 版 `tldr`：

```bash
snap list
snap info tldr
snap run tldr ls
```

`snap install`、`snap refresh`、`snap remove` 分别用于安装、更新和移除。Snap 应用能否在 WSL 中正常工作，还要看应用自己的运行要求。

常见发行版的系统包工具可以对照为：

| 系统系列 | 常见高层工具 | 常见底层包格式或工具 |
| --- | --- | --- |
| Ubuntu、Debian | `apt` / `apt-get` | `.deb` / `dpkg` |
| Fedora、现代 RHEL 系列 | `dnf` | `.rpm` / `rpm` |
| Arch Linux | `pacman` | Arch 包与数据库 |
| Alpine Linux | `apk` | Alpine 包与数据库 |
| openSUSE | `zypper` | `.rpm` / `rpm` |

本机没有找到 `dnf`、`pacman`、`apk`、`zypper`、Flatpak 或 Homebrew 命令，日常不需要把其他发行版的管理器装进来才能安装 Ubuntu 软件。

语言生态中的 `pip`、`npm`、`pnpm`、Cargo 等管理对应项目的库和工具。APT 安装 Python 解释器、编译器或系统库；pip 安装某个 Python 环境中的包；npm/pnpm 安装 Node.js 项目依赖。同一台电脑可以同时使用这些工具，应按要安装的对象选择。

### APT 的使用体验与版本策略

在 Ubuntu 中，APT 是系统包管理的常规选择，Ubuntu 官方仍推荐它安装与管理 Debian 软件包。是否适合某个任务，要看具体需求，而不是笼统地把它判断为好用或不好用。[^apt]

一些常见的不满分别来自不同层次：

| 体验或需求 | 主要涉及的层次 | 更合适的处理方法 |
| --- | --- | --- |
| 下载慢、连接失败 | 镜像、网络、代理和目标仓库 | 检查实际源地址与网络路径；更换前端未必解决连接问题 |
| 仓库里的工具版本不够新 | 发行版的软件版本策略 | 查看候选版本；系统库沿用发行版，开发工具按项目要求另行管理 |
| 安装计划与日志不够易读 | 命令行展示与交互 | 可以尝试 Nala 这类 APT 前端 |
| 自动化脚本提示接口不稳定 | `apt` 命令定位为交互使用 | 脚本使用 `apt-get` 等适合自动化的接口 |
| Python 项目需要不同依赖版本 | 项目环境管理 | 使用 venv、uv 等隔离项目依赖 |
| 想在多个项目中切换运行时 | 工具链版本管理 | 使用对应生态的版本管理方案，确认 PATH 与解释器 |

Ubuntu LTS 仓库通常优先保持发行版内的兼容与稳定，版本号不一定追随上游最新发布。维护者也可能把修复回移到已有版本，判断一个包是否有某项修复，应看发行版变更记录和安全说明，不能只比较主版本号。

对本机而言，继续用 APT 管理 GCC、系统库、SSH、基础命令等是合理的；Python 和 Node 项目的依赖则分别交给其生态工具。更换系统包管理器不能代替项目依赖隔离，也不保证仓库中的软件会更新。

### 按任务选择补充工具

我的建议是先保留 APT，再按用途增加工具：

| 工具 | 更适合的用途 | 与 APT 的关系 |
| --- | --- | --- |
| **Nala** | 想要更易读的安装计划、输出和事务历史 | APT 前端，继续使用 Ubuntu 的包体系 |
| **uv** | Python 项目、依赖、锁文件、虚拟环境与 Python 版本管理 | 管理 Python 工作流，系统依赖仍需发行版工具 |
| **pipx** | 安装独立的 Python 命令行应用 | 给每个应用提供隔离环境，保留系统 Python 的管理边界 |
| **npm / pnpm** | Node.js 工程的依赖与脚本 | 管理 JavaScript 生态，按项目锁文件选择 |
| Snap / Flatpak | 需要它们提供的应用及打包方式 | 使用另一套应用分发机制，不接管全部系统包 |

#### Nala：改善 APT 的交互

本机的包索引中已有 `nala` 候选版本 `0.15.1`，来自 `noble/universe`，当前没有安装。Ubuntu 包描述将它定位为 APT 命令行前端，强调更易读的输出和事务历史。它仍依赖 APT，使用相同的软件源与底层包数据库。[^nala]

如果以后想尝试，可以在 Ubuntu 中执行：

```bash
apt-cache policy nala
sudo apt install nala
nala --help
sudo nala update
sudo nala install ripgrep
nala history
```

这是供选择后的安装示例，本次只查询了候选版本，没有安装。Nala 与 apt 可以在不同时间管理同一套包，但不要同时启动多个安装或升级事务。历史撤回也受包版本是否仍可获取等条件限制，不等同于系统快照恢复。

#### uv 与 pipx：分别管理项目和应用

uv 提供项目依赖、环境和锁文件管理，也能管理 Python 版本与运行 Python 工具；pipx 则重点安装可从命令行调用的 Python 应用，每个应用使用隔离环境。选择依据是要维护一个项目，还是要安装一个独立命令行工具。[^uv-tools]

配置好 Linux 侧 uv 后，可以在一个新的工程目录练习：

```bash
uv init python-study
cd python-study
uv add requests
uv run python -c 'import requests; print(requests.__version__)'
uv sync
```

这是 uv 项目工作流，通常涉及 `pyproject.toml`、`uv.lock` 与项目虚拟环境。已有工程应沿用它规定的依赖流程，不必仅因为 uv 的存在就把所有工程改写。

在 Ubuntu 中安装 pipx，再由它安装需要的 Python 应用的例子：

```bash
sudo apt install pipx
pipx ensurepath
# 根据 ensurepath 提示重新打开终端后，再安装独立应用
pipx install ruff
pipx list
```

这里的 Ruff 是示例。项目依赖通常不通过 pipx 添加，系统 Python 也不通过它整体替换。uv 的 Linux 安装方式可以查其官方项目说明；安装后先用 `type -a uv` 确认没有误用 Windows 侧命令。

#### 更换发行版与引入另一套环境

DNF、pacman、apk 分别配合对应发行版的仓库、包格式和系统设计。把其中一个命令装进 Ubuntu，不会让它自然接管 Ubuntu 的全部系统组件。需要体验这些工具时，独立安装相应发行版作为另一个 WSL 环境，更容易保持各自的管理边界。

Homebrew on Linux、Nix、Conda 等也可以引入另一套工具或环境管理方式，但会增加路径、依赖和更新来源的管理工作。初学阶段先掌握 APT 与一种实际项目需要的生态工具；等遇到明确的版本、可复现环境或跨平台需求，再决定是否引入额外体系。

## 13. 环境变量、PATH 与 Shell 配置

### 临时变量与导出变量

```bash
project_name='linux-lab'
printf '%s\n' "$project_name"
export EDITOR=nano
printenv EDITOR
unset project_name
```

普通 Shell 变量属于当前 Shell。`export` 把变量放入环境，之后启动的子进程可以继承它；子进程不能直接反向改变父 Shell 的环境。`EDITOR=nano command` 则只为那一次命令设置环境变量。

常见环境变量有 `HOME`、`PATH`、`LANG`、`EDITOR`。它们有既定含义，不适合拿来当临时练习变量。查看某一个值可用 `printenv PATH`；不要把含令牌、密码的环境输出原样分享。

### PATH 与同名命令

```bash
printf '%s\n' "$PATH" | tr ':' '\n'
type -a git
type -a npm
command -v python3
```

PATH 是用冒号分隔的目录列表，外部命令通常按顺序查找；别名、函数和内建命令还可能更早参与解析。本机 PATH 中的 Windows 路径解释了为什么 Ubuntu 中能找到 Windows 的 npm。

假设把自己的脚本放在 `~/.local/bin`，可以创建目录并临时加入 PATH：

```bash
mkdir -p ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
hash -r
```

这会让该目录优先于后面的目录，操作后使用 `type -a 命令` 确认。不要用一个自定义目录完全覆盖原 PATH。Bash 会缓存部分命令位置，`hash -r` 清除缓存，适合安装或切换同名工具后使用。

### .bashrc 与 .profile

`~/.bashrc` 通常由交互式、非登录 Bash 读取，适合别名、提示符和交互行为。登录 Bash 会依次寻找 `~/.bash_profile`、`~/.bash_login`、`~/.profile` 中第一个存在的文件；Ubuntu 的默认配置还可能在其中加载 `.bashrc`。本机有 `.bashrc` 与 `.profile`，没有发现 `.bash_profile`。

在 `~/.bashrc` 中增加简单别名的示例：

```bash
alias ll='ls -alF'
```

保存后开一个新终端，或在理解文件内容后执行 `source ~/.bashrc`。`source` 在当前 Shell 中执行文件，文件里的 `cd`、`export` 等能直接影响当前会话；`bash file.sh` 则在另一个 Bash 进程中运行。普通脚本和 cron 任务不保证读取 `.bashrc`，需要在脚本中显式提供所需路径与环境。

## 14. 进程、前后台任务与 tmux

### 查看与结束进程

进程是正在运行的程序实例，每个进程有进程号 PID、所属用户和父进程。查看常用命令：

```bash
ps -ef
ps -u "$USER" -o pid,ppid,stat,etime,cmd
pgrep -a -u "$USER" bash
top
```

`ps` 给出某一时刻的状态，`top` 持续刷新，按 `q` 退出。PID 会随进程重启改变，也可能被系统重复使用，所以结束进程前应确认命令名和所属用户。

```bash
kill -TERM 12345
```

这里的 PID 是占位示例。`TERM` 请求进程正常结束，让它有机会保存状态、释放资源。`kill` 默认也是发送 TERM；对长时间没有响应、已经确认对象的进程才考虑 `kill -KILL PID`。KILL 无法被捕获，也无法让程序进行退出清理。`Ctrl + C` 通常向前台进程组发送 INT。

### Shell 的任务控制

```bash
sleep 120 &
jobs -l
fg %1
```

`&` 把任务放到后台，`jobs` 查看当前 Shell 管理的任务，`%1` 是任务编号，与 PID 不同。上例恢复前台后可以按 `Ctrl + C` 结束，也可以按 `Ctrl + Z` 暂停，再输入 `bg %1` 让它继续在后台运行。

`&` 本身没有保证任务在终端关闭后持续运行。`nohup` 配合重定向常用于让非交互任务忽略挂断信号：

```bash
nohup bash long-task.sh > task.log 2>&1 < /dev/null &
printf 'pid=%s\n' "$!"
```

`long-task.sh` 需要事先存在。`$!` 是最近一个后台任务的 PID。是否持续运行还取决于程序与会话管理方式；WSL 整体停止后，进程仍会结束。需要反复回到交互会话时，tmux 更合适。

### 使用 tmux 保留终端会话

本机已经安装 tmux：

```bash
tmux new -s study
```

进入后，先按 `Ctrl + B`，松开，再按 `D`，可以脱离会话而不结束其中的任务。以后使用：

```bash
tmux ls
tmux attach -t study
```

| 默认前缀后的键 | 用途 |
| --- | --- |
| `C`，即小写 `c` | 新建窗口 |
| `N` / `P`，即小写 `n` / `p` | 下一个、上一个窗口 |
| `%` | 左右分屏 |
| `"` | 上下分屏 |
| 方向键 | 切换面板 |
| `[` | 进入复制与滚动模式；按 `q` 退出 |
| `d` | 脱离会话 |

表中的字母键按小写输入；快捷键可以在配置中改变。面板中输入 `exit` 关闭当前 Shell，所有窗口关闭后会话结束。`tmux kill-session -t study` 会结束指定会话及其中任务，应在确认后使用。

tmux 保存的是运行中的终端会话，不是磁盘备份，也不跨 `wsl --shutdown` 或 Windows 重启自动保留进程。长任务需要能写入结果、记录日志，必要时设计断点恢复。

## 15. systemd、服务与日志

### 服务的运行状态与启用状态

服务通常是需要持续运行、由系统统一管理的程序。systemd 以单元（unit）组织服务、定时器、挂载点等，本机 PID 1 已经是 systemd。

```bash
systemctl is-system-running
systemctl --failed
systemctl list-units --type=service --state=running
systemctl list-unit-files --type=service
```

`list-units` 偏向查看当前加载的单元及其运行状态，`list-unit-files` 查看单元文件及启用状态。`active` 表示当前运行或处于单元定义的活动状态；`enabled` 表示配置了启动依赖。一个服务可以“已启用但当前失败”，也可以“当前运行但没有启用自动启动”。

假设系统已经安装某个 `example.service`，管理命令是：

```bash
systemctl status example.service
sudo systemctl start example.service
sudo systemctl stop example.service
sudo systemctl restart example.service
sudo systemctl enable example.service
sudo systemctl disable example.service
```

`start/stop/restart` 改变当前运行状态；`enable/disable` 改变自动启动配置。`enable --now` 同时启用并立即启动。`reload` 请求服务重新读取自己的配置，前提是服务支持该操作；修改 systemd 单元文件后则用 `daemon-reload` 让 systemd 重新读取单元定义，两者作用不同。

在 WSL 中，“启用随系统启动”主要指发行版启动时的 systemd 流程。它本身并不保证 Windows 开机后自动拉起 Ubuntu，也不使任务在 WSL 关闭之后继续运行。

### 从日志判断失败原因

针对本机记录到的失败服务，可以查看：

```bash
systemctl status nvidia-persistenced.service --no-pager -l
sudo journalctl -u nvidia-persistenced.service -b --no-pager -n 100
```

`-u` 限定单元，`-b` 限定当前启动周期，`-n 100` 看最后 100 条。不要仅根据服务名决定重装软件，应先看实际错误，例如无法访问设备、路径不存在或权限不符。

常用日志读取方法：

```bash
journalctl -b -p warning --no-pager
journalctl -u example.service --since '1 hour ago'
journalctl -u example.service -f
journalctl --disk-usage
```

读取系统日志可能需要 `sudo` 或对应组权限。`-f` 连续观察新日志，`Ctrl + C` 结束。`--since` 使用系统时区解析时间。文件日志仍可能在 `/var/log` 中，两种方式可以结合；并非所有程序都会把日志写入 journald。

排查的顺序通常是确认服务状态、阅读日志、核对配置和依赖，再根据明确错误修正。`systemctl reset-failed` 只清理失败状态记录，不会修复导致失败的问题。

## 16. CPU、内存、磁盘与挂载

### 了解系统资源

```bash
uname -a
lscpu
nproc
free -h
uptime
```

`uname` 查看内核与机器信息，`lscpu` 查看 CPU 拓扑，`nproc` 给出当前进程可用处理单元数量。`free` 中的 `available` 是估计还能供新应用使用的内存，比只看 `free` 更适合理解余量，因为 Linux 会把部分空闲内存用于可回收缓存。

Swap 是交换空间，可以在内存压力下保存部分内存页，但磁盘访问通常比 RAM 慢。`free -h` 显示 Swap 已用不为零，也不一定等于当前正在严重换页，需要结合负载和应用响应判断。

`uptime` 显示运行时间与 1、5、15 分钟负载均值。Linux 的负载包括可运行任务以及部分不可中断等待任务，不等同于 CPU 使用百分比。比较负载与可用 CPU 数量可以辅助判断，但 I/O 等待也会使负载升高。

### 查找磁盘空间占用

```bash
df -h
df -i
du -h --max-depth=1 ~/linux-lab
du -sh ~/projects
lsblk -f
findmnt /mnt/d
```

`df` 查看整个文件系统的空间，`du` 统计指定目录树中实际可见文件的磁盘占用。`df -i` 查看 inode 余量，极大量小文件可能使 inode 先耗尽。`lsblk` 查看块设备，`findmnt` 查看挂载关系。

`du` 遇到无权访问的目录会少统计；文件已经被删除但仍被进程打开时，也可能出现 `df` 认为空间仍占用、`du` 找不到对应名称的情况。定位大目录时先按层级查看，再进入具体目录，不要直接从系统根目录无差别清理。

WSL 的 Linux 根文件系统位于虚拟磁盘中。删除 Linux 文件会释放文件系统内部的空间，但 Windows 看到的虚拟磁盘文件不一定立刻缩小。实际压缩虚拟磁盘属于单独的维护操作，应在有备份并确认磁盘位置后按 WSL 官方流程处理。

### 挂载的含义

Linux 把一个文件系统接到某个目录上，这个目录就是挂载点。访问 `/mnt/d` 时读到的是挂载进来的 Windows D 盘；访问 `/` 时读到的是 Linux 根文件系统。同样的路径名和目录层级，可以连接不同的存储。

原生 Linux 的 `mount`、`umount`、`/etc/fstab` 用于配置挂载；WSL 的 Windows 盘自动挂载还有专门配置。本篇入门练习只读取挂载信息，磁盘分区、格式化和调整系统挂载应作为独立任务学习。

## 17. 打包、压缩、同步与备份

### tar 与压缩格式

`tar` 把多个文件与目录归档到一个文件，gzip、xz 等再对数据压缩。`.tar`、`.tar.gz` 与 `.zip` 是不同格式，操作前先确认格式。

```bash
cd ~/linux-lab

# 把 files 目录打包压缩，归档放在被打包目录之外
tar -czf files.tar.gz -C "$HOME/linux-lab" files

# 查看归档内容
tar -tzf files.tar.gz

# 解压到独立目录
mkdir -p restored
tar -xzf files.tar.gz -C restored
```

`-c` 创建，`-x` 解包，`-t` 列表，`-z` 使用 gzip，`-f` 指定归档文件，`-C` 切换操作目录。`-f` 后要有归档文件名。对于来源不熟悉的压缩包，先查看内容，再解到独立目录，以便确认是否有多层目录和同名覆盖。

`.tar.xz` 常用 `tar -cJf` / `tar -xJf`。ZIP 工具在本机当前 PATH 中尚未找到，按需要安装：

```bash
sudo apt install zip unzip
unzip -l archive.zip
unzip archive.zip -d extracted
zip -r files.zip files
```

这些 ZIP 命令需要对应的归档或目录存在。`sha256sum 文件` 可计算校验值；把结果与发布者通过可信渠道提供的值比较，可以检查文件内容是否一致。

### rsync 与尾斜杠

本机已经安装 rsync。它适合增量复制、同步工程与备份：

```bash
mkdir -p ~/linux-lab/sync-copy
rsync -av --dry-run ~/linux-lab/files/ ~/linux-lab/sync-copy/
rsync -av ~/linux-lab/files/ ~/linux-lab/sync-copy/
```

`-a` 尽量保留目录结构与常见属性，`-v` 显示过程，`--dry-run` 预演而不执行复制。源路径末尾的 `/` 很重要：`files/` 表示复制其中的内容，而 `files` 通常把目录自身复制到目标目录下。先预演即可看清层级。

普通同步不会自动删除目标中多出来的文件；`--delete` 会改变这一点，适合明确需要镜像同步的情况，使用前应先预演。跨到 Windows 文件系统时，部分 Unix 权限与链接属性可能不能完全保留，完整 Linux 属性备份可优先使用归档或发行版导出。

同步后的一个副本能用于恢复，但如果源端误删立刻同步，副本也可能丢失。重要资料应有历史版本或多代备份，而不是只有永远跟随源端的一个目录。

### 备份整个 WSL 发行版

在 PowerShell 中先保存工作、停止发行版，创建一个实际可用且空间充足的备份目录，再导出：

```powershell
New-Item -ItemType Directory -Force -Path 'D:\WSL-Backups'
wsl --terminate Ubuntu-24.04
wsl --export Ubuntu-24.04 'D:\WSL-Backups\Ubuntu-24.04-2026-10-12.tar'
```

备份文件名中的日期按实际日期修改，并避免覆盖已有备份。导出 Linux 发行版不会顺带打包挂载的 Windows D 盘文件，因此博客等 Windows 文件还需要自己的备份。恢复时可以导入为一个新名称的发行版，保留原环境进行比较：

```powershell
wsl --import Ubuntu-Restore 'D:\WSL\Ubuntu-Restore' 'D:\WSL-Backups\Ubuntu-24.04-2026-10-12.tar' --version 2
wsl -d Ubuntu-Restore --cd ~
```

导入目录与名称应使用尚未占用的值。导入后的默认用户需要检查，可通过 `/etc/wsl.conf` 的 `[user]` 配置指定已有用户。WSL 的注销命令会删除发行版数据，备份或普通重启不需要注销发行版。[^wsl-export]

## 18. 网络、端口与代理

### 分层判断连接问题

网络访问通常经过域名解析、路由、目标端口与应用协议几个步骤。把失败点分开，能避免遇到任何问题都直接修改 DNS 或代理。

```bash
ip addr
ip route
getent hosts example.com
ping -c 4 example.com
curl -I --connect-timeout 10 --max-time 20 https://example.com
```

`ip addr` 查看接口地址，`ip route` 查看路由，`getent hosts` 按系统解析规则查询域名。`ping` 使用 ICMP，目标可能禁止回应，因此 ping 不通不能单独证明 HTTPS 也不通。`curl -I` 发送 HTTP HEAD 请求，有些应用不支持 HEAD；出现这种情况时应换成实际请求来判断。

`curl -v` 可显示连接、TLS 和请求细节，但分享日志前应删除认证头与敏感 URL。检查时间使用 `date`、`timedatectl`，严重时间偏差可能影响证书验证。

### 监听端口与本地服务

```bash
ss -ltn
sudo ss -ltnp
```

`-l` 只看监听，`-t` 看 TCP，`-n` 以数字显示地址和端口，`-p` 显示进程，其他用户进程可能需要权限。

| 监听地址 | 含义 |
| --- | --- |
| `127.0.0.1:8000` | 绑定 IPv4 回环接口，只从本机网络环境访问 |
| `0.0.0.0:8000` | 绑定所有 IPv4 接口，是否能从外部连接还取决于防火墙与网络 |
| `[::1]:8000` | IPv6 回环接口 |
| `[::]:8000` | 所有 IPv6 接口，IPv4 行为还受套接字设置影响 |

在练习目录运行一个仅供本机查看的 HTTP 文件服务：

```bash
mkdir -p ~/linux-lab/site
printf 'Hello from WSL\n' > ~/linux-lab/site/index.html
cd ~/linux-lab/site
python3 -m http.server 8000 --bind 127.0.0.1
```

然后在另一个 Ubuntu 终端中访问 `curl http://127.0.0.1:8000/`。Windows 浏览器也可尝试 `http://localhost:8000`。本机配置为镜像网络，Windows 与 WSL 的 localhost 访问有相应支持；实际连接还需考虑软件监听方式和防火墙。[^wsl-network]

这个 Python 服务用来学习请求、端口和日志，不用于生产部署。停止时在服务所在终端按 `Ctrl + C`。启动服务的当前目录是对外提供内容的目录，所以练习放在独立目录中。

### Windows 代理与 WSL

本机 `.wslconfig` 配置了 `autoProxy=true`。它使 WSL 可以使用 Windows 的 HTTP 代理信息，但具体应用是否遵循系统信息、环境变量或自己的设置，需要分别确认。

当某个 HTTP 工具确实需要手动代理时，可以在当前 Shell 临时设置：

```bash
# 7890 是示例端口，要换成实际代理端口
export http_proxy='http://127.0.0.1:7890'
export https_proxy='http://127.0.0.1:7890'
export no_proxy='localhost,127.0.0.1,::1'
```

`https_proxy` 的值可以使用 `http://`，因为常见 HTTP 代理通过 CONNECT 为 HTTPS 建立隧道。SOCKS 与 HTTP 代理协议不同，应按代理实际类型配置。大小写变量名与 `no_proxy` 语法的支持情况依工具而异。

Windows 与 WSL 在 NAT 模式、镜像模式下的寻址方法不同；本机配置为镜像模式，不应直接照搬“必须用默认网关访问 Windows 代理”的 NAT 教程。代理软件还要实际监听对应地址与端口。

临时设置不再需要时：

```bash
unset http_proxy https_proxy no_proxy
```

APT、Git、pip、npm 等还可能有自己的代理配置。排查时查看实际使用的那一种工具，确认配置来源和协议一致；不要用关闭 TLS 校验来掩盖证书或网络问题。

## 19. SSH 远程登录与文件传输

### 客户端与服务器

SSH（Secure Shell）用于加密远程登录与相关通信。本机已找到 `ssh` 客户端，能够发起连接；让别人登录本机则需要 SSH 服务器程序与相应服务，两者不是同一项安装。

```bash
ssh user@server.example.com
ssh -p 2222 user@server.example.com
```

第一次连接会询问服务器主机密钥是否可信。应通过管理员或其他可信渠道确认指纹，再接受。之后主机密钥变化可能是服务器重装，也可能是连接目标有误，需要先核实原因。

登录成功后，命令运行在远程服务器上，路径也属于服务器。使用 `hostname`、`pwd`、`whoami` 确认当前位置和身份，`exit` 退出远程 Shell。

### 密钥认证

```bash
ssh-keygen -t ed25519 -C 'wsl-study'
```

生成时可以设置私钥口令。如果默认路径已经有密钥，不要确认覆盖；可以选择另一个文件名，例如 `~/.ssh/id_ed25519_study`。`.pub` 文件是公钥，可部署到远端账户；没有 `.pub` 后缀的文件是私钥，应仅由自己持有。

如果本机有 `ssh-copy-id`，且远端允许现有认证方式，可以部署指定公钥：

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_study.pub user@server.example.com
ssh -i ~/.ssh/id_ed25519_study user@server.example.com
```

上例假设生成时选择了该文件名。远端通常把公钥追加到 `~/.ssh/authorized_keys`，私钥留在本机。SSH 对私钥与相关目录权限有检查，常见设置是 `~/.ssh` 为 `700`、私钥和 `authorized_keys` 为 `600`；对已有文件操作前应确认路径和所有者。

### 给连接起别名

在本机 `~/.ssh/config` 中可为自己的服务器写一段：

```sshconfig
Host lab
    HostName server.example.com
    User user
    Port 2222
    IdentityFile ~/.ssh/id_ed25519_study
    IdentitiesOnly yes
```

以后用 `ssh lab` 登录。主机、端口和账户需要替换为实际信息。指定密钥有助于避免客户端向服务器尝试过多无关密钥。

### 传文件与端口转发

```bash
# 上传与下载，scp 指定端口使用大写 -P
scp -P 2222 report.txt user@server.example.com:~/
scp -P 2222 user@server.example.com:~/result.txt ./

# 通过 SSH 做增量同步
rsync -av -e 'ssh -p 2222' ./project/ user@server.example.com:~/project/
```

传输前确认源文件与远端路径，rsync 的尾斜杠规则同样适用。较新 OpenSSH 的 scp 通常使用 SFTP 传输机制，旧服务器的兼容问题应查客户端手册与服务器配置。

远端有一个只监听自身回环接口的 8000 端口服务时，可以建立本地转发：

```bash
ssh -N -L 127.0.0.1:18000:127.0.0.1:8000 lab
```

`-N` 表示不执行远端命令，`-L` 把本地 `127.0.0.1:18000` 转到从 SSH 服务器一侧访问的 `127.0.0.1:8000`。连接保持期间，本机访问 `http://127.0.0.1:18000` 即可。出现 SSH 问题时用 `ssh -v lab` 查看连接阶段，阅读日志时注意隐私信息。

## 20. 配置 Linux 开发环境

### Python：解释器与虚拟环境

本机的 Python 3.12 和 pip 来自 Ubuntu 系统包。为项目安装 Python 库时，使用虚拟环境（virtual environment）隔离依赖，避免把项目需要的包直接写进系统 Python。Ubuntu 的系统 Python 通常受外部包管理机制保护，遇到 `externally-managed-environment` 时应创建虚拟环境。[^python-managed]

本机尚未安装 venv 支持包，第一次需要：

```bash
sudo apt update
sudo apt install python3-venv

mkdir -p ~/projects/python-demo
cd ~/projects/python-demo
python3 -m venv .venv
source .venv/bin/activate

python --version
python -m pip --version
python -c 'import sys; print(sys.executable)'
```

激活后，PATH 中会优先使用 `.venv/bin` 的解释器，提示符通常也显示环境名。`python -m pip` 确保 pip 属于当前这个 Python，比仅输入 `pip` 更容易检查解释器对应关系。[^python-venv]

```bash
python -m pip install requests
python -m pip freeze > requirements.txt
```

`pip freeze` 记录当前环境中安装的版本，适合简单学习项目的环境记录；它不等同于所有平台通用的完整锁文件。已有项目优先遵循项目自己的 `pyproject.toml`、锁文件或安装说明。用 `python -m pip install -r requirements.txt` 可安装记录中的依赖。

```bash
deactivate
./.venv/bin/python -c 'print("run without activation")'
```

激活只是调整当前 Shell 的环境，直接指定虚拟环境解释器也可以运行。虚拟环境本身不适合跨 Windows/Linux 复制，也不适合整体搬到不同路径；保留依赖说明后在新位置重新创建。`.venv` 通常加入项目的 `.gitignore`。

如果要安装可独立使用的 Python 命令行工具，可以了解 pipx，它会为工具创建隔离环境。项目库、系统 Python 和独立命令行工具分别管理，不需要用 `sudo pip install` 或强制绕过系统保护来完成普通开发。

### C/C++：编译、运行与调试

本机已经安装 GCC/G++、Make 和 GDB，可以直接创建一个小项目：

```bash
mkdir -p ~/projects/c-demo
cd ~/projects/c-demo
cat > main.c <<'EOF'
#include <stdio.h>

int main(void) {
    puts("Hello, Linux!");
    return 0;
}
EOF

gcc -Wall -Wextra -g -O0 main.c -o main
./main
file main
```

`-Wall -Wextra` 启用常用告警，`-g` 生成调试信息，`-O0` 关闭优化以便学习调试，`-o` 指定输出文件。`./main` 指向当前目录中的程序，当前目录默认通常不在 PATH 中，所以仅输入 `main` 不一定能找到它。

`g++` 用于 C++ 编译，并按需要链接 C++ 标准库。多个源文件可以一起传给编译器，工程变大后使用 Make 或 CMake 管理依赖与构建步骤。

在这个 `c-demo` 目录中，最简单的 `Makefile` 可以写成：

```makefile
CC := gcc
CFLAGS := -Wall -Wextra -g -O0

.PHONY: all clean
all: main

main: main.c
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -f -- main
```

配方行开头必须是实际 Tab，不能直接用几个空格替代。`main: main.c` 表示目标依赖源文件，当目标不存在或依赖更新后，Make 执行配方。`$<` 是第一个依赖，`$@` 是目标名，二者属于 Make 的变量。`.PHONY` 标记不对应实际文件的目标。

```bash
make
./main
make clean
```

`make clean` 的作用完全由 Makefile 的配方决定；这里仅删除生成的 `main` 程序，再次 `make` 可以重建。Make 并不会自动知道一个项目的清理范围，因此在陌生工程中先看对应目标。

前面如果执行了 `make clean`，先重新构建程序，再进入调试器：

```bash
make
gdb ./main
```

在 GDB 中输入 `break main` 设置断点，`run` 启动，`next` 执行下一行并跨过函数调用，`step` 尝试进入函数，`print 变量名` 查看值，`backtrace` 看调用栈，`continue` 继续，`quit` 退出。程序发生错误时，带调试信息的构建更容易定位源代码位置。

如果继续在这个单文件工程中学习 CMake，可以把下面内容保存为 `CMakeLists.txt`：

```cmake
cmake_minimum_required(VERSION 3.16)
project(linux_demo LANGUAGES C)

add_executable(main main.c)
target_compile_options(main PRIVATE -Wall -Wextra)
```

然后按需要安装 CMake，并把产物放到单独构建目录：

```bash
sudo apt install cmake
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build --parallel 4
./build/main
```

`-S` 指定源码目录，`-B` 指定构建目录，先生成构建规则再执行构建。这里的默认单配置构建方式用 `Debug` 获取调试构建；其他生成器与项目可能有自己的配置方法。`--parallel 4` 是可调整的示例；本机虽有 22 个逻辑 CPU，实际并行数量仍受编译任务和内存限制，不必每次占满。

### Node.js：先确定命令来自哪里

本机目前能找到 Windows npm/pnpm，却找不到 Linux 的 `node`。开始 Linux Node 项目前先检查：

```bash
type -a node nodejs node.exe npm pnpm
command -v node
command -v npm
```

`node.exe` 如果存在，是 Windows 程序；`/usr/bin/node` 或 Linux 用户目录中的 Node 则属于 Linux 环境。Windows 的包管理脚本可能调用 Windows Node，即使命令是在 Ubuntu 终端输入的，也不能据此认为依赖安装在 Linux 工具链中完成。

若系统仓库候选版本满足学习项目要求，可以使用：

```bash
apt-cache policy nodejs npm
sudo apt install nodejs npm
hash -r
type -a node npm
node --version
npm --version
```

APT 提供的版本跟随发行版仓库，不保证满足所有新项目的 Node 最低版本。项目若指定了另一个版本，应按其官方说明在 Linux 侧使用合适的版本管理方案，并重新确认 PATH。安装命令成功后，仍应核对 `node` 和 `npm` 都来自 Linux 路径。

一个简单学习项目可以执行：

```bash
mkdir -p ~/projects/node-demo
cd ~/projects/node-demo
npm init -y
printf 'console.log("Hello from Linux Node.js");\n' > index.js
node index.js
```

已有工程优先使用它规定的包管理器与锁文件。例如存在 `package-lock.json` 且希望按锁文件进行干净安装时，可用 `npm ci`；pnpm 项目则按其版本要求配置 Linux 侧 pnpm。不要在同一个工作目录中轮流用 Windows 与 Linux 工具重建同一份 `node_modules`，其中可能包含平台相关二进制和脚本。

### 编辑器与远程开发

如果使用 VS Code 的 WSL 连接方式，应让编辑器明确连接到对应发行版，并在 Linux 侧选择解释器与终端。Windows 文件夹与 WSL 文件夹都能编辑，但实际执行环境由所选连接、终端和工具路径共同决定。

判断一个工程的环境时，连续确认 `pwd`、`command -v 工具`、工具版本和依赖位置。这样能够回答“代码在哪、谁在运行它、用的是哪一套依赖”，比只看终端标签页名称更准确。

## 21. 用 Git 保存项目变化

Git 记录文件内容的版本。本机已经安装 Git，日常 Linux 开发中可以用它保存代码和配置变化。一个工程通常包含工作区、暂存区和提交历史：编辑先改变工作区，`git add` 选择要进入下一次提交的内容，`git commit` 把暂存区内容保存成一个版本。[^git]

### 初始化与第一次提交

在一个新的学习工程中操作：

```bash
mkdir -p ~/projects/git-demo
cd ~/projects/git-demo
git init

# 仅为这个学习仓库设置示例身份
git config user.name 'Linux Learner'
git config user.email 'learner@example.invalid'

printf '# Git demo\n' > README.md
git status
git add README.md
git diff --cached
git commit -m 'Add README'
```

Git 身份记录在提交中，实际项目应填写自己的合适信息。没有 `--global` 的配置只作用于当前仓库，适合练习时避免改变其他项目。

```bash
printf '\nLearning Linux commands.\n' >> README.md
git diff
git add README.md
git diff --cached
git commit -m 'Describe learning goal'
git log --oneline -5
```

`git diff` 查看工作区相对暂存区的变化，`git diff --cached` 查看暂存区相对最近提交的变化，`git status` 查看整体状态。提交前只暂存实际要保存的文件，可以避免把无关修改和生成物混进去。

### 忽略生成物与查看分支

`.gitignore` 用于排除尚未被跟踪的文件，例如 `.venv/`、`node_modules/`、构建输出和缓存。已经被 Git 跟踪的文件不会因为后来加入忽略规则就自动停止跟踪。令牌、密码和私钥应避免进入提交历史。

```bash
git switch -c experiment
git branch
```

`switch -c` 创建并切换分支，便于保存不同方向的修改。合并前先确认工作区状态和分支目标。远端仓库需要另行配置，`git remote -v` 查看地址，`git fetch` 获取远端记录，`git pull` 在获取后还会整合变化，整合方式由参数和配置决定。

### 撤回操作的范围

```bash
# 把指定文件从暂存区撤回，保留工作区内容
git restore --staged README.md

# 只有确认要丢弃该文件的未暂存修改时才执行
git restore README.md
```

第二条会丢弃指定范围的工作区修改。已经共享出去的提交需要撤销时，`git revert 提交号` 创建一个反向提交并保留历史。`reset --hard`、清理未跟踪文件等操作有更大的丢失范围，学习时应先看清命令作用，不把它们当成常规“修复仓库”步骤。

Git 版本记录主要覆盖提交中的文件内容，不包含运行中的进程、完整虚拟环境和整个系统状态。工程版本控制与第 17 节的备份解决不同范围的恢复需求。

## 22. 编写与运行 Bash 脚本

### 最小脚本与运行方式

脚本把多条命令保存为可重复执行的流程。先建立本机练习脚本目录：

```bash
mkdir -p ~/linux-lab/scripts
cat > ~/linux-lab/scripts/hello.sh <<'EOF'
#!/usr/bin/env bash
printf 'Hello, %s!\n' "${1:-Linux}"
EOF

bash ~/linux-lab/scripts/hello.sh
bash ~/linux-lab/scripts/hello.sh 'WSL learner'
chmod u+x ~/linux-lab/scripts/hello.sh
~/linux-lab/scripts/hello.sh 'Bash learner'
```

首行 `#!` 是 shebang，直接执行脚本时用于选择解释器；`/usr/bin/env bash` 在 PATH 中寻找 Bash。用 `bash script.sh` 时，解释器由命令中的 Bash 指定，文件不必有执行权限，但必须能被读取。直接执行则需要执行权限和有效解释器。

`$1` 是第一个位置参数，`${1:-Linux}` 在参数没有设置或为空时使用默认值。`$0` 通常是脚本调用名，`$#` 是位置参数数量，`"$@"` 可以把所有参数按原有边界传给另一个命令。

### 条件、循环、函数与数组

```bash
if [[ -f "$HOME/linux-lab/files/hello.txt" ]]; then
    printf 'file exists\n'
else
    printf 'file is absent\n'
fi

for name in red green blue; do
    printf '%s\n' "$name"
done

greet() {
    local person=${1:-friend}
    printf 'Hello, %s\n' "$person"
}
greet 'Linux learner'

files=('hello.txt' 'my notes.txt')
printf '%s\n' "${files[@]}"
```

`[[ ... ]]` 是 Bash 条件结构，`-f` 判断普通文件、`-d` 判断目录、`-r` 判断可读、`-x` 判断可执行或目录搜索权限。字符串比较与整数比较要区分，例如 `[[ "$a" == "$b" ]]` 比较字符串，`(( count > 3 ))` 做整数判断。

数组可以保留包含空格的多个参数，`"${files[@]}"` 逐个展开元素。函数中的 `local` 限定变量作用范围。这里使用的是 Bash 语法，不保证在 `sh` 中可用；Ubuntu 的 `/bin/sh` 通常不是 Bash，因此这类脚本不要用 `sh script.sh` 启动。

### 读取文本与处理文件名

逐行读取文件：

```bash
while IFS= read -r line || [[ -n "$line" ]]; do
    printf 'line: %s\n' "$line"
done < ~/linux-lab/files/hello.txt
```

`IFS=` 避免把行首尾空白当作分隔符处理，`read -r` 保留反斜杠；额外条件保留没有以换行结束的最后一行。输入重定向放在循环后面，让循环直接从文件读取。

遍历一个目录中的 `.txt` 文件时：

```bash
data_dir="$HOME/linux-lab/files"
for file in "$data_dir"/*.txt; do
    [[ -f "$file" ]] || continue
    printf 'file: %s\n' "$file"
    wc -l -- "$file"
done
```

引用变量而保留模式中的 `*`，让 Bash 对目标目录做文件名展开。`[[ -f ... ]]` 也处理了没有匹配时模式保留原样的情况。需要递归或处理任意文件名时，可以回到 `find -exec` 或空字符分隔的方法。

### 一个可复用的目录报告脚本

```bash
cat > ~/linux-lab/scripts/report.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

data_dir=${1:-"$HOME/linux-lab/files"}

if [[ ! -d "$data_dir" ]]; then
    printf 'Not a directory: %s\n' "$data_dir" >&2
    exit 1
fi

printf 'Time: %s\n' "$(date -Is)"
printf 'Directory: %s\n' "$data_dir"
printf '\nDisk usage:\n'
du -sh -- "$data_dir"
printf '\nText file line counts:\n'
find "$data_dir" -type f -name '*.txt' -exec wc -l -- {} +
EOF

chmod u+x ~/linux-lab/scripts/report.sh
~/linux-lab/scripts/report.sh
```

`set -u` 把未设置变量的展开视为错误，`pipefail` 保留管道失败，`-e` 在一定条件下遇到命令失败会退出。`-e` 在条件判断、逻辑列表等上下文中有例外，不能把它视为自动覆盖全部错误的机制；预期可能失败的命令应显式用 `if` 等结构处理。

把报告保存起来：

```bash
mkdir -p ~/linux-lab/reports
~/linux-lab/scripts/report.sh > ~/linux-lab/reports/latest.txt
less ~/linux-lab/reports/latest.txt
```

报告脚本只读取目标目录，而保存报告的命令会覆盖 `latest.txt`。需要保留历史时，可以把当前日期时间放入文件名。进一步的脚本可以用 `trap` 在退出时清理它自己创建的临时文件，临时目录可用 `mktemp -d` 获取；清理范围应由创建时的明确路径决定。

### 排查脚本执行问题

`bash -n script.sh` 可在不执行脚本正文的情况下检查 Bash 语法，`bash -x script.sh` 会真正执行并打印展开后的命令，后者可能暴露密码或令牌。本文没有自动运行这些检查；学习时按需要手动使用。

如果出现 `/usr/bin/env: 'bash\r': No such file or directory`，检查脚本是否使用了 Windows CRLF 换行。用 `file script.sh` 查看，编辑器中改成 LF，或在确认对象后使用转换工具。执行脚本前还要核对当前目录、参数与会被写入的文件。

## 23. 定时任务：cron 与 systemd timer

### cron 的时间表达式

cron 定期执行命令，用户可以通过 `crontab -e` 编辑自己的任务表，`crontab -l` 查看。时间规则由五个字段组成：分钟、小时、日期、月份、星期，后面接命令。

```text
30 9 * * * /home/bts/linux-lab/scripts/report.sh >> /home/bts/linux-lab/reports/daily.log 2>&1
```

这表示每天 09:30 按系统时区运行报告，追加 stdout 与 stderr 到日志。编辑前需确认脚本可执行、目录已存在，并检查实际时区。需要以北京时间运行时，先明确系统时区或所用调度器的时区设置。

| 前五字段 | 含义 |
| --- | --- |
| `*/15 * * * *` | 每小时的 0、15、30、45 分钟 |
| `0 8 * * 1-5` | 周一至周五 08:00 |
| `0 0 1 * *` | 每月 1 日 00:00 |

字段中的 `*` 表示任意值，`*/15` 是步长。如果日期与星期字段都写了限制，常见 cron 实现的匹配规则可能是满足其中一项就运行，使用复杂日期规则时应查本机 `man 5 crontab`。

cron 的环境通常比交互终端少，工作目录和 PATH 也不应靠猜测。使用绝对路径，在脚本内明确工作目录，并把错误写入日志。用户 crontab 与 `/etc/crontab` 的格式有区别，后者还含执行用户字段。

WSL 没有启动时，普通 cron 任务也不会在 Linux 内执行；错过的时间通常不会自动补跑。需要 Windows 在特定时间主动启动 WSL 时，应另外考虑 Windows 任务计划程序。

### systemd timer 与服务配对

timer 负责触发，service 负责实际执行。下面给出使用已有报告脚本的用户级示例，只有准备启用定时任务时才需要创建这些文件。

`~/.config/systemd/user/linux-report.service`：

```ini
[Unit]
Description=Generate a Linux learning directory report

[Service]
Type=oneshot
ExecStart=/home/bts/linux-lab/scripts/report.sh
```

`~/.config/systemd/user/linux-report.timer`：

```ini
[Unit]
Description=Run the Linux learning report daily

[Timer]
OnCalendar=*-*-* 09:30:00
Persistent=true

[Install]
WantedBy=timers.target
```

这是本机用户 `bts` 的路径示例，换账户时要替换。使用前创建父目录并保存文件，在支持用户服务的会话中执行：

```bash
systemctl --user daemon-reload
systemctl --user enable --now linux-report.timer
systemctl --user list-timers
journalctl --user -u linux-report.service
```

服务输出默认可以在日志中查看。`Persistent=true` 让日历定时器重新激活时补触发一次错过的执行，不是逐次重放所有错过时刻，也不会替你启动已经关闭的 WSL。用户管理器何时存在取决于登录会话与配置；长期服务器任务还需要考虑系统级服务与用户管理器的生命周期。

不再需要这项练习任务时，用 `systemctl --user disable --now linux-report.timer` 停止并取消自动启用。只编辑单元文件却不加载和启用，不会产生实际调度。

## 24. 容器的基本概念与学习边界

容器把应用进程、依赖和部分系统资源视图隔离起来，常用于按指定环境运行项目。镜像是创建环境的模板，容器是基于镜像启动的实例，卷或绑定挂载用于保存和共享数据。

容器通常共享所在 Linux 环境的内核，用户空间可以不同，因此容器中的 `/etc/os-release` 可能与 WSL Ubuntu 不同。虚拟机则有独立的虚拟硬件和内核；两者不是同一种运行层级。

本机当前没有找到 `docker` 命令。本篇不替你选择或安装 Docker Desktop、WSL 内 Docker Engine 或其他容器方案，先掌握前面的目录、权限、网络和进程知识即可。以后按照项目要求配置并确认容器运行服务可用后，可以练习：

```bash
docker version
docker run --rm hello-world
docker ps
docker ps -a
docker images
```

`run` 创建并运行容器，镜像本地没有时可能需要下载；`--rm` 在运行结束后移除容器实例。`ps` 默认只列出运行中的容器，`ps -a` 也包含停止的实例。

容器内部可写层通常随着容器删除而消失，重要结果需要挂载或复制出来。端口发布如 `-p 127.0.0.1:8080:80` 把本机回环地址上的 8080 转发到容器 80；省略绑定地址可能向更多接口发布。挂载主机目录后，容器中的写入也可能改变主机文件。

使用传统具有高权限的 Docker daemon 时，获得其控制权限的人通常也能对主机产生较大影响。应理解 daemon、rootless 模式和所挂载目录的权限范围，再决定哪些用户、工程或镜像可以操作它。[^docker-security]

## 25. 从空目录完成一套 Linux 工作流程

这套练习把目录、文本、脚本、版本控制、备份和本地网络连起来。大部分步骤使用本机已有工具；可选 Python 虚拟环境步骤需要先安装 `python3-venv`。

### 第一步：创建一个独立工程

在同一个 Ubuntu 终端连续执行，使用 `mktemp` 避免覆盖已有目录：

```bash
workshop_dir=$(mktemp -d "$HOME/linux-workshop.XXXXXX")
cd "$workshop_dir"
mkdir data scripts reports site
printf 'Workshop directory: %s\n' "$workshop_dir"
pwd
```

把输出的路径记下来。`workshop_dir` 是当前 Shell 的变量，新终端中不会自动存在；继续练习时可以按记录重新 `cd` 到该路径。

### 第二步：创建并分析数据

```bash
cat > data/results.txt <<'EOF'
alpha 12
beta 7
gamma 19
beta 8
EOF

cat data/results.txt
grep -n '^beta ' data/results.txt
sort -k2,2n data/results.txt
awk '{sum += $2} END {print "total:", sum}' data/results.txt
```

应看到两行 beta，按第二列排序后的数值依次为 7、8、12、19，总和为 46。这里的实际数据格式是简单空白分列，适合用 awk；没有引号和嵌入空格等复杂表格情况。

### 第三步：把分析写成脚本

```bash
cat > scripts/summarize.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
    printf 'Usage: %s INPUT_FILE\n' "$0" >&2
    exit 2
fi

input_file=$1
if [[ ! -r "$input_file" ]]; then
    printf 'Cannot read: %s\n' "$input_file" >&2
    exit 1
fi

awk '{sum += $2; count++} END {
    print "rows:", count + 0
    print "total:", sum + 0
    if (count > 0) print "average:", sum / count
}' "$input_file"
EOF

chmod u+x scripts/summarize.sh
./scripts/summarize.sh data/results.txt | tee reports/summary.txt
```

应得到 `rows: 4`、`total: 46`、`average: 11.5`。输入文件路径作为参数传入，输出由调用者决定保存在哪里。这个脚本针对本节的简单数据格式，没有做任意输入的格式验证；生产数据处理需要明确字段格式和异常处理规则。

### 第四步：提交源码与输入数据

```bash
git init
git config user.name 'Linux Learner'
git config user.email 'learner@example.invalid'
printf 'reports/\n.venv/\nsite/\n' > .gitignore
git add .gitignore data/results.txt scripts/summarize.sh
git diff --cached
git commit -m 'Add data summary workflow'
git status --short
```

报告是可以重新生成的产物，这里用 `.gitignore` 忽略；源码与输入数据进入版本记录。若报告本身需要归档，则应另行保存或按项目要求跟踪，忽略规则由实际用途决定。

### 第五步：打包保存工程

```bash
workshop_name=${workshop_dir##*/}
tar -czf "$HOME/${workshop_name}-backup.tar.gz" -C "$HOME" "$workshop_name"
tar -tzf "$HOME/${workshop_name}-backup.tar.gz" | head -n 20
```

`${workshop_dir##*/}` 去掉路径直到最后一个斜杠的前缀，取得目录名。归档放在工程目录之外，避免打包时把正在生成的归档也递归加入。内容列表中应包含工程目录、数据与脚本；没有设置排除时，`.git` 和报告也会被打包。

### 第六步：用本地 HTTP 查看结果

```bash
cp reports/summary.txt site/summary.txt
printf 'Linux workshop\n' > site/index.html
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

在另一个终端执行：

```bash
curl http://127.0.0.1:8000/summary.txt
ss -ltn | grep ':8000'
```

第一条应取得报告，第二条应找到监听端口。也可在 Windows 浏览器打开 `http://localhost:8000/summary.txt`。如果 8000 已被别的进程占用，换成 8001，并同步修改访问地址。完成后回到服务终端按 `Ctrl + C`。

### 第七步：可选的 Python 虚拟环境练习

确保已安装 venv 支持包，并回到工程目录：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -c 'import sys; print(sys.executable); print(sys.prefix != sys.base_prefix)'
deactivate
```

解释器路径应位于当前工程的 `.venv` 下，第二项应是 `True`。这个验证不需要安装第三方包。把它与未激活时的 `command -v python3` 比较，就能看到环境选择如何改变。

### 第八步：复盘执行范围

```bash
pwd
find . -maxdepth 2 -type f -not -path './.git/*'
git log --oneline -3
du -sh .
```

完成后，应能自己解释每个目录存放什么、脚本如何接收参数、报告为什么没有进入提交、HTTP 服务监听在哪里，以及备份文件存放在哪。保留这个练习工程便于继续修改，不必为了结束练习立即删除它。

## 26. 常见问题与排查顺序

### command not found

先判断命令名是否正确，再看它是否在 PATH 中：

```bash
type -a command_name
command -v command_name
printf '%s\n' "$PATH" | tr ':' '\n'
```

`command_name` 需要替换成实际命令。有些包名与命令名不同，例如包 `ripgrep` 提供命令 `rg`。刚安装或切换工具后可用 `hash -r` 清掉 Bash 缓存。虚拟环境或版本管理器中的命令可能需要激活对应环境。

针对本机的 Node 情况，先看 `type -a node npm pnpm`，再判断是否混入 Windows 路径。找不到命令时先检查安装和路径，不需要给命令前面加 sudo 来尝试解决。

### No such file or directory

```bash
pwd
ls -la
ls -ld -- /path/to/target
file /path/to/program
```

确认相对路径是从哪里计算的、文件名大小写是否正确、符号链接目标是否存在。程序文件明明存在却报此错误时，还要检查 shebang 解释器是否存在、是否用了 CRLF，或二进制依赖的动态加载器是否缺失。

WSL 中的路径使用 `/mnt/d/...` 这样的 Linux 形式；给 Windows 程序的参数则可能需要 Windows 路径，可用 `wslpath` 转换。文件名中的空格应通过引号保留为一个参数。

### Permission denied

```bash
id
ls -ld -- /path/to/parent
ls -l -- /path/to/file
namei -l /path/to/file
```

`namei -l` 在可用时列出路径各级组件的权限，帮助找到是哪一级目录无法进入。对脚本检查可读和执行权限；对输出文件检查父目录与所有者。Windows 挂载盘还有 Windows 侧权限与挂载规则，Linux 的 chmod 不一定能解决所有访问限制。

如果输出是“文件系统只读”，那是挂载状态问题；如果服务运行在另一个用户下，要检查该账户实际能访问的路径。应对准具体原因调整权限，不把 `chmod -R 777` 作为统一处理方法。

### APT 找不到包、索引失败或被锁定

先看完整错误属于哪种情况：

| 现象 | 首先检查 |
| --- | --- |
| `Unable to locate package` | 包名、是否刷新索引、所需仓库分类是否启用 |
| 无法解析镜像域名 | `getent hosts 镜像域名`、DNS 与代理状态 |
| 连接超时或拒绝 | 网络路径、代理、目标地址与端口 |
| 仓库返回 404 | 发行代号与仓库地址是否对应 |
| 签名或 Release 信息错误 | 完整源配置、签名来源、是否混入错误仓库 |
| 无法获得锁 | 是否有另一个 APT、dpkg 或自动更新进程正在工作 |

锁文件用于防止并发修改包数据库，不应直接删掉锁文件绕过正在运行的包管理进程。先确认已有操作是否还在进行并等待其完成。若此前安装被中断且已没有其他管理进程，可以在理解提示后使用：

```bash
sudo dpkg --configure -a
sudo apt --fix-broken install
```

这两条会完成未配置的软件包或调整依赖，需阅读拟议变更。它们针对安装状态损坏，不是网络错误或包名写错的通用修复。

### Python 提示 externally-managed-environment

为项目创建并使用 `.venv`，不要把库直接写入系统 Python：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip --version
```

如果 venv 创建失败并提示缺少 ensurepip 或 venv 支持，本机应先安装 `python3-venv`。激活后 pip 仍指向系统环境时，用 `python -c 'import sys; print(sys.executable)'` 核对解释器，再检查是不是激活了另一个路径或执行了错误的 pip。

### 服务处于 failed 或系统处于 degraded

```bash
systemctl --failed
systemctl status service_name.service --no-pager -l
sudo journalctl -u service_name.service -b --no-pager -n 100
```

把服务名替换为实际失败单元。本机记录的是 `nvidia-persistenced.service`，进一步判断必须以它的日志和实际功能表现为依据。反复重启、清除 failed 标记，只会改变现象或记录，不一定解决根因。

### 本地网页无法打开或端口被占用

在服务所在环境先执行：

```bash
ss -ltnp
curl --connect-timeout 5 --max-time 10 http://127.0.0.1:8000/
```

确认服务仍在运行、监听端口和地址正确。`Connection refused` 通常指目标没有接受该连接或主动拒绝，超时则可能涉及路由或防火墙。先让 Ubuntu 内访问成功，再检查 Windows 访问；本机配置为镜像模式，还需核对配置是否已加载与 Windows 防火墙规则。

`Address already in use` 表示所需地址和端口已经被占用。通过 `ss` 查出进程，决定保留它、停止自己的旧服务，或改用另一个端口，不要根据端口号随意结束不相关进程。

### 磁盘空间不足

```bash
df -h
df -i
du -h --max-depth=1 "$HOME"
```

先确认写入落在哪个文件系统，再区分空间、inode 和宿主盘剩余容量。项目依赖、构建目录、下载缓存和日志都可能增长。清理应限定到已经识别的可重建产物；用户数据、系统包数据库和虚拟磁盘文件不应按名称猜测后删除。

### 终端显示异常或命令看似没有结束

打开 `less`、`man`、`top` 时通常用 `q` 退出，Vim 使用模式和冒号命令。如果终端出现 `>` 等续行提示，可能是引号、括号或 here-document 尚未结束；不想继续输入时可以按 `Ctrl + C` 取消这一未完成命令。

终端被意外控制字符弄乱时，可尝试 `reset`。若误按 `Ctrl + S` 并且终端启用了软件流控，`Ctrl + Q` 可恢复。长任务没有输出也可能只是正常计算，应在另一个终端中查看进程和资源使用，而不是立即重复启动多份任务。

## 27. 日常命令速查与学习顺序

### 查看 Linux 环境的一般逻辑

先确定要查看的是哪个层次，再选命令。发行版版本、内核版本、当前 Shell、某个工具的版本和系统负载描述的是不同对象。一个终端里同时存在 Bash、APT 和 Windows 程序并不矛盾，关键是分清它们的来源与执行范围。

可以按“运行位置、发行版、内核、身份与 Shell、工具来源、包数据库、资源与服务”的顺序读取信息。前半段建立环境背景，后半段再判断某个问题发生在哪一层。

| 顺序 | 要确认的对象 | 常用只读命令 | 解读要点 |
| --- | --- | --- | --- |
| 1 | 当前所在位置 | `pwd`、`hostname`、`id` | 是否在预期主机、账户和目录；SSH 登录后要重新确认 |
| 2 | 发行版 | `cat /etc/os-release` | 看 `ID`、`VERSION_ID`、`ID_LIKE` 与发行代号 |
| 3 | 内核与架构 | `uname -r`、`uname -m` | 用户空间发行版与内核可以分别更新 |
| 4 | 当前 Shell 与登录默认 Shell | `ps -p $$ -o comm=`、`getent passwd "$(id -un)"` | 当前正在运行的 Shell 与账户默认项要分别确认 |
| 5 | 工具位置与版本 | `type -a 工具`、`command -v 工具`、`工具 --version` | 检查路径，再读版本，识别同名命令和 Windows 混入 |
| 6 | 系统包体系 | 包管理命令、包数据库、发行版信息 | 不仅判断某个管理器是否存在，还要确定谁管理系统包 |
| 7 | 资源、进程与端口 | `free -h`、`df -h`、`ps -ef`、`ss -ltn` | 分清容量、瞬时使用、进程状态与网络监听 |
| 8 | 服务与错误记录 | `systemctl --failed`、`journalctl` | 先确认服务管理器，再查看实际日志 |

#### 从发行版推断包体系，再确认实际命令

`/etc/os-release` 中的 `ID=ubuntu`、`ID_LIKE=debian` 是本机属于 Debian 系列的线索，通常应先检查 APT 与 dpkg。遇到陌生发行版，可以先读这份文件，再查其官方说明，不必把所有管理器都逐个安装一遍。

在 Bash 中列出当前可找到的管理器：

```bash
for manager in apt apt-get dpkg nala dnf rpm pacman apk zypper snap flatpak brew; do
    if command -v "$manager" >/dev/null 2>&1; then
        printf '%-10s %s\n' "$manager" "$(command -v "$manager")"
    fi
done
```

同一系统可能同时有 APT、Snap、pipx 等。确定主系统包管理方式，还应结合数据库和包归属。例如本机有 `/var/lib/dpkg/status`，并且 `dpkg -S /usr/bin/apt` 能查询 APT 程序所属包，这比仅发现一个名为 apt 的可执行文件更有依据。

```bash
test -r /var/lib/dpkg/status && printf 'dpkg database present\n'
dpkg -S /usr/bin/apt
dpkg -l apt bash
apt-cache policy apt bash
```

这些是本机 Debian/Ubuntu 体系的查询方法。在 RPM 系列中改查 `rpm -q`、`rpm -qf 文件`，在 Arch 中改查 `pacman -Q`、`pacman -Qo 文件`。发行版信息提供判断方向，实际数据库与包归属提供进一步确认。

#### 区分默认 Shell、当前 Shell 与已安装的 Bash

在 Bash 终端中执行：

```bash
printf 'SHELL environment: %s\n' "$SHELL"
ps -p $$ -o pid=,comm=,args=
readlink -f "/proc/$$/exe"
getent passwd "$(id -un)" | cut -d: -f7
type -a bash
bash --version | head -n 1
printf 'Current Bash version: %s\n' "$BASH_VERSION"
```

`$SHELL` 通常记录登录默认 Shell，但环境变量可以继承或被修改，单凭它不能保证当前进程就是 Bash。`getent passwd` 的最后一个字段是账户配置的登录 Shell，`ps` 和 `/proc/$$/exe` 则读取当前 Shell 进程的信息。`bash --version` 查将被启动的 Bash 程序版本，`$BASH_VERSION` 查当前 Bash 实例版本；在其他 Shell 中，后一个变量不一定存在。

本机 `/bin/bash` 与解析到的 `/usr/bin/bash` 可以是同一个程序的不同路径。还要注意：在脚本里运行上述查询，看到的是执行该脚本的 Shell；想确认当前交互终端，就直接在那个终端里执行。代码使用 Bash 语法，在 Fish 等 Shell 中需要替换变量与循环写法。

#### 一组日常只读查询

在本机 Ubuntu Bash 中，可逐条使用下面的查询：

```bash
# 环境背景
pwd
hostname
id
cat /etc/os-release
uname -r
uname -m

# Shell 与系统包工具
ps -p $$ -o comm=
command -v bash apt dpkg
bash --version | head -n 1
apt --version

# 资源与当前运行状态
nproc
free -h
df -h /
uptime
ps -u "$USER" -o pid,ppid,stat,etime,cmd
ss -ltn
systemctl --failed --no-pager
```

这些命令用于读取，不会安装包或改变配置；有些状态查询会用非零退出码表示特殊状态，仍要阅读输出。如果系统没有 systemd，就按它实际的服务管理方式查询。系统信息汇总工具可以改善展示，但应在了解这些基础来源后再使用，避免把汇总屏幕当成唯一事实来源。

### 常用命令速查

| 目标 | 命令示例 |
| --- | --- |
| 查看发行版与内核 | `cat /etc/os-release`、`uname -r` |
| 查看身份 | `id`、`whoami` |
| 查看当前位置 | `pwd` |
| 返回家目录或上次目录 | `cd ~`、`cd -` |
| 显示文件与隐藏项 | `ls -lah` |
| 创建目录或空文件 | `mkdir -p dir`、`touch file` |
| 复制、改名 | `cp -i source target`、`mv -i source target` |
| 查看长文本 | `less file` |
| 编辑文本 | `nano file`、`vim file` |
| 看日志末尾 | `tail -n 50 logfile` |
| 搜索文本 | `grep -n 'pattern' file`、安装后 `rg 'pattern' dir` |
| 查找文件 | `find dir -type f -name '*.txt'` |
| 比较文件 | `diff -u old new` |
| 查看命令来源 | `type -a command`、`command -v command` |
| 查看帮助 | `command --help`、`man command`、`help builtin` |
| 更新索引、安装包 | `sudo apt update`、`sudo apt install package` |
| 查看候选包版本 | `apt-cache policy package` |
| 查看进程 | `ps -ef`、`top` |
| 结束明确的进程 | `kill -TERM PID` |
| 进入终端会话 | `tmux new -s name`、`tmux attach -t name` |
| 查看失败服务 | `systemctl --failed` |
| 查看服务日志 | `journalctl -u service -b` |
| 查看内存与磁盘 | `free -h`、`df -h`、`du -sh dir` |
| 查看端口 | `ss -ltn`、`sudo ss -ltnp` |
| 请求网页 | `curl -I URL` |
| 远程登录 | `ssh user@host` |
| 打包与解包 | `tar -czf out.tar.gz dir`、`tar -xzf out.tar.gz` |
| 预演同步 | `rsync -av --dry-run source/ target/` |
| 创建 Python 环境 | `python3 -m venv .venv` |
| 激活 Python 环境 | `source .venv/bin/activate` |
| 查看 Git 改动 | `git status`、`git diff`、`git diff --cached` |
| 运行 Bash 脚本 | `bash script.sh arg` |

速查表中的文件、命令名、包名和 PID 是占位示例，按实际对象替换。第一次执行某个写入或删除操作时，回到对应章节确认覆盖和作用范围。

### 按可完成的任务推进

第一阶段，练到能从 Windows 进入 Ubuntu，自己创建目录、写文件、复制、改名、查看和编辑，并能用 `pwd` 解释相对路径。第 3～7 节与综合练习前两步足以支持这个阶段。

第二阶段，练到能解释引号、变量、重定向和管道，并能用 grep、find、awk 得到需要的结果。不要只记“这条命令能输出答案”，要能说明谁在解析参数、输入从哪里来、输出到哪里去。

第三阶段，练到能为真实工程安装系统依赖、建立独立 Python 环境或检查 Node 路径，用 Git 保留变化。优先使用本机已有工具，需要什么再安装什么，每次都确认执行程序与依赖属于同一环境。

第四阶段，练到能查看进程、端口和服务日志，处理常见错误，写一个接受参数的脚本，并完成备份与恢复到独立目录。之后再继续学习定时任务、SSH、容器与服务器部署。

每次遇到一条陌生命令，可以核对四件事：当前目录与执行账户、命令实际路径、输入与输出对象、退出状态和日志。把这四项与手册联系起来，就能在新发行版或远程服务器上逐步独立工作。

## 28. 常用软件的安装与使用

这些工具分别改善交互、编辑、搜索、浏览和诊断。可以按实际需求逐个添加；先知道原有命令的用途，再使用增强工具，遇到没有个人配置的远程服务器时仍能继续工作。

### 从用途选择安装组合

以下候选版本来自 2026-10-13 读取的本机 APT 索引，查询索引本身没有安装软件。重新执行 `sudo apt update` 后，候选版本可能变化。

| 用途 | 软件包名 | 实际常用命令 | 当前仓库候选版本 |
| --- | --- | --- | --- |
| 交互 Shell | `zsh` | `zsh` | `5.9` 系列 |
| 终端编辑器 | `neovim` | `nvim` | `0.9.5` 系列 |
| 按内容搜索 | `ripgrep` | `rg` | `14.1.0` 系列 |
| 按文件名查找 | `fd-find` | `fdfind` | `9.0.0` 系列 |
| 模糊选择 | `fzf` | `fzf` | `0.44.1` 系列 |
| 带高亮查看文件 | `bat` | 本机仓库包通常为 `batcat` | `0.24.0` 系列 |
| 目录列表增强 | `eza` | `eza` | `0.18.2` 系列 |
| 常用目录跳转 | `zoxide` | 初始化后使用 `z` | `0.9.3` 系列 |
| 资源查看 | `htop` / `btop` | `htop` / `btop` | `3.3.0` / `1.3.0` 系列 |
| JSON 处理 | `jq` | `jq` | `1.7.1` 系列 |
| 目录树 | `tree` | `tree` | `2.1.1` 系列 |
| Shell 静态检查 | `shellcheck` | `shellcheck` | `0.9.0` 系列 |
| Git 差异查看 | `git-delta` | `delta` | `0.16.5` 系列 |

可以分成几组安装，挑自己需要的组执行：

```bash
sudo apt update

# 先选择交互 Shell 与编辑器
sudo apt install zsh neovim

# 文件搜索与浏览
sudo apt install ripgrep fd-find fzf bat eza tree

# 状态查看与结构化文本
sudo apt install htop jq

# 有需要时再添加
sudo apt install zoxide btop shellcheck git-delta
```

`htop` 与 `btop` 用途接近，可以先选一个。安装后先用 `command -v`、`--version` 或对应帮助确认命令名字与位置，再添加个人配置。下面的每项教程也可以单独使用，不依赖先把全部工具装齐。

### Zsh：安装、试用与默认 Shell

#### 安装后先进入一个试用会话

```bash
sudo apt install zsh
command -v zsh
zsh --version
zsh
```

最后一条从当前 Bash 启动一个 Zsh 子会话。第一次可能出现配置向导，可以按屏幕说明设置，也可以暂时退出，按下文手动建立配置。输入 `exit` 回到原来的 Bash；这一试用步骤不改变账户的默认 Shell。

在 Zsh 会话中，用 `printf '%s\n' "$ZSH_VERSION"` 查看当前实例版本。Zsh 与 Bash 都支持许多常见交互语法，但默认行为存在差异，例如没有匹配项的通配符处理、数组和部分展开规则。前面使用 Bash 的脚本仍按 shebang 或 `bash script.sh` 运行，不需要因为交互 Shell 改为 Zsh 就改写脚本。

#### 建立可理解的最小配置

Zsh 的交互配置通常是 `~/.zshrc`；登录配置还有 `~/.zprofile` 等文件。若设置了 `ZDOTDIR`，配置位置会改变。`.bashrc` 属于 Bash，不应把整份 Bash 配置直接 source 到 Zsh。[^zsh-config]

先用 `ls -la ~/.zshrc` 确认是否已有配置。存在时备份并编辑需要的部分，例如：

```bash
cp -a ~/.zshrc "$HOME/.zshrc.backup-$(date +%Y%m%d-%H%M%S)"
nano ~/.zshrc
```

没有配置时，直接用 `nano ~/.zshrc` 新建即可。可以从下面这份小配置开始：

```zsh
# 标准补全系统
autoload -Uz compinit
compinit

# 历史记录
HISTFILE="$HOME/.zsh_history"
HISTSIZE=10000
SAVEHIST=10000
setopt HIST_IGNORE_DUPS
setopt SHARE_HISTORY

# 使用 Emacs 风格的命令行编辑按键
bindkey -e

# 简单提示符和常用别名
PROMPT='%n@%m:%~%# '
alias ll='ls -lah'
```

`HISTSIZE` 控制会话中保留的历史数量，`SAVEHIST` 控制保存到文件的数量；`SHARE_HISTORY` 让多个 Zsh 会话共享历史。历史会写入命令内容，密码和令牌应通过合适的输入方式提供。

配置保存后，在 Zsh 中执行 `source ~/.zshrc`，或新开 Zsh 会话。按 Tab 试补全路径，用 `Ctrl + R` 搜索历史。提示符的 `%n`、`%m`、`%~` 分别显示用户、主机和目录，这些是 Zsh 的提示符语法。

#### 加入历史建议与语法高亮

Ubuntu 仓库中有两个常用插件：

```bash
sudo apt install zsh-autosuggestions zsh-syntax-highlighting
dpkg -L zsh-autosuggestions
dpkg -L zsh-syntax-highlighting
```

先确认插件文件的实际路径。常见安装位置对应的加载配置如下，可放在 `~/.zshrc` 的尾部；有其他按键插件时，将语法高亮放在它们之后：

```zsh
if [[ -r /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh ]]; then
    source /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh
fi

if [[ -r /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ]]; then
    source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
fi
```

autosuggestions 根据历史等信息给出建议，通常在光标位于行尾时按右方向键接受；具体绑定以当前配置为准。syntax-highlighting 在输入时标记命令、路径与语法，它帮助观察输入，但不能保证命令执行成功或作用范围安全。[^zsh-plugins]

Oh My Zsh 是组织主题与插件的框架，Zsh 不依赖它才能使用。上面的配置已经具备补全、历史和两个插件；想使用框架时再按其官方说明配置，并避免让框架与手动配置重复加载同一插件。

#### 确认后更改默认 Shell，或恢复 Bash

试用满意后，在普通用户账户下执行：

```bash
command -v zsh
cat /etc/shells
chsh -s "$(command -v zsh)"
getent passwd "$(id -un)" | cut -d: -f7
```

更改目标需要属于系统允许的 Shell，通常在 `/etc/shells` 中列出；`chsh` 可能要求输入账户密码。新开 Ubuntu 登录会话后再用 `ps -p $$ -o comm=` 确认，当前已经打开的 Shell 不会自动变成 Zsh。如果 Windows Terminal 的启动命令显式指定了 `bash`，还需要检查该配置，账户默认项不会覆盖显式启动的程序。

恢复登录默认 Shell：

```bash
chsh -s /bin/bash
```

修改 `.zshrc` 出错时，可以先启动 `zsh -f` 跳过用户启动配置，再用编辑器修正文件；也可以从 Bash 中编辑。保留 Bash 程序和原有配置，日常 Zsh 与 Bash 脚本可以并存。

### Neovim：安装、编辑与最小 Lua 配置

#### 先用仓库版学习基本编辑

```bash
sudo apt install neovim
type -a nvim
nvim --version
nvim ~/linux-lab/files/hello.txt
```

如果没有做前面的练习，就换成自己的文本文件；新路径的父目录需要先存在。Ubuntu 24.04 当前仓库候选是 Neovim `0.9.5`，足以学习基本编辑和下面的最小 Lua 配置，但不一定满足最新插件套件的要求。

Neovim 延续 Vim 的模式操作：普通模式用于移动和发出编辑命令，插入模式输入文本，可视模式选择文本，冒号命令执行保存、分屏等操作。先用 `i` 输入，Esc 返回普通模式，再输入 `:wq` 保存退出。

| 按键或命令 | 基本用途 |
| --- | --- |
| `h j k l` | 左、下、上、右移动 |
| `w` / `b` | 到下一个、上一个单词开头 |
| `0` / `$` | 行首、行尾 |
| `gg` / `G` | 文件开头、结尾 |
| `i` / `a` | 在光标前、后进入插入模式 |
| `o` | 在下方新开一行并输入 |
| `dd` / `yy` / `p` | 删除当前行、复制当前行、粘贴 |
| `u` / `Ctrl + R` | 撤销、重做 |
| `v` / `V` | 按字符、按行选择 |
| `/内容`、`n`、`N` | 搜索、下一个、上一个匹配 |
| `:w`、`:q`、`:wq` | 保存、退出、保存退出 |
| `:q!` | 放弃当前缓冲区未保存修改并退出窗口 |

模式命令可以组合，例如 `3dd` 删除三行，`ciw` 更改光标所在单词，`dw` 删除到下一个单词位置。先在练习文件上操作，再逐步理解“次数、动作、文本对象”的组合规则。

在 Neovim 中用 `:Tutor` 打开教程，`:help` 查看内置帮助，`:help user-manual` 阅读用户手册；`:help lua-guide` 的可用内容以安装版本为准。在线文档往往跟随较新版本，查版本相关行为时优先看本机帮助。

#### 理解缓冲区、窗口与标签页

缓冲区（buffer）保存正在编辑的文件内容；窗口（window）显示一个缓冲区；标签页（tabpage）组织一组窗口。同一个缓冲区可以在多个窗口中显示，切换窗口不会自动生成一个新文件副本。

```vim
:edit another.txt
:ls
:bnext
:bprevious
:split
:vsplit
:tabnew
```

这些命令在 Neovim 内输入。`:ls` 查看缓冲区，`:bnext` / `:bprevious` 切换；`:split` 上下分屏，`:vsplit` 左右分屏。`Ctrl + W` 后按 `h/j/k/l` 切换窗口；`:q` 关闭当前窗口，`:qa` 请求退出所有窗口，存在未保存修改时会提示。

`:terminal` 打开终端缓冲区，在终端输入模式下按 `Ctrl + \`，再按 `Ctrl + N` 回到普通模式。终端里的任务仍是实际进程，退出编辑器前应确认它是否还在工作。

#### 配置位置与最小 init.lua

默认情况下，Linux 配置目录是 `~/.config/nvim`，Lua 入口文件是 `init.lua`；环境变量可以改变标准目录，在 Neovim 中执行下面命令确认实际路径：

```vim
:lua print(vim.fn.stdpath('config'))
```

若已经存在 `init.vim`、`init.lua` 或整套配置，先备份，按原结构修改，不要直接覆盖。第一次新建配置时，可以在 Ubuntu 中执行：

```bash
mkdir -p ~/.config/nvim
nano ~/.config/nvim/init.lua
```

保存以下内容：

```lua
vim.g.mapleader = ' '

vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.termguicolors = true
vim.opt.mouse = 'a'
vim.opt.expandtab = true
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.smartindent = true
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.splitright = true
vim.opt.splitbelow = true

vim.keymap.set('n', '<leader>w', '<cmd>write<cr>', { desc = 'Save file' })
vim.keymap.set('n', '<leader>h', '<cmd>nohlsearch<cr>', { desc = 'Clear search highlight' })
```

这份配置只使用基础选项和映射，没有插件安装步骤。行号和相对行号便于移动，`ignorecase` 与 `smartcase` 让搜索在模式包含大写字母时区分大小写；普通模式下先按空格再按 `w` 保存。配置把默认缩进设为四个空格，但工程应按自己的文件类型与格式规则设置，Makefile 配方仍要求 Tab。[^nvim-config]

保存后重新启动 Neovim。配置报错时用 `:messages` 读错误，或用 `nvim --clean 文件名` 启动不加载个人配置的会话，区分问题来自配置还是程序与文件。

#### 剪贴板、诊断与插件

`yy` 复制到的是编辑器寄存器，不一定直接进入 Windows 系统剪贴板。系统剪贴板通常使用 `"+y`、`"+p`，前提是有可用的 clipboard provider。用 `:checkhealth` 查看当前检测结果，根据所用 WSLg/终端环境选择 `wl-clipboard`、`xclip` 或兼容 WSL 的提供程序，再决定是否设置 `vim.opt.clipboard = 'unnamedplus'`。

语言服务器负责补全、跳转与诊断，编辑器的 LSP 客户端负责与它连接；插件管理器负责获取与加载插件。安装 Neovim 本身并不会自动安装所有语言服务器和插件依赖。

截至本次查询，LazyVim 官方要求 Neovim `>= 0.11.2`，因此不能把 Ubuntu 仓库的 `0.9.5` 直接用于当前 LazyVim 配置。需要插件套件时，先核对它的最低版本、安装方式与依赖，再更新编辑器。[^lazyvim-version]

#### 需要新版本时使用独立的上游安装

本机为 `x86_64`，Neovim 官方提供对应 Linux 预编译归档。先打开官方发布页确定稳定版本和资产名称，保留下载来源与版本信息；仓库版也可以继续保留。下面采用家目录中的独立安装位置：[^nvim-install]

```bash
mkdir -p ~/Downloads ~/.local/opt ~/.local/bin
curl -fL --retry 3 \
  -o ~/Downloads/nvim-linux-x86_64.tar.gz \
  https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz
tar -tzf ~/Downloads/nvim-linux-x86_64.tar.gz | head -n 20
```

确认归档内容，并确认 `~/.local/opt/nvim-linux-x86_64` 尚未用于已有安装后，再解包。已有安装需要先保留旧版本，不能直接假定覆盖不会影响当前配置。

```bash
tar -xzf ~/Downloads/nvim-linux-x86_64.tar.gz -C ~/.local/opt
~/.local/opt/nvim-linux-x86_64/bin/nvim --version
```

直接用这条完整路径就能先试新版。确认 `~/.local/bin/nvim` 没有已有文件或链接后，可建立入口：

```bash
ln -s "$HOME/.local/opt/nvim-linux-x86_64/bin/nvim" "$HOME/.local/bin/nvim"
export PATH="$HOME/.local/bin:$PATH"
hash -r
type -a nvim
nvim --version
```

把 PATH 设置放进正在使用的 Shell 配置文件后才会在新会话中保留；升级和卸载这份用户安装由自己管理，APT 只管理仓库版。要临时回到仓库版可直接运行 `/usr/bin/nvim`，要恢复默认选择则调整自己添加的 PATH 或入口，并重新核对 `type -a nvim`。

`latest` 会随上游发布变化，需要可复现环境时，把链接换成选定的固定版本，并核对发布者提供的校验信息。Arm64 机器应选择对应归档，不能沿用本机的 x86_64 文件名。

### ripgrep 与 fd：分清内容搜索和文件名搜索

`rg` 搜索文件内容，`fdfind` 根据文件名和路径寻找条目。两者默认会跳过许多隐藏文件和被忽略的文件，适合在工程中日常查找；排查“为什么没有结果”时，要把搜索范围、忽略规则和权限一起检查。[^search-tools]

```bash
sudo apt install ripgrep fd-find
rg --version
fdfind --version

# 在当前目录递归搜索内容，输出文件名与行号
rg -n 'TODO' .

# 按普通字符串搜索，避免把字符解释为正则表达式
rg -n -F 'std::vector' .

# 只搜索 C 和 C++ 常见后缀的文件
rg -n -g '*.c' -g '*.cpp' -g '*.h' 'main' .

# 找名字中匹配 init 的 Lua 文件
fdfind -t f -e lua 'init' .

# 列出当前目录中的 Markdown 文件
fdfind -t f -e md . .
```

`rg` 的匹配模式通常按正则表达式解释，`-F` 改为固定字符串；`fdfind` 默认也使用正则表达式，`-e` 按扩展名筛选，`-t f` 限定普通文件。`fdfind -t f -e md . .` 中，第一个 `.` 是匹配模式，第二个 `.` 是搜索目录。

需要查隐藏配置时，可以明确扩大范围：

```bash
rg --hidden -n -g '!.git/**' 'PATH' ~/.config
fdfind --hidden -t f 'zsh' ~
```

`--hidden` 包含隐藏条目，但不等于关闭所有忽略规则；确实需要包含被忽略的文件时，再考虑 `--no-ignore`。大目录、缓存和版本库内部数据可能让搜索变慢，尽量先缩小到目标目录。`rg` 返回状态 1 通常表示没有匹配，状态 2 表示错误，不能把所有非零结果都解释为程序损坏。

Ubuntu 的包名是 `fd-find`，命令名是 `fdfind`；网上示例中的 `fd` 需要按本机实际命令替换。交互时可以添加 `alias fd='fdfind'`，但脚本不会自动获得交互别名，因此脚本应直接使用真实命令名。

### fzf：从候选列表中交互选择

`fzf` 把一组文本条目显示为可筛选列表：输入关键词缩小候选范围，上下移动选择，Enter 确认，Esc 或 `Ctrl + C` 取消。它从标准输入接收候选项，把选中项写到标准输出，所以能接在已有命令之后。[^fzf]

```bash
sudo apt install fzf
fzf --version
printf '%s\n' Ubuntu Debian Fedora Arch | fzf
rg --files | fzf
```

第一条选择示例没有文件操作；第二条列出当前工程中的文件并选择一个。选择器不会自动打开文件，需要由外层命令决定下一步：

```bash
if chosen_file=$(rg --files | fzf); then
    nvim -- "$chosen_file"
fi
```

双引号保留文件名中的空格；`--` 结束编辑器选项解析，避免以 `-` 开头的文件名被当成参数。这个按行传递的示例适合普通工程文件名，文件名包含换行时应改用支持 NUL 分隔的整条流程。

fzf 还可以集成历史搜索和文件选择快捷键，但必须加载与 Shell 对应的脚本。先查看仓库包实际提供的文件：

```bash
dpkg -L fzf | grep -E '(key-bindings|completion)\.(bash|zsh)$'
```

确认路径后，在 `.bashrc` 或 `.zshrc` 中加载对应的脚本。例如，若输出包含 `/usr/share/doc/fzf/examples/key-bindings.bash`，Bash 可以使用：

```bash
if [ -r /usr/share/doc/fzf/examples/key-bindings.bash ]; then
    source /usr/share/doc/fzf/examples/key-bindings.bash
fi
```

Zsh 应使用输出中的 `.zsh` 文件，不能加载这个 `.bash` 文件；使用语法高亮插件时，把 fzf 的按键绑定加载放在高亮插件之前。加载后，新开对应 Shell，再根据安装版文档试用 `Ctrl + R` 等快捷键。当前仓库候选为 fzf `0.44.1`，网上面向新版的 `fzf --bash`、`fzf --zsh` 集成方式不应直接照搬；先看本机 `fzf --help` 和包内说明。

### bat、eza 与 tree：浏览文件和目录

这三个工具分别用于文件内容高亮、增强目录列表、显示目录树。它们改善输出的阅读方式，基础的 `cat`、`ls`、`find` 仍适合许多脚本和通用环境。

```bash
sudo apt install bat eza tree
type -a bat batcat
```

Ubuntu 不同版本中 `bat` 包提供的入口可能叫 `batcat` 或 `bat`，以这次输出和 `dpkg -L bat` 为准。下面假设入口是 `batcat`：[^bat]

```bash
batcat ~/.bashrc
batcat --paging=never --line-range 1:80 ~/.bashrc
```

默认情况下，长文件可能进入分页器，按 `q` 退出；`--paging=never` 禁用分页，`--line-range` 限定显示行范围。高亮、行号与分页属于显示处理，不代表文件已被修改。不要为了统一名字就把 `cat` 全局替换成带装饰输出的命令，脚本需要原始文本时继续使用 `cat`。

目录浏览可以这样使用：[^eza]

```bash
eza -lah
eza --tree --level=2
eza --long --git
tree -L 2 ~/linux-lab
tree -a -L 2 ~/.config
```

`-a` 包含隐藏条目，`--level=2` 或 `-L 2` 限制树的深度；Git 状态显示应在版本库中使用。`eza --icons` 等图标显示需要终端字体包含相应字形，在 WSL 场景中通常要配置 Windows Terminal 使用的字体。没有图标并不影响列表功能。

如果喜欢增强列表，可以新增 `alias ll='eza -lah'` 到当前 Shell 配置中；先确认是否已经存在 `ll`，选择保留一种定义，避免同一个别名在多个位置反复覆盖。

### zoxide：按访问记录跳转目录

`zoxide` 根据访问记录为常用目录建立索引，初始化后提供 `z` 命令。它仍然使用真实目录，索引也需要通过实际访问逐步积累。[^zoxide]

```bash
sudo apt install zoxide
zoxide --version
```

在 Bash 的 `~/.bashrc` 末尾添加：

```bash
eval "$(zoxide init bash)"
```

在 Zsh 的 `~/.zshrc` 中添加对应初始化，放在补全系统初始化之后：

```zsh
eval "$(zoxide init zsh)"
```

只添加当前使用的 Shell 那一段，不需要同时 source 两种配置。新开会话，先用正常的 `cd` 访问几个目录：

```bash
cd ~/linux-lab
cd ~/.config
cd ~
z linux-lab
pwd
zoxide query linux-lab
```

如果没有 `~/linux-lab`，换成自己的真实工程目录。`z linux-lab` 根据索引匹配并切换，`zoxide query linux-lab` 只打印选出的路径。还没有访问记录时可能找不到结果；多个目录名字接近时，应增加关键词并用 `pwd` 确认位置。`zi` 的交互选择依赖 fzf，使用上游新版时还要核对二者的版本要求。

### htop 与 btop：查看资源和进程

本机已有 `top`、`ps`、`free`、`df` 等基础工具，`htop` 与 `btop` 提供集中显示和交互操作。先用一个熟悉进程、CPU、内存的关系即可。[^process-viewers]

```bash
sudo apt install htop
htop
```

在 htop 中，方向键移动选择，`F3` 搜索进程，`F6` 选择排序字段，`F10` 或 `q` 退出；也可以按屏幕底部显示的快捷键操作。终端可能截获功能键，因此应结合实际界面判断。

按 CPU 排序适合找持续计算的进程，按内存排序适合查大内存占用。`VIRT` 是虚拟地址空间，`RES` 是驻留内存，不能看到 VIRT 很大就认为它占满了物理内存。多核环境下，进程 CPU 百分比的显示口径也要结合工具设置理解。

想使用另一种界面时可选择 btop：

```bash
sudo apt install btop
btop
```

这类界面的终止操作会真实影响进程。需要停止任务时先核对 PID、用户和命令，再按第 14 节的方法发信号；不要把进程列表当成可随意清理的缓存列表。

WSL 内看到的是 Linux 进程和分配给 WSL 的资源，Windows 程序、宿主磁盘占用和整机资源仍应结合 Windows 任务管理器查看。工具没有显示某个硬件指标时，也不能直接据此判断硬件失效。

### jq：可靠地读取 JSON

JSON 有对象、数组、字符串、数字和布尔值，字段顺序与排版可以变化。`jq` 按这些结构筛选和转换数据，比用 `grep` 截取固定排版更适合读取 API 返回值和配置文件。[^jq]

```bash
sudo apt install jq
jq --version

printf '%s\n' '{"name":"linux-lab","tools":["zsh","nvim"]}' | jq '.'
printf '%s\n' '{"name":"linux-lab","tools":["zsh","nvim"]}' | jq -r '.name'
printf '%s\n' '{"name":"linux-lab","tools":["zsh","nvim"]}' | jq -r '.tools[]'
```

`.` 表示当前完整值，`.name` 取对象字段，`.tools[]` 遍历数组；`-r` 把字符串作为原始文本输出，否则字符串带有 JSON 引号。过滤表达式放在单引号中，避免其中的字符先被 Shell 展开。

针对自己的 JSON 文件，可以读取 `jq '.' config.json`；没有找到字段时常见输出为 `null`，而格式错误通常会报告解析错误。读取文件不会修改它。需要把转换结果写回时，应先输出到新文件并检查，不要使用 `jq '...' config.json > config.json`，因为重定向会先清空输入文件。

### ShellCheck：检查 Bash 脚本中的常见错误

ShellCheck 对脚本做静态分析，指出引号、变量展开和其他容易出错的写法；它不执行脚本，也不能证明脚本运行结果一定正确。它适合这里的 Bash/sh 脚本，不应当作完整 Zsh 配置检查器。[^shellcheck]

```bash
sudo apt install shellcheck
shellcheck --version
shellcheck ~/linux-lab/scripts/hello.sh
```

最后一条把路径换成自己已保存的 Bash 脚本。脚本开头写明 `#!/usr/bin/env bash`，检查器才能据此选择语法；也可以显式使用 `shellcheck -s bash 文件名`。

例如下面的写法会让包含空格的目录被拆成多个参数：

```bash
cd $work_dir
```

改成 `cd -- "$work_dir"` 保留整个目录参数，并且应处理切换失败，例如 `cd -- "$work_dir" || exit 1`。根据报告的行号和规则编号逐项理解问题，再用实际输入验证；不要为了让检查安静就把所有报告统一忽略。

### delta：更清楚地阅读 Git 差异

delta 是差异显示分页器，Ubuntu 软件包名为 `git-delta`。它改变差异的显示，不改变 Git 工作区、暂存区或提交内容。[^delta]

```bash
sudo apt install git-delta
delta --version

# 在有修改的 Git 仓库中，只对这一次命令使用 delta
git -c core.pager=delta diff
git -c core.pager=delta diff --cached
```

分页界面中按 `q` 退出。第一条 diff 看工作区相对暂存区的修改，第二条看暂存区相对当前提交的修改；没有差异时没有内容可展示。

确定喜欢后，先用 `git config --show-origin --get core.pager` 查看是否已有配置，再决定只设置当前仓库还是设置用户全局。当前仓库可以使用 `git config --local core.pager delta`；如果原来已有值，记录旧值再修改。撤销自己新增的本地值可以用 `git config --local --unset core.pager`，随后会继续继承其他层级配置；原本就有本地设置时，应恢复其旧值。

### 把常用工具连成一个工作流程

进入真实工程后，可以用 zoxide 跳转目录，用 eza 或 tree 看结构，用 fdfind 查文件名，用 rg 查内容，再用 fzf 选择文件交给 nvim。编辑完用 Git 阅读修改，用 ShellCheck 检查 Bash 脚本；任务运行时用已有的 tmux 保留会话，用 htop 查看进程。

例如，下面的组合需要先安装 rg、fzf、nvim，并位于一个包含 Markdown 文件的目录：

```bash
if chosen_note=$(rg --files -g '*.md' | fzf); then
    nvim -- "$chosen_note"
fi
```

选择文件之后才打开编辑器；取消选择则不执行编辑步骤。刚开始可以分开运行 `rg --files -g '*.md'` 和 `fzf`，看清每一步处理的数据，再组成管道。

已有的 tmux 可以直接使用 `tmux new -s study` 创建会话，按 `Ctrl + B` 后按 `d` 脱离，再用 `tmux attach -t study` 回到会话。会话能在关闭终端窗口后继续存在，但 `wsl --shutdown`、Windows 重启或发行版停止仍会终止其中进程。已有的 tldr 可以用 `snap run tldr tar` 查看简短示例，完整参数含义继续查 `man tar`。

安装、个人配置和默认选择是三个步骤：包管理器把程序放到系统中，配置文件决定使用习惯，PATH、别名、默认 Shell 或应用设置决定实际调用谁。每增加一个工具，都可以回到第 27 节的逻辑，用 `type -a`、版本输出和配置位置解释当前行为。

## 29. 资料与相关笔记

本文的软件版本、工具路径、资源容量与失败单元来自本机读取。具体命令在已安装版本中的行为，以 `man`、`--help` 和 Bash 的 `help` 为准。可继续阅读 `man find`、`man grep`、`man rsync`、`man ssh`、`man systemctl`、`man journalctl` 和 `man 5 crontab`。

官方资料按对应主题列在下面，便于查阅更完整的说明。

[^wsl-config]: [Microsoft Learn：WSL 高级设置](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)，对应 `.wslconfig`、`wsl.conf` 的作用范围与重新加载配置。

[^wsl-release]: [微软 WSL 3.0.1 官方发布记录](https://github.com/microsoft/WSL/releases/tag/3.0.1)，对应 2026-10-13 查到的稳定版；[WSL 架构比较](https://learn.microsoft.com/en-us/windows/wsl/compare-versions) 对应 WSL 1、WSL 2 与软件包更新的区别。

[^wsl-commands]: [Microsoft Learn：WSL 基本命令](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)，对应发行版选择、停止、状态与更新。

[^wsl-files]: [Microsoft Learn：在 Windows 与 Linux 文件系统之间工作](https://learn.microsoft.com/en-us/windows/wsl/filesystems)，对应文件放置、路径和跨系统互操作。

[^wsl-export]: [Microsoft Learn：WSL 发行版导出与导入](https://learn.microsoft.com/en-us/windows/wsl/basic-commands#export-a-distribution)，对应完整发行版备份、恢复与注销的区别。

[^wsl-network]: [Microsoft Learn：访问 WSL 网络应用](https://learn.microsoft.com/en-us/windows/wsl/networking)，对应镜像网络、localhost 与代理配置。

[^bash-quoting]: [GNU Bash：引号](https://www.gnu.org/software/bash/manual/html_node/Quoting.html)，对应 Shell 引号的解析规则。

[^bash-expansion]: [GNU Bash：Shell 展开](https://www.gnu.org/software/bash/manual/html_node/Shell-Expansions.html)，对应变量、通配符、花括号和命令替换。

[^bash-pipelines]: [GNU Bash：管道](https://www.gnu.org/software/bash/manual/html_node/Pipelines.html)，对应标准流连接与管道退出状态；完整规则也可查本机 `man bash`。

[^file-modes]: [GNU Coreutils：文件权限结构](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html)，对应读、写、执行及目录权限；[权限设置](https://www.gnu.org/software/coreutils/manual/html_node/Setting-Permissions.html) 解释符号权限写法。

[^apt]: [Ubuntu：安装与管理软件包](https://ubuntu.com/server/docs/how-to/software/package-management/)，对应 APT、dpkg、源文件与交互/脚本接口。

[^nala]: [Ubuntu Noble：Nala 软件包](https://packages.ubuntu.com/noble/nala)；本机还通过 `apt-cache show nala` 与 `apt-cache policy nala` 读取了 Ubuntu 仓库元数据，确认 APT 前端定位、输出与历史功能及当前候选版本。

[^uv-tools]: [Astral uv 官方项目说明](https://github.com/astral-sh/uv)，对应项目、环境、锁文件和 Python 工具管理；[PyPA pipx 官方项目说明](https://github.com/pypa/pipx)，对应独立 Python 应用的隔离安装。

[^python-managed]: [PyPA：外部管理的 Python 环境](https://packaging.python.org/en/latest/specifications/externally-managed-environments/)，对应系统 Python 保护机制与虚拟环境的使用范围。

[^python-venv]: [Python 3.12：虚拟环境与包](https://docs.python.org/3.12/tutorial/venv.html)，对应 venv 创建、激活与 pip。

[^git]: [Git：入门教程](https://git-scm.com/docs/gittutorial)，对应工作区、暂存区和提交的基本操作。

[^zsh-config]: [Zsh 官方手册：启动文件](https://zsh.sourceforge.io/Doc/Release/Files.html)，对应 `.zshrc`、`.zprofile` 与 `ZDOTDIR`；本机安装后还可查 `man zsh` 和 `man zshoptions`。

[^zsh-plugins]: [zsh-autosuggestions 官方安装说明](https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md) 与 [zsh-syntax-highlighting 官方安装说明](https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md)，对应插件加载方式与高亮插件的加载顺序。Ubuntu 包内路径应以 `dpkg -L` 为准。

[^nvim-config]: [Neovim 官方启动说明](https://neovim.io/doc/user/starting/) 与 [Lua 使用说明](https://neovim.io/doc/user/lua/)，对应标准配置目录和 Lua 接口；具体版本优先查询本机 `:help`。

[^lazyvim-version]: [LazyVim 官方要求](https://www.lazyvim.org/)，2026-10-13 查询时最低 Neovim 版本为 `0.11.2`，其他依赖以该页面为准。

[^nvim-install]: [Neovim 官方安装说明](https://github.com/neovim/neovim/blob/master/INSTALL.md)，对应 Linux 预编译归档；下载时应核对 [官方发布页](https://github.com/neovim/neovim/releases) 的稳定版本与架构。

[^search-tools]: [ripgrep 官方项目](https://github.com/BurntSushi/ripgrep) 与 [fd 官方项目](https://github.com/sharkdp/fd)，对应内容搜索、文件名搜索和默认忽略规则；安装版本的参数以 `rg --help`、`fdfind --help` 为准。

[^fzf]: [fzf 官方项目](https://github.com/junegunn/fzf)，对应候选项选择、Shell 集成和版本相关安装方式。

[^bat]: [bat 官方项目](https://github.com/sharkdp/bat)，对应高亮、分页及不同发行版的命令名差异。

[^eza]: [eza 官方项目](https://github.com/eza-community/eza)，对应目录显示、树和 Git 集成。

[^zoxide]: [zoxide 官方项目](https://github.com/ajeetdsouza/zoxide)，对应 Bash/Zsh 初始化、访问记录与交互查询。

[^process-viewers]: [htop 官方网站](https://htop.dev/) 与 [btop 官方项目](https://github.com/aristocratos/btop)，对应交互资源和进程界面。

[^jq]: [jq 官方手册](https://jqlang.org/manual/)，对应 JSON 过滤表达式、遍历与原始字符串输出。

[^shellcheck]: [ShellCheck 官方项目](https://github.com/koalaman/shellcheck)，对应 Bash/sh 静态分析与命令行用法。

[^delta]: [delta 官方项目](https://github.com/dandavison/delta)，对应差异分页显示和 Git 配置。

[^docker-security]: [Docker Engine：安全机制](https://docs.docker.com/engine/security/)，对应 daemon 控制权限与容器隔离范围。

相关笔记：[E3Linux系统安装和基本使用](../一生一芯/E阶段/E3/E3Linux系统安装和基本使用.md)。

