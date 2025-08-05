export interface TextEmbeddingProvider {
    getEmbeddings(prompt: string): Promise<Array<number>>;
}
