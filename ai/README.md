# AI Moderation - Realtime Social Network

## Mục đích

Thư mục này chứa toàn bộ mã nguồn, model, dataset, script phục vụ AI moderation cho mạng xã hội realtime: phát hiện, lọc, cảnh báo nội dung vi phạm quy tắc cộng đồng (text & image).

---

## Cấu trúc thư mục

ai/
├── models/ # Model đã fine-tune (Llama, Llama-Guard, Qwen2.5-VL, ...)
├── datasets/ # Dataset train/fine-tune (ViHSD, custom, ...)
├── scripts/
│ ├── train/ # Script train/fine-tune
│ ├── inference/ # Script inference, demo
│ └── utils/ # Tiện ích: tiền xử lý, convert, ...
├── notebooks/ # Notebook Colab/Jupyter cho SFT, PEFT, test model
├── results/ # Kết quả test, log, báo cáo accuracy, confusion matrix, ...
├── configs/ # File cấu hình YAML/JSON cho training/inference
├── requirements.txt # Thư viện Python cần cài
└── README.md # Hướng dẫn sử dụng

---

## Hướng dẫn sử dụng

**Cài đặt thư viện**

```bash
pip install -r requirements.txt
```

Fine-tune model

Chạy script trong scripts/train/ hoặc notebook trong notebooks/
Ví dụ: python scripts/train/finetune_llama.py --config configs/llama.yaml
Inference / Demo

Chạy script trong scripts/inference/
Ví dụ: python scripts/inference/moderate_text.py --input "text cần kiểm tra"
Dataset

Đặt file dataset vào datasets/ (ví dụ: ViHSD, custom CSV/JSON).
Kết quả

Kết quả test, log, báo cáo sẽ lưu trong results/.
Ghi chú
Model lớn nên không commit file model lên Git, chỉ lưu link download hoặc checkpoint nhỏ.
Có thể sử dụng Colab để fine-tune nhanh với Unsloth, PEFT.
Tham khảo thêm tài liệu trong từng script/notebook.
Mọi thắc mắc về AI moderation, liên hệ nhóm phát triển AI của đề tài.

---
