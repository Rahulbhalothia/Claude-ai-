# Claude Clone

Chat app jo Anthropic API ko Flask proxy ke through call karta hai, streaming response ke saath.

## Local run karne ke liye

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key-here"
python app.py
```

Fir browser mein `http://localhost:5000` khol lo.

## Render pe deploy karne ke liye

1. Is folder ko GitHub repo mein push karo
2. Render.com pe naya **Web Service** banao, repo connect karo
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Environment variable add karo: `ANTHROPIC_API_KEY` = tumhari key
6. Deploy karo — Render automatically `PORT` env var set karta hai jo app already read kar raha hai

## Features

- Dark theme, Claude.ai jaisa look (terracotta accent)
- Real-time streaming response (typing effect)
- Markdown + syntax-highlighted code blocks
- Multiple conversations, sidebar history (localStorage mein save hoti hai)
- Mobile responsive, collapsible sidebar
