from typing import List, Dict, Any
from neo4j import GraphDatabase
from langchain.graphs import Neo4jGraph

class CreditCardGraphSchema:
    def __init__(self, uri: str, user: str, password: str):
        self.graph = Neo4jGraph(
            url=uri,
            username=user,
            password=password
        )
        
    def create_schema(self):
        """Create the graph schema for credit card data"""
        schema_queries = [
            # Card constraints
            "CREATE CONSTRAINT card_id IF NOT EXISTS FOR (c:Card) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT card_name IF NOT EXISTS FOR (c:Card) REQUIRE c.name IS UNIQUE",
            
            # Feature constraints
            "CREATE CONSTRAINT feature_name IF NOT EXISTS FOR (f:Feature) REQUIRE f.name IS UNIQUE",
            "CREATE CONSTRAINT feature_type IF NOT EXISTS FOR (f:Feature) REQUIRE f.type IS NOT NULL",
            
            # Category constraints
            "CREATE CONSTRAINT category_name IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE",
            
            # Relationship constraints
            "CREATE CONSTRAINT has_feature IF NOT EXISTS FOR ()-[r:HAS_FEATURE]-() REQUIRE r.value IS NOT NULL",
            "CREATE CONSTRAINT belongs_to IF NOT EXISTS FOR ()-[r:BELONGS_TO]-() REQUIRE r.weight IS NOT NULL"
        ]
        
        for query in schema_queries:
            self.graph.query(query)
    
    def create_indexes(self):
        """Create indexes for better query performance"""
        index_queries = [
            # Text search indexes
            "CREATE FULLTEXT INDEX card_name_index IF NOT EXISTS FOR (c:Card) ON (c.name)",
            "CREATE FULLTEXT INDEX feature_name_index IF NOT EXISTS FOR (f:Feature) ON (f.name)",
            
            # Vector indexes for embeddings
            "CREATE VECTOR INDEX card_embedding_index IF NOT EXISTS FOR (c:Card) ON (c.embedding) OPTIONS {indexConfig: {`vector.dimensions`: 768, `vector.similarity`: 'cosine'}}",
            "CREATE VECTOR INDEX feature_embedding_index IF NOT EXISTS FOR (f:Feature) ON (f.embedding) OPTIONS {indexConfig: {`vector.dimensions`: 768, `vector.similarity`: 'cosine'}}"
        ]
        
        for query in index_queries:
            self.graph.query(query)
    
    def create_relationships(self):
        """Create relationship types and their properties"""
        relationship_queries = [
            # Card to Feature relationships
            """
            MATCH (c:Card), (f:Feature)
            WHERE c.id = $card_id AND f.name = $feature_name
            MERGE (c)-[r:HAS_FEATURE {value: $value}]->(f)
            """,
            
            # Card to Category relationships
            """
            MATCH (c:Card), (cat:Category)
            WHERE c.id = $card_id AND cat.name = $category_name
            MERGE (c)-[r:BELONGS_TO {weight: $weight}]->(cat)
            """,
            
            # Feature to Feature relationships (for related features)
            """
            MATCH (f1:Feature), (f2:Feature)
            WHERE f1.name = $feature1_name AND f2.name = $feature2_name
            MERGE (f1)-[r:RELATED_TO {strength: $strength}]->(f2)
            """
        ]
        
        return relationship_queries
    
    def get_verification_query(self, query: str) -> str:
        """Generate verification query based on input query"""
        return f"""
        MATCH (c:Card)-[r:HAS_FEATURE]->(f:Feature)
        WHERE c.name CONTAINS $query 
           OR f.name CONTAINS $query
           OR f.value CONTAINS $query
        WITH c, f, r
        OPTIONAL MATCH (c)-[:BELONGS_TO]->(cat:Category)
        RETURN c.name as card_name,
               f.name as feature_name,
               r.value as feature_value,
               cat.name as category,
               c.embedding as card_embedding,
               f.embedding as feature_embedding
        """
    
    def get_hybrid_search_query(self, query: str, limit: int = 5) -> str:
        """Generate hybrid search query combining vector and graph search"""
        return f"""
        CALL db.index.vector.queryNodes('card_embedding_index', $limit, $query_embedding) YIELD node as card, score
        MATCH (card)-[r:HAS_FEATURE]->(f:Feature)
        WITH card, f, r, score
        OPTIONAL MATCH (card)-[:BELONGS_TO]->(cat:Category)
        RETURN card.name as card_name,
               f.name as feature_name,
               r.value as feature_value,
               cat.name as category,
               score as similarity_score
        ORDER BY score DESC
        LIMIT $limit
        """ 