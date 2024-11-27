import { Hono } from 'hono';
import { extractText, getDocumentProxy } from 'unpdf';
import { nanoid } from 'nanoid';

const PROMPT = `
You are a helpful AI assistant. You answer questions based on the context provided. You only have to use the provided context. If you don't know the answer, reply that you don't know. You can also ask for more context if you need it.
`;

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('Hono!'));

app.post('/api/file', async (c) => {
	const formData = await c.req.formData();

	const file = formData.get('file') as File;

	try {
		// Upload the file to the bucket
		await c.env.MY_BUCKET.put(file.name, file);

		// Extract the content
		const buffer = await file.arrayBuffer();
		const document = await getDocumentProxy(new Uint8Array(buffer));

		const { text } = await extractText(document, { mergePages: true });
		console.log(`Extracted text: ${text.substring(0, 100)}...`);

		const summary = await createSummary(text, c.env.AI);
		await createVector(text, c.env);

		return c.json({ summary });
	} catch (e: any) {
		return c.json({ error: e.message });
	}
});

app.post('/api/chat', async (c) => {
	const { userMessage } = await c.req.json();

	const queryVector = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
		text: [userMessage],
	});

	const matches = await c.env.VECTORIZE.query(queryVector.data[0], { topK: 5, returnMetadata: true });

	const textMatches = matches.matches.map((match) => match.metadata?.text).join('\n\n');

	const messages = [
		{ role: 'system', content: PROMPT + textMatches },
		{
			role: 'user',
			content: userMessage,
		},
	];

	const aiResponse = await c.env.AI.run(
		'@cf/meta/llama-3.2-3b-instruct',
		{ messages },
		{
			gateway: {
				id: 'workshop',
				skipCache: false,
				cacheTtl: 3360,
			},
		}
	);

	return c.json({ aiResponse });
});

const createSummary = async (text: string, AI: Ai) => {
	const result: AiSummarizationOutput = await AI.run(
		'@cf/facebook/bart-large-cnn',
		{
			input_text: text,
		},
		{
			gateway: {
				id: 'workshop',
				skipCache: false,
				cacheTtl: 3360,
			},
		}
	);
	const summary = result.summary;
	return summary;
};

const createVector = async (text: string, env: Env) => {
	console.log('Creating vector');

	// Create chunk of text
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
	for (let i = 0; i < sentences.length; i += 5) {
		// Create vector for the paragraph

		const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
			text: [sentences.slice(i, i + 5).join(' ')],
		});

		const values = data[0];

		if (!values) {
			return { message: 'Failed to generate vector embedding', status: 500 };
		}

		// Insert the vector into the vector database
		try {
			await env.VECTORIZE.upsert([
				{
					id: nanoid(),
					metadata: {
						text: sentences.slice(i, i + 5).join(' '),
					},
					values,
				},
			]);
		} catch (e: any) {
			console.log(e.message);
			return { message: 'Failed to insert vector into the database', status: 500 };
		}
		console.log('Vector created');
	}
};

export default app;
