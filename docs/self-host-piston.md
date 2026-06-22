# 自托管代码运行后端（Piston）

线上「在线运行」默认走 **Paiza.IO** 免费公共服务 —— 够小范围试用，但**有速率限制、无 SLA，随时可能像 emkc Piston 那样改白名单关掉**。要稳定 / 可扩展 / 隐私可控，就自己跑一个 Piston。

代码已经写好对接：只要设了环境变量 `CODE_EXEC_PISTON_URL`，`/api/run-code` 就会**优先**走你的 Piston，Paiza 自动退为兜底。语言版本用 `*`（取你装的最新），所以**不用对版本号**。

---

## 0. 为什么要 VPS（不能用 Railway/Render）

Piston 的沙箱要用 Linux cgroups / 特权容器（`--privileged`）。Railway、Render、Vercel 这类平台**不给特权容器**，跑不了。用一台便宜 VPS（Hetzner ~€4/月、DigitalOcean $4–6/月、阿里云轻量都行，**1C1G 起步**），Ubuntu 22.04+。

---

## 1. 装 Docker

SSH 上去：

```bash
curl -fsSL https://get.docker.com | sh
```

## 2. 跑 Piston

```bash
docker run -d --name piston --restart always --privileged \
  -p 2000:2000 ghcr.io/engineer-man/piston
```

> `--privileged` 必须有（沙箱需要）。建议再加资源上限，比如 `--memory=1g --cpus=1`，防滥用。

## 3. 装上要教的语言

Piston 默认不带语言包。先看可装列表，再逐个装（版本用 `*` 取最新）：

```bash
# 看所有可装的语言/版本
curl -s http://localhost:2000/api/v2/packages | python3 -m json.tool | head -60
```

我们这 6 种语言对应的 Piston 语言名（以上面列表里的实际名称为准）：

| 课程语言 | Piston 语言名 |
|---|---|
| C | `c`（通常在 `gcc` 包里） |
| C++ | `c++`（通常在 `gcc` 包里） |
| Java | `java` |
| C# | `csharp`（mono） |
| JavaScript | `node` |
| Visual Basic | `basic.net` |

按列表里的名字逐个安装：

```bash
for L in gcc java csharp node basic.net; do
  curl -s -X POST http://localhost:2000/api/v2/packages \
    -H 'Content-Type: application/json' \
    -d "{\"language\":\"$L\",\"version\":\"*\"}"
  echo
done
```

> 装哪个包提供哪门语言，各版本略有差异——**以 `GET /packages` 的实际列表为准**。装完再 `GET /packages` 确认 `installed: true`。

## 4. 加 HTTPS，拿到对外地址

别直接暴露 `http://<ip>:2000`。用 Caddy 一行上 HTTPS（自动证书）：

```bash
# 先把域名 A 记录指到这台 VPS，然后：
docker run -d --name caddy --restart always --network host \
  caddy caddy reverse-proxy --from https://piston.你的域名.com --to localhost:2000
```

得到对外地址：`https://piston.你的域名.com`

## 5. 在 Vercel 填环境变量

Vercel 项目 → **Settings → Environment Variables**，新增：

```
CODE_EXEC_PISTON_URL = https://piston.你的域名.com/api/v2/execute
```

（注意结尾是 `/api/v2/execute`。）然后**重新部署一次**生效。

## 6. 验证

直接打你的 Piston：

```bash
curl -s -X POST https://piston.你的域名.com/api/v2/execute \
  -H 'Content-Type: application/json' \
  -d '{"language":"java","version":"*","files":[{"name":"Main.java","content":"public class Main{public static void main(String[] a){System.out.println(42);}}"}]}'
```

返回里 `run.stdout` 是 `42` 就成了。再在站内登录、跑一段非 Python 代码确认。

---

## 备选：Judge0

不想维护 VPS，也可以用 [Judge0](https://github.com/judge0/judge0)（自托管同样要特权容器，或用 RapidAPI 免费档但要 key、有每日额度）。但**我们的 `run-code` 现在按 Piston 的 API 对接**，换 Judge0 要改 `runViaPiston` 那段适配 Judge0 的接口（submissions 提交 + base64 + 轮询）。需要的话再说。
