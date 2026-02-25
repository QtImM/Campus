import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
# 如果有 OpenAI API Key，可以使用 OpenAIEmbeddings
# from langchain_openai import OpenAIEmbeddings

def build_rag_knowledge_base(pdf_path: str, persist_directory: str = "chroma_db"):
    """
    读取 PDF，分块并存入向量数据库
    """
    if not os.path.exists(pdf_path):
        print(f"错误: 找不到文件 {pdf_path}")
        return

    # 1. 加载数据
    print(f"正在加载文档: {pdf_path}...")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    # 2. 文本分块 (Chunking) 核心逻辑
    # 设置原因:
    # chunk_size (分块大小): 设置为 500。
    #   原因: 500 左右是语义单元（如段落）的常见长度，能够包含足够的上下文供 LLM 理解，
    #   同时避免单块过长导致向量编码后的语义被稀释，且在检索时能返回更精确的片段。
    # chunk_overlap (块重叠): 设置为 50。
    #   原因: 10% 的重叠度可以确保跨块的语义（如一个句子被切断）在相邻块中都有保留，
    #   防止检索时因切分在关键词中间而导致语义断层，提高检索的连贯性。
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_documents(documents)
    print(f"文档切分完成，共生成 {len(chunks)} 个分块。")

    # 3. 向量化 (Embedding)
    print("开始向量化并存入 ChromaDB (使用本地 HuggingFace 模型)...")
    # 使用本地免费开源模型 sentence-transformers/all-MiniLM-L6-v2, 适合轻量级任务
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # 初始化并持久化向量库
    vector_db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    print(f"知识库构建成功，已保存至: {persist_directory}")
    return vector_db

def query_test(vector_db, query_text: str):
    """
    验证: 检索最相关的 3 个文档块
    """
    print(f"\n用户提问: {query_text}")
    print("-" * 30)
    
    # 检索前 3 个最相关的结果
    results = vector_db.similarity_search(query_text, k=3)
    
    for i, doc in enumerate(results):
        print(f"相关块 {i+1}:\n{doc.page_content}\n")
        print("-" * 15)

if __name__ == "__main__":
    # 配置路径
    PDF_FILE = "course_info.pdf"  # 请确保该文件位于工程根目录下
    DB_DIR = "data/chroma_db"
    
    # 构建知识库
    db = build_rag_knowledge_base(PDF_FILE, DB_DIR)
    
    # 验证测试
    if db:
        test_query = "这门课的考核方式是什么？"
        query_test(db, test_query)
