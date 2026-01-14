import { z } from "zod/v4";
import { getOpenRouterClient } from "./client";

type Message = { role: "system" | "user" | "assistant"; content: string };

interface ChatOptions {
	model: string;
	messages: Message[];
	temperature?: number;
	maxTokens?: number;
}

interface StreamChatOptions extends ChatOptions {
	onChunk?: (content: string) => void;
}

/**
 * Standard chat completion.
 * Returns the full response content.
 */
export async function chat(options: ChatOptions): Promise<string> {
	const client = getOpenRouterClient();
	const response = await client.chat.send({
		model: options.model,
		messages: options.messages,
		temperature: options.temperature,
		maxTokens: options.maxTokens,
	});
	const content = response.choices[0]?.message?.content;
	return typeof content === "string" ? content : "";
}

/**
 * Streaming chat completion.
 * Calls onChunk for each received chunk and returns the full content.
 */
export async function streamChat(options: StreamChatOptions): Promise<string> {
	const client = getOpenRouterClient();
	const stream = await client.chat.send({
		model: options.model,
		messages: options.messages,
		temperature: options.temperature,
		maxTokens: options.maxTokens,
		stream: true,
	});

	let fullContent = "";
	for await (const chunk of stream) {
		const content = chunk.choices[0]?.delta?.content ?? "";
		fullContent += content;
		options.onChunk?.(content);
	}
	return fullContent;
}

/**
 * Generate structured output using a Zod schema.
 * Automatically converts to JSON schema and parses the response.
 */
export async function generateStructured<T extends z.ZodType>(options: {
	model: string;
	messages: Message[];
	schema: T;
	schemaName: string;
}): Promise<z.infer<T>> {
	const client = getOpenRouterClient();
	const jsonSchema = z.toJSONSchema(options.schema);

	const response = await client.chat.send({
		model: options.model,
		messages: options.messages,
		responseFormat: {
			type: "json_schema",
			jsonSchema: {
				name: options.schemaName,
				schema: jsonSchema,
				strict: true,
			},
		},
	});

	const rawContent = response.choices[0]?.message?.content;
	const content = typeof rawContent === "string" ? rawContent : "{}";
	return options.schema.parse(JSON.parse(content));
}
