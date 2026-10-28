# V2.5 網路診斷更正（V2.6 補記）

先前未有獨立 V2.5 文件，本檔保存已完成的診斷結論。
網路政策 unrestricted 已生效；HTTP_PROXY／HTTPS_PROXY 保持原值 http://proxy:8080。
預設命令沙箱 TCP 回報 EPERM；經 exec_command 的 with_additional_permissions + network.enabled=true 正式授權，同一代理連線成功。
GitHub、PyPI、Hugging Face、PyTorch CPU wheel index HEAD 均 HTTP 200；HF 模型 URL 302 至 us.aws.cdn.hf.co 後 HTTP 200，下載本文 0 bytes。
這是執行沙箱權限差異，不是已證實的代理故障或域名白名單阻擋。後續安裝與下載使用正式工具網路權限，不變更代理、不關閉 TLS 驗證、不繞過平台控制。
