# Chat with PDF

This project allows users to upload a PDF file, generate a summary using AI, and interact with the AI to ask questions about the PDF content.

## Features

- Upload PDF files to [Cloudflare R2](https://developers.cloudflare.com/r2/)
- Generate summaries using [Workers AI](https://developers.cloudflare.com/workers-ai/)
- Create vector embeddings and store them in [Vectorize](https://developers.cloudflare.com/vectorize/)
- Chat with AI to ask questions about the PDF content

## Installation

1. Clone the repository:

```sh
git clone https://github.com/harshil1712/chat-with-pdf
cd chat-with-pdf
```

2. Install dependencies:

```sh
npm install
```

3. Create an R2 bucket and update the binding in the `wrangler.toml` file. Follow the [documentation](https://developers.cloudflare.com/r2/buckets/create-buckets/) to learn how to create a new bucket.

4. Create a Vectorize database and update the bindings in the `wrangler.toml` file. Follow the [documentation](https://developers.cloudflare.com/vectorize/best-practices/create-indexes/) to learn how to do this.

## Development

To start the development server, run:

```sh
npm run dev
```

Navigate to `localhost:8787` to view the app.

## Deployment

To deploy the project, use

```sh
npm run deploy
```

## Contributions

Contributions are welcome. Please open an issue to report any bugs.
