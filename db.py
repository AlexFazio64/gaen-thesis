import re
import psycopg2
from psycopg2 import sql
from sentence_transformers import SentenceTransformer

model= SentenceTransformer('../all-MiniLM-L6-v2/', device='cuda')
print("Model loaded")

dsn = "dbname=monogatari user=alex password=password host=localhost"
query = sql.SQL("""
    SELECT id, (1 - (vec <-> %s)) AS cosine_similarity
    FROM embeddings
    WHERE 1 - (vec <-> %s) >= %s
    ORDER BY cosine_similarity DESC
    LIMIT %s
""")

def tokenize(spoiler: str) -> list[str]:
    """Tokenizes the given text."""
    spoiler = re.sub(r'[^\w\s]', '', spoiler)
    matches = re.findall(r'(?:\w+\s*){,5}', spoiler)
    matches = [match.strip() for match in matches if match != '']
    return matches

def embed_text(text: str):
    """Embeds the given text."""
    return model.encode(text).tolist()

def get_context(text: str, threshold=0.7, limit=3) -> list[str]:
    """Gets the context from the given text."""
    paragraphs = tokenize(text)
    ctx = []
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        for _ in paragraphs:
            emb = str(embed_text(_))
            cur.execute(query, (emb, emb, threshold,limit))
            top_similar_vectors = cur.fetchall()
            for similar in top_similar_vectors:
                ctx.append(similar[0])
        cur.close()
        conn.close()
        ctx = list(set(ctx))
    except:
        print ("Error connecting to the database")
    return ctx

# if __name__ == "__main__":
#     text = """Izuko was the upperclassman of Meme Oshino, Yozuru Kagenui and Deishuu Kaiki during their college days in which they participated in the Occult Research Club together. 
# She seems familiar of her juniors, but has shown some form of dislike towards Yozuru for some reason. 
# She took part in the creation of Yotsugi Ononoki and got cursed as a result - the curse being that she "knows everything".
# She also claims to be Suruga Kanbaru's aunt and Tooe Gaen's sister.
# """
#     print(get_context(text))