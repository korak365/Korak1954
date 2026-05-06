/*
  Apify Actor: Synthetic Dataset Generator
  Scrapes Reddit and Quora to create Q&A pairs for LLM fine-tuning.
  Uses CheerioCrawler (fast, HTTP-based). Does NOT run page JS.
*/

import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';

// Initialize the Actor
await Actor.init();

// Load input
const { 
    startUrls = ['https://www.reddit.com/r/MachineLearning/top/?t=week'],
    maxRequestsPerCrawl = 100,
    minAnswerLength = 50,
    includeSubthreads = true,
    minVotes = 1
} = (await Actor.getInput()) ?? {};

// Create proxy configuration (recommended on Apify)
const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    async requestHandler({ enqueueLinks, request, $, log }) {
        const url = request.loadedUrl;
        log.info(`Processing: ${url}`);

        try {
            if (url.includes('reddit.com')) {
                await extractRedditQA($, url, log);
            } else if (url.includes('quora.com')) {
                await extractQuoraQA($, url, log);
            }
        } catch (err) {
            log.warning('Failed to extract Q&A from page', { url, error: err.message });
        }

        if (includeSubthreads) {
            await enqueueLinks({
                globs: [
                    '**/r/*/comments/**',
                    '**/quora.com/*/*/answer/**',
                    '**/quora.com/question/**'
                ]
            });
        }
    },
});

// Helper: extract from Reddit (static HTML via Cheerio)
async function extractRedditQA($, url, log) {
    const question = $('h1, .Post > h3').first().text().trim() || $('title').text().trim();

    // Comments selectors are best-effort and may need updates
    const comments = $('[data-testid="comment"], .Comment, .entry .md');

    comments.each(async (i, el) => {
        const answerText = $(el).text().trim().replace(/\s+/g, ' ');
        // Try to find votes - fallback to 0
        let votes = 0;
        const voteEl = $(el).closest('[data-test-id]').find('[aria-label*="upvote"], .score');
        if (voteEl && voteEl.length) {
            const v = voteEl.first().text().match(/\d+/);
            votes = v ? parseInt(v[0], 10) : 0;
        }

        if (answerText.length >= minAnswerLength && votes >= minVotes) {
            await Dataset.pushData({
                question,
                answer: answerText,
                source: 'Reddit',
                url,
                votes,
                timestamp: new Date().toISOString()
            });
            log.info('Saved Reddit Q&A', { url, votes });
        }
    });
}

// Helper: extract from Quora (static HTML best-effort)
async function extractQuoraQA($, url, log) {
    const question = $('h1.PageTitle_pageTitle__wI9yY, .Question__title, h1').first().text().trim();

    // Answers - selector best-effort
    const answers = $('[data-testid="answer"], .Answer, .q-relative.contrib-answer');

    answers.each(async (i, el) => {
        const answerText = $(el).find('span[dir="ltr"], .Answer__content, .ui_qtext_rendered_qtext').text().trim().replace(/\s+/g, ' ');
        let votes = 0;
        const voteAttr = $(el).find('[data-testid="upvote"], .VoterWeight').attr('aria-label');
        if (voteAttr) {
            const m = voteAttr.match(/\d+/);
            votes = m ? parseInt(m[0], 10) : 0;
        }

        if (answerText.length >= minAnswerLength && votes >= minVotes) {
            await Dataset.pushData({
                question,
                answer: answerText,
                source: 'Quora',
                url,
                votes,
                timestamp: new Date().toISOString()
            });
            log.info('Saved Quora Q&A', { url, votes });
        }
    });
}

await crawler.run(startUrls);
console.log('Actor finished - Q&A dataset ready.');
await Actor.exit();