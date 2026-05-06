# Synthetic Dataset Generator

A powerful Apify Actor that scrapes Q&A data from Reddit and Quora to generate synthetic datasets for LLM fine-tuning.

## Features

✅ Dual-Source Scraping: Extract Q&A pairs from Reddit and Quora  
��� Configurable Filtering: Set minimum answer length, vote thresholds  
✅ Nested Comments: Optionally crawl sub-threads and replies  
✅ Vote Tracking: Capture community engagement metrics  
✅ LLM-Ready Output: Structured JSON perfect for model training  
✅ Source Attribution: Maintains URLs and timestamps  

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/synthetic-dataset-generator
cd synthetic-dataset-generator
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Local Development

Run the Actor locally:
```bash
apify run
```

### Configuration

Edit input via `storage/key_value_stores/default/INPUT.json`:

```json
{
  "startUrls": [
    { "url": "https://www.reddit.com/r/MachineLearning/top/?t=week" },
    { "url": "https://www.quora.com/topic/Machine-Learning" }
  ],
  "maxRequestsPerCrawl": 100,
  "minAnswerLength": 50,
  "includeSubthreads": true,
  "minVotes": 1
}
```

### Deploy to Apify

1. Login to your Apify account:
```bash
apify login
```

2. Push to Apify platform:
```bash
apify push
```

## Output Format

The Actor generates Q&A pairs in this format:

```json
{
  "question": "What is machine learning?",
  "answer": "Machine learning is a subset of AI...",
  "source": "Reddit",
  "url": "https://reddit.com/...",
  "votes": 42,
  "timestamp": "2026-05-06T12:34:56Z"
}
```

## Legal Notice

- Respect Reddit's and Quora's Terms of Service
- Check robots.txt before scraping
- Use responsibly and rate-limit appropriately
- Only scrape publicly available data

## License

ISC