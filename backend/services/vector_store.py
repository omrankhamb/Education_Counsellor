"""
Vector Store Service using Persistent ChromaDB
Provides semantic vector search across all India college brochures, cutoffs, and admissions data.
"""

import os
import chromadb
from typing import List, Dict, Any, Optional

VECTOR_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vector_store")
COLLECTION_NAME = "all_india_colleges"

_client = None
_collection = None

def get_chroma_client():
    global _client
    if _client is None:
        os.makedirs(VECTOR_DB_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=VECTOR_DB_DIR)
    return _client

def get_colleges_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "All India College Cutoffs, Brochures, and Admission Rules"}
        )
    return _collection

def build_college_document_text(c: Dict[str, Any]) -> str:
    """Format rich unstructured college text for semantic vector embedding."""
    trend = c.get("five_year_trend", {})
    trend_str = ", ".join([f"{k}: {v}" for k, v in trend.items()]) if trend else "N/A"
    
    categories = c.get("category_cutoffs", {})
    cat_str = ""
    if categories:
        cat_items = []
        for cat_k, cat_v in list(categories.items())[:4]:
            cat_items.append(f"{cat_k} 2024: {cat_v.get('2024', 'N/A')}")
        cat_str = " | Category Cutoffs: " + ", ".join(cat_items)

    facilities_str = ", ".join(c.get("facilities", [])) if isinstance(c.get("facilities"), list) else str(c.get("facilities", ""))

    loc = c.get("location", {})
    if isinstance(loc, dict):
        loc_str = f"{loc.get('city', '')}, {loc.get('state', '')}".strip(", ")
    else:
        loc_str = str(loc)

    text = (
        f"College: {c.get('college_name')} ({c.get('college_code', '')})\n"
        f"Location: {loc_str}\n"
        f"Stream: {c.get('stream', '')} | Exam Type: {c.get('exam_type', '')}\n"
        f"Branch: {c.get('branch_name', c.get('branch', 'General Program'))}\n"
        f"Type: {c.get('college_type', 'Autonomous / Government')} | Rating: {c.get('rating', 4.5)}/5.0\n"
        f"2024 Closing Cutoff: {c.get('cutoff_marks')} ({c.get('score_unit', 'percentile')})\n"
        f"5-Year Cutoff Trajectory (2022-2026): {trend_str}{cat_str}\n"
        f"Annual Fees: ₹{c.get('annual_fees_inr', c.get('annual_fees', 100000)):,} INR\n"
        f"NIRF / State Ranking: {c.get('nirf_rank', 'Top Ranked')}\n"
        f"Placements: Average CTC {c.get('placement_avg', '₹8.5 LPA')}, Highest CTC {c.get('placement_high', '₹35.0 LPA')}\n"
        f"Established: {c.get('established', 1990)} | Campus Facilities: {facilities_str}\n"
        f"Admission Highlights: {c.get('why_recommended', 'Premier institution in India.')}\n"
        f"Official Gazette Source: {c.get('source_document', 'Official Centralized Counseling Master Gazette')}"
    )
    return text

def index_colleges_into_vector_db(colleges: List[Dict[str, Any]]) -> int:
    """Index an array of college dictionaries into persistent ChromaDB collection."""
    coll = get_colleges_collection()
    
    documents = []
    metadatas = []
    ids = []
    
    for idx, c in enumerate(colleges):
        doc_text = build_college_document_text(c)
        loc = c.get("location", {})
        state = loc.get("state", "India") if isinstance(loc, dict) else "India"
        city = loc.get("city", "") if isinstance(loc, dict) else ""
        
        cid = str(c.get("college_code") or f"COL-{idx+1}-{c.get('college_name', '')[:10].replace(' ', '_')}")
        meta = {
            "college_name": str(c.get("college_name", "")),
            "stream": str(c.get("stream", "")),
            "exam_type": str(c.get("exam_type", "")),
            "state": str(state),
            "city": str(city),
            "cutoff_2024": float(c.get("cutoff_marks", 0.0)),
            "score_unit": str(c.get("score_unit", "percentile")),
            "annual_fees": int(c.get("annual_fees_inr", c.get("annual_fees", 100000))),
            "source_document": str(c.get("source_document", "Official Master Gazette"))
        }
        
        documents.append(doc_text)
        metadatas.append(meta)
        ids.append(cid)
    
    # ChromaDB accepts batches up to 500
    batch_size = 200
    for i in range(0, len(documents), batch_size):
        b_docs = documents[i:i+batch_size]
        b_metas = metadatas[i:i+batch_size]
        b_ids = ids[i:i+batch_size]
        coll.upsert(
            documents=b_docs,
            metadatas=b_metas,
            ids=b_ids
        )
        
    return len(documents)

def search_colleges_semantic(query: str, n_results: int = 5, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Perform semantic vector search on ChromaDB for conversational queries.
    Returns matched documents, metadata, and similarity distances.
    """
    try:
        coll = get_colleges_collection()
        if coll.count() == 0:
            return []
            
        kwargs = {
            "query_texts": [query],
            "n_results": min(n_results, coll.count())
        }
        if where:
            kwargs["where"] = where
            
        results = coll.query(**kwargs)
        
        matches = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [{}] * len(docs)
            dists = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)
            
            for doc, meta, dist in zip(docs, metas, dists):
                matches.append({
                    "document": doc,
                    "metadata": meta,
                    "distance": dist
                })
        return matches
    except Exception as e:
        print(f"[VectorStore] Semantic search error: {e}")
        return []

def get_vector_db_stats() -> Dict[str, Any]:
    """Retrieve vector store stats and count."""
    try:
        coll = get_colleges_collection()
        return {
            "status": "ready",
            "collection_name": COLLECTION_NAME,
            "total_embeddings": coll.count(),
            "storage_path": VECTOR_DB_DIR
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
