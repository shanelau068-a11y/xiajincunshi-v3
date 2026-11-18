# GitHub 私人备份与同步记录

更新时间：2026-11-18

## 仓库用途

- 正式网站与公开部署源码：<https://github.com/shanelau068-a11y/xiajincunshi-v3>
- GitHub Pages：<https://shanelau068-a11y.github.io/xiajincunshi-v3/>
- 私人完整源码备份：<https://github.com/shanelau068-a11y/xiajincunshi-v3-private>

私人仓库是额外的 Git 备份，不是网站运行服务器。它包含本项目当前跟踪的源码、JSON 村史资料与网站图像文件及 Git 历史。正式站点仍由公开仓库部署，不能把私人副本当成隐藏已公开网站内容的办法。

## 2026-11-18 同步过程

1. 检查当前本地仓库 `E:\Shane\261112村史项目`，发现它跟踪公开 `origin/main`，当时本地提交为 `fed80e085f10fdf5a94e47c8f54da34cba2144d1`。
2. 远程 API 和 `git ls-remote` 显示 GitHub 实际已经到 `b9129d8c4b0f361d72fd174714de192609502d6d`。随后 `git fetch origin` 发现公开远端领先两个提交。
3. 先检查差异，再以 `git pull --ff-only origin main` 安全快进，没有强制覆盖。取回的提交为：`682e9a8`（时间筛选、图注、文档与图片体积优化）和 `b9129d8`（依用户确认统一首页和补充旧照地名为“弯堤脚”）。
4. 快进后，本地 `HEAD` 与公开仓库 `refs/heads/main` 同为 `b9129d8c4b0f361d72fd174714de192609502d6d`。
5. 加入本交接说明、维护规则和私有备份 remote；同一个最终文档提交推到公开 `origin/main` 和私人 `private/main`。

完成推送后，应现场复核两端仓库可见性和 `refs/heads/main` SHA；本文件不硬编码会随下一次提交改变的“最新 SHA”。若后续发生任一端未 push 成功，及时更新本记录，不能继续沿用旧的“已同步”结论。

## 常用操作

```powershell
git remote -v
git fetch origin
git status -sb
git rev-parse HEAD
git ls-remote origin refs/heads/main
git ls-remote private refs/heads/main
```

公开与私人两个 `main` 必须指向同一 SHA 才表示代码完整双向备份。Pages Actions 成功并通过正式 URL 检查，才表示对外网站已更新。GitHub 认证由当前机器已有的 `gh` 凭据处理；不要把 token、Cookies 或请求头写进脚本、文档或仓库。

## 恢复到新电脑

```powershell
git clone https://github.com/shanelau068-a11y/xiajincunshi-v3-private.git
cd xiajincunshi-v3-private
npm ci
npm run check:data
npm test
npm run build
```

上述步骤可从备份编译本地网站。要发布正式站点，再添加公开仓库为 `site` remote，并确认自己有对应写权限：

```powershell
git remote add site https://github.com/shanelau068-a11y/xiajincunshi-v3.git
git remote -v
git push site main
```

私人仓库凭账号访问。GitHub Pages 仅配置在公开仓库；私人仓库里的 Pages workflow 会跳过构建/部署 job。
