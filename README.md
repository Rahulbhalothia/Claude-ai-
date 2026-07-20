# Claude Clone

Chat app jo Anthropic API ko Flask proxy ke through call karta hai, streaming response ke saath.

## Local run karne ke liye

```bash
pip install -r requirements.txt
cp .env.example .env
# .env file khol ke apni ANTHROPIC_API_KEY daal do
python app.py
```

Fir browser mein `http://localhost:5000` khol lo.

### .env file setup
`.env.example` ko copy karke `.env` banao:
```bash
cp .env.example .env
```
Fir `.env` file mein apni real API key daal do:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxx
```
`.env` file ko kabhi GitHub pe push mat karna — `.gitignore` mein already add hai.

Groq key yahan se milti hai: https://console.groq.com/keys (free tier available hai).

## Render pe deploy karne ke liye

1. Is folder ko GitHub repo mein push karo
2. Render.com pe naya **Web Service** banao, repo connect karo
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Environment variable add karo: `GROQ_API_KEY` = tumhari key
6. Deploy karo — Render automatically `PORT` env var set karta hai jo app already read kar raha hai

## Features

- Dark theme, Claude.ai jaisa look (terracotta accent)
- Real-time streaming response (typing effect)
- Markdown + syntax-highlighted code blocks
- Multiple conversations, sidebar history (localStorage mein save hoti hai)
- Mobile responsive, collapsible sidebar
