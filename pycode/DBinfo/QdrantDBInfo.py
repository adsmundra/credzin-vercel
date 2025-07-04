from DataLoaders.QdrantDB import qdrantdb_client

qdrant_client = qdrantdb_client()
# collection_info = qdrant_client.get_collection("blogger_KB_hybrid")
# print(collection_info)


collections = qdrant_client.get_collections()
print(collections)


